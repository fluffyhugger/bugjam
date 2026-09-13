import Activity from "../models/Activity.js";
import User from "../models/User.js";

// Fields worth a timeline entry, and the activity type each one records under.
const TRACKED = {
  status: "status",
  assignee: "assignee",
  severity: "severity",
  priority: "priority",
  priorityLevel: "priorityLevel",
  title: "field",
  description: "field",
  bugType: "field",
  module: "field",
  foundInVersion: "field",
  fixedInVersion: "field",
};

export function snapshot(bug) {
  const snap = {};
  for (const field of Object.keys(TRACKED)) {
    const value = bug[field];
    snap[field] = value === null || value === undefined ? "" : value.toString();
  }
  return snap;
}

async function displayName(userId) {
  if (!userId) return "Unassigned";
  const user = await User.findById(userId).select("name");
  return user?.name || "Unknown";
}

export async function recordChanges(bug, actorId, before) {
  const after = snapshot(bug);
  const entries = [];

  for (const [field, type] of Object.entries(TRACKED)) {
    if (before[field] === after[field]) continue;
    const [from, to] =
      field === "assignee"
        ? await Promise.all([displayName(before[field]), displayName(after[field])])
        : [before[field], after[field]];
    entries.push({ bug: bug._id, actor: actorId, type, field, from, to });
  }

  if (entries.length) await Activity.insertMany(entries);
  return entries;
}

export async function recordEvent(bugId, actorId, { type, field = "", from = "", to = "" }) {
  return Activity.create({ bug: bugId, actor: actorId, type, field, from, to });
}
