import { Router } from "express";
import { register, login, me, changePassword } from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);
router.post("/change-password", requireAuth, changePassword);

export default router;
