import { Router } from "express";
import {
  register,
  login,
  logout,
  refreshAccessToken,
} from "../controllers/authController.js";
import { verifyJWT } from "../middlewares/authMiddleware.js";

const router = Router();

// Public routes
router.route("/register").post(register);
router.route("/login").post(login);
router.route("/refresh-token").post(refreshAccessToken);

// Protected routes
router.route("/logout").post(verifyJWT, logout);

export default router;
