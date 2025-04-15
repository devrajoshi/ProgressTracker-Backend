import express from "express";
import {
  getSpecificUser,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = express.Router();

// Public Routes

// Protected Routes
router.route("/me").get(verifyJWT, getSpecificUser); // Get authenticated user's details
router.route("/profile").put(verifyJWT, updateProfile); // Update authenticated user's details
router.route("/profile/change-password").put(verifyJWT, changePassword); // Update authenticated user's details

export default router;
