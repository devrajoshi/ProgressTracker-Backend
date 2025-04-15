import express from "express";
import { verifyJWT } from "../middlewares/authMiddleware.js";
import userRouter from "./UserRouter.js";
import taskRouter from "./TaskRouter.js";
import profilePictureRouter from "./ProfilePictureRouter.js";
import authRouter from "./AuthRouter.js";

const router = express.Router();

// Public routes
router.use("/auth", authRouter);

// Protected routes
router.use("/users", verifyJWT, userRouter);
router.use("/tasks", verifyJWT, taskRouter);
router.use("/users/profile", verifyJWT, profilePictureRouter);

export default router;
