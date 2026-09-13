import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import {
  app,
  request,
  auth,
  connectTestDb,
  resetDb,
  disconnectTestDb,
  makeUser,
  makeProject,
  makeBug,
} from "./helpers.js";

let admin, reporter, project, bug;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await resetDb();
  admin = await makeUser({ name: "Ada Admin", email: "admin@test.dev" });
  reporter = await makeUser({ name: "Rita Reporter", email: "rita@test.dev" });
  project = await makeProject({ key: "TL" });
  bug = await makeBug(reporter, { project, severity: "Minor", priority: "Low" });
});

const timeline = (user) => request(app).get(`/api/bugs/${bug._id}/timeline`).set(auth(user));

describe("activity log", () => {
  it("records creation", async () => {
    const res = await timeline(reporter);
    const created = res.body.items.find((i) => i.type === "created");
    expect(created.actor.name).toBe("Rita Reporter");
  });

  it("records each changed field with who changed it and the before/after", async () => {
    await request(app)
      .patch(`/api/bugs/${bug._id}`)
      .set(auth(admin))
      .field("status", "In Progress")
      .field("severity", "Blocker");

    const items = (await timeline(reporter)).body.items;
    const status = items.find((i) => i.type === "status");
    const severity = items.find((i) => i.type === "severity");
    const level = items.find((i) => i.type === "priorityLevel");

    expect(status).toMatchObject({ from: "Open", to: "In Progress" });
    expect(status.actor.name).toBe("Ada Admin");
    expect(severity).toMatchObject({ from: "Minor", to: "Blocker" });
    expect(level).toMatchObject({ from: "P3", to: "P1" });
  });

  it("records assignee changes with names, not ids", async () => {
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("assignee", reporter.id);
    const entry = (await timeline(admin)).body.items.find((i) => i.type === "assignee");
    expect(entry).toMatchObject({ from: "Unassigned", to: "Rita Reporter" });
  });

  it("does not record anything when nothing actually changed", async () => {
    const before = (await timeline(admin)).body.items.length;
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("status", "Open");
    const after = (await timeline(admin)).body.items.length;
    expect(after).toBe(before);
  });
});

describe("comments", () => {
  it("posts, edits and deletes with the right permissions", async () => {
    const posted = await request(app)
      .post(`/api/bugs/${bug._id}/comments`)
      .set(auth(reporter))
      .send({ body: "Happens on Safari only" });
    expect(posted.body.comment.body).toBe("Happens on Safari only");

    const id = posted.body.comment._id;

    await request(app)
      .patch(`/api/bugs/${bug._id}/comments/${id}`)
      .set(auth(admin))
      .send({ body: "hijack" })
      .expect(403);

    const edited = await request(app)
      .patch(`/api/bugs/${bug._id}/comments/${id}`)
      .set(auth(reporter))
      .send({ body: "Happens on Safari and Firefox" });
    expect(edited.body.comment.editedAt).toBeTruthy();

    await request(app).delete(`/api/bugs/${bug._id}/comments/${id}`).set(auth(admin)).expect(204);
  });

  it("rejects an empty comment", async () => {
    await request(app).post(`/api/bugs/${bug._id}/comments`).set(auth(admin)).send({ body: "   " }).expect(400);
  });

  it("hides the timeline of a bug the user cannot see", async () => {
    const stranger = await makeUser({ name: "Stranger", email: "stranger@test.dev" });
    await request(app).get(`/api/bugs/${bug._id}/timeline`).set(auth(stranger)).expect(404);
  });
});

describe("notifications", () => {
  const inbox = (user) => request(app).get("/api/notifications").set(auth(user));

  it("notifies the reporter on status change, but never the actor", async () => {
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("status", "In Progress");

    const mine = await inbox(reporter);
    expect(mine.body.unreadCount).toBe(1);
    expect(mine.body.notifications[0].type).toBe("status");

    const theirs = await inbox(admin);
    expect(theirs.body.notifications).toHaveLength(0);
  });

  it("notifies the new assignee", async () => {
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("assignee", reporter.id);
    const mine = await inbox(reporter);
    expect(mine.body.notifications.some((n) => n.type === "assigned")).toBe(true);
  });

  it("notifies the reporter about a comment from someone else only", async () => {
    await request(app).post(`/api/bugs/${bug._id}/comments`).set(auth(admin)).send({ body: "looking into it" });
    await request(app).post(`/api/bugs/${bug._id}/comments`).set(auth(reporter)).send({ body: "thanks" });

    const mine = await inbox(reporter);
    expect(mine.body.notifications.filter((n) => n.type === "comment")).toHaveLength(1);
  });

  it("marks everything read", async () => {
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("status", "In Progress");
    await request(app).post("/api/notifications/read-all").set(auth(reporter));
    const mine = await inbox(reporter);
    expect(mine.body.unreadCount).toBe(0);
  });
});
