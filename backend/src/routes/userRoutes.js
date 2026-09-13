import { Router } from "express";
import { listUsers, updateUserRole, resetUserPassword } from "../controllers/userController.js";
import { requireAuth, requireElevated } from "../middleware/auth.js";

const router = Router();

router.get("/", requireAuth, listUsers);
router.patch("/:id/role", requireAuth, requireElevated, updateUserRole);
router.post("/:id/reset-password", requireAuth, requireElevated, resetUserPassword);

export default router;
