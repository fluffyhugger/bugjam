import jwt from "jsonwebtoken";
import User, { ELEVATED_ROLES } from "../models/User.js";

export async function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: "Missing auth token" });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(payload.sub);
    if (!user) return res.status(401).json({ error: "Invalid or expired token" });

    req.userId = user._id.toString();
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: "Invalid or expired token" });
  }
}

export function requireElevated(req, res, next) {
  if (!ELEVATED_ROLES.includes(req.user?.role)) {
    return res.status(403).json({ error: "Requires Head of QA or Admin role" });
  }
  next();
}
