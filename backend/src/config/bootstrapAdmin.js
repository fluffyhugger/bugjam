import User, { ELEVATED_ROLES } from "../models/User.js";

// Without this, a database whose users all predate roles would have nobody able to
// grant roles, and the app could never reach an elevated user again.
export async function ensureElevatedUser() {
  const elevatedCount = await User.countDocuments({ role: { $in: ELEVATED_ROLES } });
  if (elevatedCount > 0) return;

  const oldest = await User.findOne().sort({ createdAt: 1 });
  if (!oldest) return;

  oldest.role = "Admin";
  await oldest.save();
  console.log(`[bootstrap] no elevated user found — promoted "${oldest.email}" to Admin`);
}
