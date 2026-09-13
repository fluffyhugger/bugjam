import { Router } from "express";
import { requireAuth } from "../middleware/auth.js";
import { listNotifications, markRead, markAllRead } from "../controllers/notificationController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listNotifications);
router.patch("/:id/read", markRead);
router.post("/read-all", markAllRead);

export default router;
