import Notification from "../models/Notification.js";

export async function listNotifications(req, res) {
  const [notifications, unreadCount] = await Promise.all([
    Notification.find({ user: req.userId })
      .populate({ path: "actor", select: "name avatarColor" })
      .populate({ path: "bug", select: "bugId title" })
      .sort({ createdAt: -1 })
      .limit(30),
    Notification.countDocuments({ user: req.userId, read: false }),
  ]);
  res.json({ notifications, unreadCount });
}

export async function markRead(req, res) {
  const notification = await Notification.findOneAndUpdate(
    { _id: req.params.id, user: req.userId },
    { read: true },
    { new: true }
  );
  if (!notification) return res.status(404).json({ error: "Notification not found" });
  res.json({ notification });
}

export async function markAllRead(req, res) {
  await Notification.updateMany({ user: req.userId, read: false }, { read: true });
  res.json({ ok: true });
}
