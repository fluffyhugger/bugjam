import Bug from "../models/Bug.js";
import Project from "../models/Project.js";
import Counter from "../models/Counter.js";

const DEFAULT = { name: "BugJam", key: "BUG" };

// Bugs predate projects. Park the orphans in a default project whose key matches the
// ids they already carry (BUG-000n), and seed the counter past the highest one.
// `screenshots` became `attachments` when non-image files were allowed.
export async function renameScreenshotsField() {
  const { modifiedCount } = await Bug.collection.updateMany(
    { screenshots: { $exists: true } },
    { $rename: { screenshots: "attachments" } }
  );
  if (modifiedCount) console.log(`[bootstrap] renamed screenshots -> attachments on ${modifiedCount} bug(s)`);
}

export async function ensureDefaultProject() {
  const orphans = await Bug.countDocuments({ project: { $exists: false } });
  const projectCount = await Project.countDocuments();
  if (!orphans && projectCount) return;

  let project = await Project.findOne({ key: DEFAULT.key });
  if (!project) {
    project = await Project.create(DEFAULT);
    console.log(`[bootstrap] created default project ${project.key}`);
  }

  if (orphans) {
    await Bug.updateMany({ project: { $exists: false } }, { $set: { project: project._id } });
    console.log(`[bootstrap] assigned ${orphans} existing bug(s) to ${project.key}`);
  }

  const highest = await Bug.find({ bugId: new RegExp(`^${DEFAULT.key}-\\d+$`) })
    .sort({ bugId: -1 })
    .limit(1)
    .select("bugId");
  const max = highest.length ? Number(highest[0].bugId.split("-")[1]) : 0;
  const counterId = `bugId:${DEFAULT.key}`;
  const counter = await Counter.findById(counterId);
  if (!counter || counter.seq < max) {
    await Counter.findByIdAndUpdate(counterId, { seq: max }, { upsert: true });
    console.log(`[bootstrap] seeded counter ${counterId} to ${max}`);
  }
}
