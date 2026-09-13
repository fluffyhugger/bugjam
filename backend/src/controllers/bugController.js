import mongoose from "mongoose";
import { v4 as uuid } from "uuid";
import Bug, {
  BUG_TYPES,
  STATUSES,
  PRIORITY_LEVELS,
  ELEVATED_ONLY_STATUSES,
  LINK_TYPES,
  INVERSE_LINK,
} from "../models/Bug.js";
import { SEVERITIES, PRIORITIES } from "../utils/priorityMatrix.js";
import { minioClient, BUCKET, presignScreenshot } from "../config/minio.js";
import { ELEVATED_ROLES } from "../models/User.js";
import Project from "../models/Project.js";
import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import Notification from "../models/Notification.js";
import { snapshot, recordChanges, recordEvent } from "../services/activityService.js";
import { notifyAssigned, notifyStatus } from "../services/notificationService.js";

const POPULATE = [
  { path: "reporter", select: "name email avatarColor" },
  { path: "assignee", select: "name email avatarColor" },
  { path: "project", select: "name key versions" },
  { path: "links.bug", select: "bugId title status priorityLevel" },
];

function isElevated(user) {
  return ELEVATED_ROLES.includes(user?.role);
}

// `bug` may arrive populated (reporter/assignee are docs) or raw (ObjectIds).
function idOf(ref) {
  return ref ? (ref._id ?? ref).toString() : null;
}

function isOwner(bug, userId) {
  return idOf(bug.reporter) === userId || idOf(bug.assignee) === userId;
}

// Aggregation pipelines don't cast strings to ObjectId the way queries do, so the
// id must already be an ObjectId here or $match silently matches nothing.
function scopeFilter(req) {
  if (isElevated(req.user)) return {};
  const id = new mongoose.Types.ObjectId(req.userId);
  return { $or: [{ reporter: id }, { assignee: id }] };
}

async function serializeBug(bugDoc) {
  const bug = bugDoc.toObject();
  bug.attachments = await Promise.all(
    bug.attachments.map(async (s) => ({
      ...s,
      url: await presignScreenshot(s.objectKey),
    }))
  );
  return bug;
}

async function uploadAttachments(files = []) {
  const uploaded = [];
  for (const file of files) {
    const objectKey = `${uuid()}-${file.originalname.replace(/\s+/g, "_")}`;
    await minioClient.putObject(BUCKET, objectKey, file.buffer, file.size, {
      "Content-Type": file.mimetype,
    });
    uploaded.push({
      objectKey,
      filename: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
    });
  }
  return uploaded;
}

export async function meta(req, res) {
  res.json({
    severities: SEVERITIES,
    priorities: PRIORITIES,
    bugTypes: BUG_TYPES,
    statuses: STATUSES,
    priorityLevels: PRIORITY_LEVELS,
    elevatedOnlyStatuses: ELEVATED_ONLY_STATUSES,
  });
}

const SORTS = {
  newest: { createdAt: -1 },
  oldest: { createdAt: 1 },
  priority: { priorityLevel: 1, createdAt: -1 },
  status: { status: 1, createdAt: -1 },
  severity: { severity: 1, createdAt: -1 },
  updated: { updatedAt: -1 },
};

function buildFilter(req) {
  const { status, severity, priority, priorityLevel, bugType, assignee, reporter, project, module, q } =
    req.query;
  const filter = { ...scopeFilter(req) };
  if (project) filter.project = project;
  if (module) filter.module = module;
  if (status) filter.status = status;
  if (severity) filter.severity = severity;
  if (priority) filter.priority = priority;
  if (priorityLevel) filter.priorityLevel = priorityLevel;
  if (bugType) filter.bugType = bugType;
  if (assignee) filter.assignee = assignee === "none" ? null : assignee;
  if (reporter) filter.reporter = reporter;

  if (q) {
    const rx = { $regex: q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), $options: "i" };
    filter.$and = [
      { $or: [{ title: rx }, { description: rx }, { stepsToReproduce: rx }, { bugId: rx }] },
    ];
  }
  return filter;
}

