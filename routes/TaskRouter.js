import express from "express";
import {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
  getTaskHistory,
} from "../controllers/taskController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Protect all task routes
router.use(verifyJWT);

router.route("/").get(getTasks).post(createTask);
router.route("/:_id").put(updateTask).delete(deleteTask);
router.route("/:id/complete").post(markTaskAsCompleted);
router.route("/history").get(getTaskHistory);

export default router;
