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

let admin, reporter, other, project;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await resetDb();
  admin = await makeUser({ name: "Ada Admin", email: "admin@test.dev" }); // first user → Admin
  reporter = await makeUser({ name: "Rita Reporter", email: "rita@test.dev" });
  other = await makeUser({ name: "Otto Other", email: "otto@test.dev" });
  project = await makeProject({ key: "RBAC" });
});

describe("bootstrap roles", () => {
  it("makes the first registered user an Admin and everyone after a Reporter", () => {
    expect(admin.role).toBe("Admin");
    expect(reporter.role).toBe("Reporter");
  });
});

describe("visibility scoping", () => {
  it("shows a reporter only bugs they reported or are assigned to", async () => {
    await makeBug(reporter, { project, title: "Mine" });
    await makeBug(other, { project, title: "Not mine" });

    const mine = await request(app).get("/api/bugs").set(auth(reporter));
    expect(mine.body.bugs.map((b) => b.title)).toEqual(["Mine"]);

    const all = await request(app).get("/api/bugs").set(auth(admin));
    expect(all.body.bugs).toHaveLength(2);
  });

  it("404s a reporter reading someone else's bug but serves their own", async () => {
    const mine = await makeBug(reporter, { project });
    const theirs = await makeBug(other, { project });

    await request(app).get(`/api/bugs/${mine._id}`).set(auth(reporter)).expect(200);
    await request(app).get(`/api/bugs/${theirs._id}`).set(auth(reporter)).expect(404);
  });

  it("scopes stats to the reporter's own bugs", async () => {
    await makeBug(reporter, { project, severity: "Blocker", priority: "Urgent" });
    await makeBug(other, { project });

    const stats = await request(app).get("/api/bugs/stats").set(auth(reporter));
    expect(stats.body.total).toBe(1);
    expect(stats.body.byPriorityLevel).toEqual({ P0: 1 });
  });
});

describe("elevated-only actions", () => {
  it("blocks a reporter from setting Verified or Reopened", async () => {
    const bug = await makeBug(reporter, { project });

    for (const status of ["Verified", "Reopened"]) {
      const res = await request(app).patch(`/api/bugs/${bug._id}`).set(auth(reporter)).field("status", status);
      expect(res.status).toBe(403);
    }

    const ok = await request(app).patch(`/api/bugs/${bug._id}`).set(auth(reporter)).field("status", "In Progress");
    expect(ok.body.bug.status).toBe("In Progress");
  });

  it("lets an admin set Verified", async () => {
    const bug = await makeBug(reporter, { project });
    const res = await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("status", "Verified");
    expect(res.body.bug.status).toBe("Verified");
  });

  it("blocks a reporter from reassigning", async () => {
    const bug = await makeBug(reporter, { project });
    const res = await request(app).patch(`/api/bugs/${bug._id}`).set(auth(reporter)).field("assignee", other.id);
    expect(res.status).toBe(403);
  });

  it("blocks a reporter from deleting and allows an admin", async () => {
    const bug = await makeBug(reporter, { project });
    await request(app).delete(`/api/bugs/${bug._id}`).set(auth(reporter)).expect(403);
    await request(app).delete(`/api/bugs/${bug._id}`).set(auth(admin)).expect(204);
  });

  it("blocks a reporter from bulk actions", async () => {
    const bug = await makeBug(reporter, { project });
    await request(app)
      .patch("/api/bugs/bulk")
      .set(auth(reporter))
      .send({ ids: [bug._id], action: "status", value: "Closed" })
      .expect(403);
  });
});

describe("role management", () => {
  it("only lets elevated users change roles", async () => {
    await request(app).patch(`/api/users/${other.id}/role`).set(auth(reporter)).send({ role: "Admin" }).expect(403);

    const res = await request(app)
      .patch(`/api/users/${other.id}/role`)
      .set(auth(admin))
      .send({ role: "Head of QA" });
    expect(res.body.user.role).toBe("Head of QA");
  });

  it("rejects a role outside the enum", async () => {
    const res = await request(app)
      .patch(`/api/users/${other.id}/role`)
      .set(auth(admin))
      .send({ role: "Supreme Leader" });
    expect(res.status).toBe(400);
  });

  it("gives a promoted Head of QA the elevated powers", async () => {
    const bug = await makeBug(other, { project });
    await request(app).patch(`/api/users/${reporter.id}/role`).set(auth(admin)).send({ role: "Head of QA" });

    const relogin = await request(app)
      .post("/api/auth/login")
      .send({ email: "rita@test.dev", password: reporter.password });
    const promoted = { token: relogin.body.token };

    const res = await request(app).patch(`/api/bugs/${bug._id}`).set(auth(promoted)).field("status", "Verified");
    expect(res.body.bug.status).toBe("Verified");
  });
});

describe("authentication", () => {
  it("rejects requests with no or a bogus token", async () => {
    await request(app).get("/api/bugs").expect(401);
    await request(app).get("/api/bugs").set({ Authorization: "Bearer nonsense" }).expect(401);
  });

  it("requires the current password to change it", async () => {
    await request(app)
      .post("/api/auth/change-password")
      .set(auth(reporter))
      .send({ currentPassword: "wrong", newPassword: "brandnew1" })
      .expect(401);

    const ok = await request(app)
      .post("/api/auth/change-password")
      .set(auth(reporter))
      .send({ currentPassword: "password123", newPassword: "brandnew1" });
    expect(ok.status).toBe(200);

    await request(app).post("/api/auth/login").send({ email: "rita@test.dev", password: "brandnew1" }).expect(200);
  });
});