export async function listBugs(req, res) {
  const filter = buildFilter(req);
  const sort = SORTS[req.query.sort] || SORTS.newest;
  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(req.query.limit) || 20));

  const [bugs, total] = await Promise.all([
    Bug.find(filter)
      .sort(sort)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate(POPULATE),
    Bug.countDocuments(filter),
  ]);

  res.json({
    bugs: await Promise.all(bugs.map(serializeBug)),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
}

export async function exportBugs(req, res) {
  const bugs = await Bug.find(buildFilter(req)).sort(SORTS.newest).populate(POPULATE);

  const columns = [
    "bugId", "project", "module", "title", "status", "severity", "priority", "priorityLevel",
    "bugType", "reporter", "assignee", "foundInVersion", "fixedInVersion", "createdAt",
  ];
  const cell = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
  const rows = bugs.map((b) =>
    [
      b.bugId, b.project?.key, b.module, b.title, b.status, b.severity, b.priority, b.priorityLevel,
      b.bugType, b.reporter?.name, b.assignee?.name || "Unassigned",
      b.foundInVersion, b.fixedInVersion, b.createdAt.toISOString(),
    ].map(cell).join(",")
  );

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bugjam-export-${Date.now()}.csv"`);
  res.send([columns.join(","), ...rows].join("\n"));
}

export async function bulkUpdate(req, res) {
  const { ids, action, value } = req.body;
  if (!Array.isArray(ids) || !ids.length) return res.status(400).json({ error: "ids are required" });

  const elevated = isElevated(req.user);
  if (!elevated) return res.status(403).json({ error: "Only Head of QA or Admin can run bulk actions" });

  const bugs = await Bug.find({ _id: { $in: ids } });

  if (action === "delete") {
    for (const bug of bugs) {
      await Promise.all(
        bug.attachments.map((s) => minioClient.removeObject(BUCKET, s.objectKey).catch(() => {}))
      );
      await Promise.all([
        Comment.deleteMany({ bug: bug._id }),
        Activity.deleteMany({ bug: bug._id }),
        Notification.deleteMany({ bug: bug._id }),
      ]);
      await bug.deleteOne();
    }
    return res.json({ updated: bugs.length, action });
  }

  if (action !== "status" && action !== "assignee") {
    return res.status(400).json({ error: "action must be status, assignee or delete" });
  }

  for (const bug of bugs) {
    const before = snapshot(bug);
    bug[action] = action === "assignee" ? value || null : value;
    await bug.save();
    const changes = await recordChanges(bug, req.userId, before);
    const statusChange = changes.find((c) => c.type === "status");
    if (statusChange) await notifyStatus(bug, req.user, statusChange.from, statusChange.to);
    if (changes.some((c) => c.type === "assignee")) await notifyAssigned(bug, req.user);
  }

  res.json({ updated: bugs.length, action });
}

const TREND_DAYS = 30;
const DONE_STATUSES = ["Resolved", "Verified", "Closed"];

export async function getStats(req, res) {
  const match = scopeFilter(req);

  const since = new Date();
  since.setHours(0, 0, 0, 0);
  since.setDate(since.getDate() - (TREND_DAYS - 1));

  const groupBy = (field) => Bug.aggregate([{ $match: match }, { $group: { _id: field, count: { $sum: 1 } } }]);

  const [
    byPriorityLevel,
    byStatus,
    byBugType,
    bySeverity,
    byPriority,
    byModule,
    matrixRows,
    assigneeRows,
    trendRows,
    total,
  ] = await Promise.all([
      groupBy("$priorityLevel"),
      groupBy("$status"),
      groupBy("$bugType"),
      groupBy("$severity"),
      groupBy("$priority"),
      Bug.aggregate([
        { $match: { ...match, module: { $nin: ["", null] } } },
        { $group: { _id: "$module", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),
      Bug.aggregate([
        { $match: match },
        { $group: { _id: { severity: "$severity", priority: "$priority" }, count: { $sum: 1 } } },
      ]),
      Bug.aggregate([
        { $match: match },
        { $group: { _id: "$assignee", count: { $sum: 1 } } },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "user" } },
        { $project: { _id: 0, count: 1, name: { $ifNull: [{ $arrayElemAt: ["$user.name", 0] }, "Unassigned"] } } },
        { $sort: { count: -1 } },
      ]),
      Bug.aggregate([
        { $match: { ...match, createdAt: { $gte: since } } },
        { $group: { _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } }, count: { $sum: 1 } } },
      ]),
      Bug.countDocuments(match),
    ]);

  const toMap = (rows) => Object.fromEntries(rows.map((r) => [r._id, r.count]));

  const matrix = {};
  for (const row of matrixRows) matrix[`${row._id.severity}|${row._id.priority}`] = row.count;

  const trendMap = toMap(trendRows);
  const trend = [];
  for (let i = 0; i < TREND_DAYS; i++) {
    const d = new Date(since);
    d.setDate(since.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    trend.push({ date: key, count: trendMap[key] || 0 });
  }

  const statusMap = toMap(byStatus);
  const done = DONE_STATUSES.reduce((sum, s) => sum + (statusMap[s] || 0), 0);
  const levelMap = toMap(byPriorityLevel);

  res.json({
    total,
    open: total - done,
    done,
    critical: (levelMap.P0 || 0) + (levelMap.P1 || 0),
    byPriorityLevel: levelMap,
    byStatus: statusMap,
    byBugType: toMap(byBugType),
    byModule: toMap(byModule),
    bySeverity: toMap(bySeverity),
    byPriority: toMap(byPriority),
    matrix,
    byAssignee: assigneeRows,
    trend,
  });
}

export async function getBug(req, res) {
  const bug = await Bug.findById(req.params.id).populate(POPULATE);
  if (!bug) return res.status(404).json({ error: "Bug not found" });
  if (!isElevated(req.user) && !isOwner(bug, req.userId)) {
    return res.status(404).json({ error: "Bug not found" });
  }
  res.json({ bug: await serializeBug(bug) });
}

export async function createBug(req, res) {
  const { title, description, severity, priority, bugType, assignee, project, module, foundInVersion } =
    req.body;
  if (!title || !severity || !priority || !bugType) {
    return res.status(400).json({ error: "title, severity, priority and bugType are required" });
  }

  const projectDoc = project
    ? await Project.findById(project)
    : await Project.findOne({ archived: false }).sort({ createdAt: 1 });
  if (!projectDoc) return res.status(400).json({ error: "project is required" });

  let stepsToReproduce = req.body.stepsToReproduce;
  if (typeof stepsToReproduce === "string") {
    stepsToReproduce = stepsToReproduce.trim() ? [stepsToReproduce] : [];
  }
  if (Array.isArray(stepsToReproduce)) {
    stepsToReproduce = stepsToReproduce.map((s) => String(s).trim()).filter(Boolean);
  } else {
    stepsToReproduce = [];
  }

  const attachments = await uploadAttachments(req.files);

  const bug = await Bug.create({
    title,
    description,
    stepsToReproduce,
    severity,
    priority,
    bugType,
    project: projectDoc._id,
    module: module || "",
    foundInVersion: foundInVersion || "",
    assignee: assignee || null,
    reporter: req.userId,
    attachments,
  });

  await recordEvent(bug._id, req.userId, { type: "created", to: bug.bugId });
  await notifyAssigned(bug, req.user);

  await bug.populate(POPULATE);
  res.status(201).json({ bug: await serializeBug(bug) });
}

export async function updateBug(req, res) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });

  const elevated = isElevated(req.user);
  if (!elevated && !isOwner(bug, req.userId)) {
    return res.status(404).json({ error: "Bug not found" });
  }
  if (!elevated && req.body.assignee !== undefined) {
    return res.status(403).json({ error: "Only Head of QA or Admin can reassign a bug" });
  }
  if (!elevated && ELEVATED_ONLY_STATUSES.includes(req.body.status)) {
    return res.status(403).json({ error: "Only Head of QA or Admin can set that status" });
  }

  const before = snapshot(bug);

  const editable = [
    "title",
    "description",
    "severity",
    "priority",
    "bugType",
    "status",
    "assignee",
    "module",
    "foundInVersion",
    "fixedInVersion",
  ];
  const clearable = ["assignee", "module", "foundInVersion", "fixedInVersion"];
  for (const field of editable) {
    if (req.body[field] === undefined) continue;
    const value = req.body[field];
    if (value) bug[field] = value;
    else if (clearable.includes(field)) bug[field] = field === "assignee" ? null : "";
  }

  if (req.body.stepsToReproduce !== undefined) {
    let steps = req.body.stepsToReproduce;
    if (typeof steps === "string") steps = steps.trim() ? [steps] : [];
    bug.stepsToReproduce = Array.isArray(steps) ? steps.map((s) => String(s).trim()).filter(Boolean) : [];
  }

  if (req.files?.length) {
    const newAttachments = await uploadAttachments(req.files);
    bug.attachments.push(...newAttachments);
    for (const s of newAttachments) {
      await recordEvent(bug._id, req.userId, { type: "attachment", field: "added", to: s.filename });
    }
  }

  await bug.save();
  const changes = await recordChanges(bug, req.userId, before);

  const statusChange = changes.find((c) => c.type === "status");
  if (statusChange) await notifyStatus(bug, req.user, statusChange.from, statusChange.to);
  if (changes.some((c) => c.type === "assignee")) await notifyAssigned(bug, req.user);

  await bug.populate(POPULATE);
  res.json({ bug: await serializeBug(bug) });
}

