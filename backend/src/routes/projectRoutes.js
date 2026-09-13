import { Router } from "express";
import { requireAuth, requireElevated } from "../middleware/auth.js";
import {
  listProjects,
  createProject,
  updateProject,
  deleteProject,
} from "../controllers/projectController.js";

const router = Router();

router.use(requireAuth);

router.get("/", listProjects);
router.post("/", requireElevated, createProject);
router.patch("/:id", requireElevated, updateProject);
router.delete("/:id", requireElevated, deleteProject);

export default router;
