import Project from "../models/Project.js";
import Bug from "../models/Bug.js";

export async function listProjects(req, res) {
  const filter = req.query.includeArchived === "true" ? {} : { archived: false };
  const projects = await Project.find(filter).sort({ name: 1 });
  res.json({ projects });
}

export async function createProject(req, res) {
  const { name, key, versions, modules } = req.body;
  if (!name || !key) return res.status(400).json({ error: "name and key are required" });

  const existing = await Project.findOne({ key: key.toUpperCase() });
  if (existing) return res.status(409).json({ error: `Project key ${key.toUpperCase()} is already taken` });

  try {
    const project = await Project.create({
      name,
      key,
      versions: Array.isArray(versions) ? versions.filter(Boolean) : [],
      modules: Array.isArray(modules) ? modules.filter(Boolean) : [],
    });
    res.status(201).json({ project });
  } catch (err) {
    res.status(400).json({ error: err.errors?.key?.message || err.message });
  }
}

export async function updateProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  // The key is baked into every bugId already issued, so it can never change.
  if (req.body.name !== undefined) project.name = req.body.name;
  if (req.body.archived !== undefined) project.archived = req.body.archived;
  for (const field of ["versions", "modules"]) {
    if (req.body[field] === undefined) continue;
    project[field] = Array.isArray(req.body[field])
      ? [...new Set(req.body[field].map((v) => String(v).trim()).filter(Boolean))]
      : [];
  }

  await project.save();
  res.json({ project });
}

export async function deleteProject(req, res) {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ error: "Project not found" });

  const bugCount = await Bug.countDocuments({ project: project._id });
  if (bugCount) {
    return res.status(409).json({
      error: `${bugCount} bug(s) still belong to this project — archive it instead of deleting.`,
    });
  }

  await project.deleteOne();
  res.status(204).end();
}
