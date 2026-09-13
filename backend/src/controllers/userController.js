import crypto from "crypto";
import bcrypt from "bcryptjs";
import User, { ROLES } from "../models/User.js";

export async function listUsers(req, res) {
  const users = await User.find().sort({ name: 1 });
  res.json({ users: users.map((u) => u.toPublicJSON()) });
}

export async function updateUserRole(req, res) {
  const { role } = req.body;
  if (!ROLES.includes(role)) {
    return res.status(400).json({ error: `role must be one of: ${ROLES.join(", ")}` });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  user.role = role;
  await user.save();
  res.json({ user: user.toPublicJSON() });
}

// No mail infrastructure, so the temp password is returned once for the admin to hand over.
export async function resetUserPassword(req, res) {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ error: "User not found" });

  const tempPassword = crypto.randomBytes(6).toString("base64url");
  user.passwordHash = await bcrypt.hash(tempPassword, 10);
  await user.save();

  res.json({ user: user.toPublicJSON(), tempPassword });
}