export async function addLink(req, res) {
  const { type, bugId } = req.body;
  if (!LINK_TYPES.includes(type)) {
    return res.status(400).json({ error: `type must be one of: ${LINK_TYPES.join(", ")}` });
  }

  const bug = await Bug.findById(req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });
  if (!isElevated(req.user) && !isOwner(bug, req.userId)) {
    return res.status(404).json({ error: "Bug not found" });
  }

  const other = await Bug.findOne({ $or: [{ _id: mongoose.isValidObjectId(bugId) ? bugId : null }, { bugId }] });
  if (!other) return res.status(404).json({ error: "Linked bug not found" });
  if (other._id.equals(bug._id)) return res.status(400).json({ error: "A bug cannot link to itself" });

  if (!bug.links.some((l) => l.bug.equals(other._id) && l.type === type)) {
    bug.links.push({ type, bug: other._id });
    await bug.save();
  }

  // The relationship is only true if both sides say so.
  const inverse = INVERSE_LINK[type];
  if (!other.links.some((l) => l.bug.equals(bug._id) && l.type === inverse)) {
    other.links.push({ type: inverse, bug: bug._id });
    await other.save();
  }

  await recordEvent(bug._id, req.userId, { type: "link", field: "added", to: `${type} ${other.bugId}` });
  await recordEvent(other._id, req.userId, { type: "link", field: "added", to: `${inverse} ${bug.bugId}` });

  await bug.populate(POPULATE);
  res.json({ bug: await serializeBug(bug) });
}

