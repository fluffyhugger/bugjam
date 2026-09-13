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

let admin, project;

beforeAll(connectTestDb);
afterAll(disconnectTestDb);

beforeEach(async () => {
  await resetDb();
  admin = await makeUser({ name: "Ada Admin", email: "admin@test.dev" });
  project = await makeProject({ key: "WEB", name: "Website", versions: ["1.0.0"] });
});

describe("bug ids", () => {
  it("numbers bugs sequentially within a project", async () => {
    const a = await makeBug(admin, { project });
    const b = await makeBug(admin, { project });
    expect([a.bugId, b.bugId]).toEqual(["WEB-0001", "WEB-0002"]);
  });

  it("gives each project its own sequence", async () => {
    const mobile = await makeProject({ key: "MOB" });
    const web = await makeBug(admin, { project });
    const mob = await makeBug(admin, { project: mobile });
    expect(web.bugId).toBe("WEB-0001");
    expect(mob.bugId).toBe("MOB-0001");
  });

  it("computes the triage level on create and recomputes it on change", async () => {
    const bug = await makeBug(admin, { project, severity: "Trivial", priority: "Low" });
    expect(bug.priorityLevel).toBe("P4");

    const res = await request(app)
      .patch(`/api/bugs/${bug._id}`)
      .set(auth(admin))
      .field("severity", "Blocker")
      .field("priority", "Urgent");
    expect(res.body.bug.priorityLevel).toBe("P0");
  });
});

describe("projects", () => {
  it("rejects an invalid key", async () => {
    const res = await request(app).post("/api/projects").set(auth(admin)).send({ name: "Bad", key: "waytoolong" });
    expect(res.status).toBe(400);
  });

  it("refuses to delete a project that still has bugs", async () => {
    await makeBug(admin, { project });
    const res = await request(app).delete(`/api/projects/${project._id}`).set(auth(admin));
    expect(res.status).toBe(409);
  });

  it("stores versions on the bug", async () => {
    const res = await request(app)
      .post("/api/bugs")
      .set(auth(admin))
      .field("title", "Versioned")
      .field("severity", "Minor")
      .field("priority", "Low")
      .field("bugType", "Other")
      .field("project", project._id.toString())
      .field("foundInVersion", "1.0.0");
    expect(res.body.bug.foundInVersion).toBe("1.0.0");
  });
});

describe("sites / apps (modules)", () => {
  beforeEach(async () => {
    await request(app)
      .patch(`/api/projects/${project._id}`)
      .set(auth(admin))
      .send({ modules: ["Shop site", "Admin panel"] });
  });

  const report = (module) =>
    request(app)
      .post("/api/bugs")
      .set(auth(admin))
      .field("title", `Bug on ${module || "nothing"}`)
      .field("severity", "Minor")
      .field("priority", "Low")
      .field("bugType", "Other")
      .field("project", project._id.toString())
      .field("module", module);

  it("stores the module on the bug", async () => {
    const res = await report("Shop site");
    expect(res.body.bug.module).toBe("Shop site");
  });

  it("filters by module", async () => {
    await report("Shop site");
    await report("Admin panel");

    const res = await request(app).get("/api/bugs?module=Shop%20site").set(auth(admin));
    expect(res.body.bugs.map((b) => b.module)).toEqual(["Shop site"]);
  });

  it("counts bugs per module in stats, ignoring ones with no module", async () => {
    await report("Shop site");
    await report("Shop site");
    await report("");

    const res = await request(app).get("/api/bugs/stats").set(auth(admin));
    expect(res.body.byModule).toEqual({ "Shop site": 2 });
  });

  it("records a module change on the timeline", async () => {
    const bug = (await report("Shop site")).body.bug;
    await request(app).patch(`/api/bugs/${bug._id}`).set(auth(admin)).field("module", "Admin panel");

    const timeline = await request(app).get(`/api/bugs/${bug._id}/timeline`).set(auth(admin));
    const entry = timeline.body.items.find((i) => i.field === "module");
    expect(entry).toMatchObject({ from: "Shop site", to: "Admin panel" });
  });
});

describe("listing", () => {
  beforeEach(async () => {
    for (let i = 0; i < 7; i++) {
      await makeBug(admin, { project, title: `Bug number ${i}` });
    }
  });

  it("paginates", async () => {
    const page1 = await request(app).get("/api/bugs?limit=5&page=1").set(auth(admin));
    expect(page1.body.bugs).toHaveLength(5);
    expect(page1.body.total).toBe(7);
    expect(page1.body.pages).toBe(2);

    const page2 = await request(app).get("/api/bugs?limit=5&page=2").set(auth(admin));
    expect(page2.body.bugs).toHaveLength(2);
  });

  it("sorts oldest first when asked", async () => {
    const res = await request(app).get("/api/bugs?sort=oldest").set(auth(admin));
    expect(res.body.bugs[0].bugId).toBe("WEB-0001");
  });

  it("searches by bugId and by text only present in the description", async () => {
    await request(app)
      .post("/api/bugs")
      .set(auth(admin))
      .field("title", "Nothing special")
      .field("severity", "Minor")
      .field("priority", "Low")
      .field("bugType", "Other")
      .field("project", project._id.toString())
      .field("description", "the culprit is a zephyr in the cache");

    const byId = await request(app).get("/api/bugs?q=WEB-0003").set(auth(admin));
    expect(byId.body.bugs.map((b) => b.bugId)).toEqual(["WEB-0003"]);

    const byDescription = await request(app).get("/api/bugs?q=zephyr").set(auth(admin));
    expect(byDescription.body.bugs.map((b) => b.title)).toEqual(["Nothing special"]);
  });

  it("exports CSV with a header row per bug", async () => {
    const res = await request(app).get("/api/bugs/export.csv").set(auth(admin));
    const lines = res.text.trim().split("\n");
    expect(lines[0]).toContain("bugId,project,module,title");
    expect(lines).toHaveLength(8); // header + 7 bugs
  });
});

describe("links", () => {
  it("writes the inverse link on the other bug and removes both", async () => {
    const original = await makeBug(admin, { project, title: "Original" });
    const duplicate = await makeBug(admin, { project, title: "Duplicate" });

    const linked = await request(app)
      .post(`/api/bugs/${duplicate._id}/links`)
      .set(auth(admin))
      .send({ type: "duplicate-of", bugId: original.bugId });
    expect(linked.body.bug.links[0].type).toBe("duplicate-of");

    const other = await request(app).get(`/api/bugs/${original._id}`).set(auth(admin));
    expect(other.body.bug.links[0].type).toBe("duplicated-by");

    await request(app).delete(`/api/bugs/${duplicate._id}/links/${original._id}`).set(auth(admin));
    const after = await request(app).get(`/api/bugs/${original._id}`).set(auth(admin));
    expect(after.body.bug.links).toHaveLength(0);
  });

  it("refuses self-links and unknown link types", async () => {
    const bug = await makeBug(admin, { project });
    await request(app)
      .post(`/api/bugs/${bug._id}/links`)
      .set(auth(admin))
      .send({ type: "duplicate-of", bugId: bug.bugId })
      .expect(400);

    await request(app)
      .post(`/api/bugs/${bug._id}/links`)
      .set(auth(admin))
      .send({ type: "causes", bugId: bug.bugId })
      .expect(400);
  });
});
