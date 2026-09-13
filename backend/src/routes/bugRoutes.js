import { Router } from "express";
import { requireAuth, requireElevated } from "../middleware/auth.js";
import { upload, MAX_FILES } from "../middleware/upload.js";
import {
  meta,
  listBugs,
  getStats,
  getBug,
  createBug,
  updateBug,
  deleteBug,
  exportBugs,
  bulkUpdate,
  deleteAttachment,
  addLink,
  removeLink,
} from "../controllers/bugController.js";
import {
  getTimeline,
  addComment,
  updateComment,
  deleteComment,
} from "../controllers/commentController.js";

const router = Router();

router.use(requireAuth);

router.get("/meta", meta);
router.get("/stats", getStats);
router.get("/export.csv", exportBugs);
router.patch("/bulk", requireElevated, bulkUpdate);
router.get("/", listBugs);
router.post("/", upload.array("attachments", MAX_FILES), createBug);
router.get("/:id", getBug);
router.patch("/:id", upload.array("attachments", MAX_FILES), updateBug);
router.delete("/:id", requireElevated, deleteBug);

router.delete("/:id/attachments/:objectKey", deleteAttachment);

router.post("/:id/links", addLink);
router.delete("/:id/links/:linkedId", removeLink);

router.get("/:id/timeline", getTimeline);
router.post("/:id/comments", addComment);
router.patch("/:id/comments/:commentId", updateComment);
router.delete("/:id/comments/:commentId", deleteComment);

export default router;
