import mongoose from "mongoose";
import request from "supertest";
import app from "../src/app.js";
import User from "../src/models/User.js";
import Project from "../src/models/Project.js";

export { app, request };

export async function connectTestDb() {
  process.env.NODE_ENV = "test";
  process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
  const uri = process.env.TEST_MONGO_URI || "mongodb://localhost:27018/bugtracker_vitest";
  await mongoose.connect(uri);
}

export async function resetDb() {
  const collections = await mongoose.connection.db.collections();
  await Promise.all(collections.map((c) => c.deleteMany({})));
}

export async function disconnectTestDb() {
  await mongoose.connection.dropDatabase();
  await mongoose.disconnect();
}

// Register through the API so password hashing and the first-user-is-Admin rule apply.
export async function makeUser({ name = "Test User", email, password = "password123", role } = {}) {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ name, email: email || `u${Date.now()}${Math.random()}@example.com`, password });

  if (role && res.body.user.role !== role) {
    await User.findByIdAndUpdate(res.body.user.id, { role });
    const relogin = await request(app).post("/api/auth/login").send({ email: res.body.user.email, password });
    return { ...relogin.body.user, token: relogin.body.token, password };
  }
  return { ...res.body.user, token: res.body.token, password };
}

export const auth = (user) => ({ Authorization: `Bearer ${user.token}` });

export async function makeProject({ name = "Test Project", key = "TST", versions = [] } = {}) {
  return Project.create({ name, key, versions });
}

export async function makeBug(user, overrides = {}) {
  const project = overrides.project || (await makeProject({ key: `P${Math.floor(Math.random() * 8999) + 1000}` }));
  const res = await request(app)
    .post("/api/bugs")
    .set(auth(user))
    .field("title", overrides.title || "A bug")
    .field("severity", overrides.severity || "Major")
    .field("priority", overrides.priority || "High")
    .field("bugType", overrides.bugType || "Functional")
    .field("project", project._id.toString());
  return res.body.bug;
}

// MinIO is swapped for tests/minioStub.js via the alias in vitest.config.js.
