import User from "../models/User.js";
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

dotenv.config();

const getUsers = async (req, res) => {
  try {
    const users = await User.find().sort({
      created_at: -1,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, users, "Users fetched successfully"));
  } catch (err) {
    throw new ApiError(500, "Error while fetching users", err);
  }
};

// GET /api/users/me - Fetch the authenticated user's details
const getSpecificUser = async (req, res) => {
  try {
    const user = req.user;

    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, user, "User details fetched successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error while fetching user details", error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const userId = req.user._id;
    const { fullname, username, email } = req.body;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { fullname, username, email },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      throw new ApiError(404, "User not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, updatedUser, "Profile updated successfully"));
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error while updating profile", error);
  }
};

const changePassword = async (req, res) => {
  try {
    if (!req.user || !req.user._id) {
      throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    const userId = req.user._id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      throw new ApiError(400, "Current password and new password are required");
    }

    const user = await User.findById(userId).select("+password");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      throw new ApiError(400, "Current password is incorrect");
    }

    // Set the new password (it will be hashed by the pre-save middleware)
    user.password = newPassword;
    await user.save();

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { requireReLogin: true },
          "Password changed successfully"
        )
      );
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(500, "Error while changing password", error);
  }
};

export { getUsers, getSpecificUser, updateProfile, changePassword };
