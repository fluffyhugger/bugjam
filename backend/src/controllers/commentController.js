import Comment from "../models/Comment.js";
import Activity from "../models/Activity.js";
import Bug from "../models/Bug.js";
import { ELEVATED_ROLES } from "../models/User.js";
import { notifyComment } from "../services/notificationService.js";

const AUTHOR = { path: "author", select: "name email avatarColor" };
const ACTOR = { path: "actor", select: "name email avatarColor" };

function isElevated(user) {
  return ELEVATED_ROLES.includes(user?.role);
}

function idOf(ref) {
  return ref ? (ref._id ?? ref).toString() : null;
}

async function loadVisibleBug(req, res) {
  const bug = await Bug.findById(req.params.id);
  if (!bug) {
    res.status(404).json({ error: "Bug not found" });
    return null;
  }
  const owns = idOf(bug.reporter) === req.userId || idOf(bug.assignee) === req.userId;
  if (!isElevated(req.user) && !owns) {
    res.status(404).json({ error: "Bug not found" });
    return null;
  }
  return bug;
}

export async function getTimeline(req, res) {
  const bug = await loadVisibleBug(req, res);
  if (!bug) return;

  const [comments, activity] = await Promise.all([
    Comment.find({ bug: bug._id }).populate(AUTHOR).sort({ createdAt: 1 }),
    Activity.find({ bug: bug._id }).populate(ACTOR).sort({ createdAt: 1 }),
  ]);

  const items = [
    ...comments.map((c) => ({ kind: "comment", ...c.toObject() })),
    ...activity.map((a) => ({ kind: "activity", ...a.toObject() })),
  ].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

  res.json({ items });
}

export async function addComment(req, res) {
  const bug = await loadVisibleBug(req, res);
  if (!bug) return;

  const body = (req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment body is required" });

  const comment = await Comment.create({ bug: bug._id, author: req.userId, body });
  await comment.populate(AUTHOR);
  await notifyComment(bug, req.user, body);

  res.status(201).json({ comment: { kind: "comment", ...comment.toObject() } });
}

export async function updateComment(req, res) {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (idOf(comment.author) !== req.userId) {
    return res.status(403).json({ error: "You can only edit your own comment" });
  }

  const body = (req.body.body || "").trim();
  if (!body) return res.status(400).json({ error: "Comment body is required" });

  comment.body = body;
  comment.editedAt = new Date();
  await comment.save();
  await comment.populate(AUTHOR);

  res.json({ comment: { kind: "comment", ...comment.toObject() } });
}

export async function deleteComment(req, res) {
  const comment = await Comment.findById(req.params.commentId);
  if (!comment) return res.status(404).json({ error: "Comment not found" });
  if (idOf(comment.author) !== req.userId && !isElevated(req.user)) {
    return res.status(403).json({ error: "You can only delete your own comment" });
  }

  await comment.deleteOne();
  res.status(204).end();
}