export async function removeLink(req, res) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });
  if (!isElevated(req.user) && !isOwner(bug, req.userId)) {
    return res.status(404).json({ error: "Bug not found" });
  }

  const link = bug.links.find((l) => l.bug.toString() === req.params.linkedId);
  if (!link) return res.status(404).json({ error: "Link not found" });

  bug.links = bug.links.filter((l) => l.bug.toString() !== req.params.linkedId);
  await bug.save();

  const other = await Bug.findById(req.params.linkedId);
  if (other) {
    other.links = other.links.filter((l) => l.bug.toString() !== bug._id.toString());
    await other.save();
  }

  await recordEvent(bug._id, req.userId, { type: "link", field: "removed", to: other?.bugId || "" });

  await bug.populate(POPULATE);
  res.json({ bug: await serializeBug(bug) });
}

export async function deleteAttachment(req, res) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });
  if (!isElevated(req.user) && !isOwner(bug, req.userId)) {
    return res.status(404).json({ error: "Bug not found" });
  }

  const { objectKey } = req.params;
  const attachment = bug.attachments.find((a) => a.objectKey === objectKey);
  if (!attachment) return res.status(404).json({ error: "Attachment not found" });

  await minioClient.removeObject(BUCKET, objectKey).catch(() => {});
  bug.attachments = bug.attachments.filter((a) => a.objectKey !== objectKey);
  await bug.save();
  await recordEvent(bug._id, req.userId, { type: "attachment", field: "removed", to: attachment.filename });

  await bug.populate(POPULATE);
  res.json({ bug: await serializeBug(bug) });
}

export async function deleteBug(req, res) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) return res.status(404).json({ error: "Bug not found" });

  await Promise.all(
    bug.attachments.map((s) => minioClient.removeObject(BUCKET, s.objectKey).catch(() => {}))
  );
  await Promise.all([
    Comment.deleteMany({ bug: bug._id }),
    Activity.deleteMany({ bug: bug._id }),
    Notification.deleteMany({ bug: bug._id }),
  ]);
  await bug.deleteOne();
  res.status(204).end();
}
