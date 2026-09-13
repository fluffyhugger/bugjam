import Notification from "../models/Notification.js";

function idOf(ref) {
  return ref ? (ref._id ?? ref).toString() : null;
}

// Nobody wants to be told about their own actions.
async function notify(recipients, actor, bug, type, message) {
  const actorId = idOf(actor);
  const unique = [...new Set(recipients.map(idOf).filter((id) => id && id !== actorId))];
  if (!unique.length) return [];

  return Notification.insertMany(
    unique.map((user) => ({ user, actor: actorId, bug: bug._id, type, message }))
  );
}

export function notifyAssigned(bug, actor) {
  if (!bug.assignee) return Promise.resolve([]);
  return notify([bug.assignee], actor, bug, "assigned", `assigned ${bug.bugId} to you`);
}

export function notifyStatus(bug, actor, from, to) {
  return notify(
    [bug.reporter, bug.assignee],
    actor,
    bug,
    "status",
    `moved ${bug.bugId} from ${from} to ${to}`
  );
}

export function notifyComment(bug, actor, body) {
  const preview = body.length > 60 ? `${body.slice(0, 60)}…` : body;
  return notify([bug.reporter, bug.assignee], actor, bug, "comment", `commented on ${bug.bugId}: "${preview}"`);
}
