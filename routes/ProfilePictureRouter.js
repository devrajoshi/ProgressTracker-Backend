import express from "express";
import multer from "multer";
import User from "../models/User.js"; // Import your User model

const router = express.Router();

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/uploads/"); // Save files in the "public/uploads" directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Unique filename
  },
});

const upload = multer({ storage });

// Route to update profile picture
router.post(
  "/update-profile-picture",
  upload.single("profilePicture"),
  async (req, res) => {
    try {
      const userId = req.user._id; // Get user ID from the auth middleware
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const profilePictureUrl = `/uploads/${req.file.filename}`; // Construct the file URL

      // Update the user's profile picture URL in the database
      const updatedUser = await User.findByIdAndUpdate(
        userId,
        { profilePictureUrl },
        { new: true }
      );

      res
        .status(200)
        .json({ profilePictureUrl: updatedUser.profilePictureUrl });
    } catch (error) {
      console.error("Error updating profile picture:", error);
      res
        .status(500)
        .json({ message: "Server error while updating profile picture" });
    }
  }
);
export default router;
