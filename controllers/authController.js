import User from "../models/User.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/AsyncHandler.js";
import jwt from "jsonwebtoken";

// Register Controller
const register = async (req, res) => {
  try {
    const { fullname, username, email, password } = req.body;

    // Validate input
    if (!fullname || !username || !email || !password) {
      throw new ApiError(400, "All fields are required");
    }

    // Check if user already exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      throw new ApiError(
        409,
        "User with this email or username already exists"
      );
    }

    // Create a new user
    const user = new User({
      fullname,
      username,
      email,
      password,
    });

    // Save the user to the database
    await user.save();

    // Generate tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Skip validation to avoid re-hashing the password

    // Set cookies with HttpOnly and Secure flags
    const options = {
      httpOnly: true, // Prevent JavaScript access
      secure: process.env.NODE_ENV === "production", // Only send over HTTPS in production
      sameSite: "strict", // Prevent CSRF attacks
    };

    // Send tokens in cookies
    return res
      .status(201)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          201,
          {
            user: {
              _id: user._id,
              username: user.username,
              email: user.email,
              profilePictureUrl: user.profilePictureUrl,
            },
          },
          "User registered successfully"
        )
      );
  } catch (error) {
    console.error("Registration error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Server error"
    );
  }
};

// Login Controller
const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log("Login attempt for email:", email);

    // Validate input
    if (!email || !password) {
      console.log("Missing email or password");
      throw new ApiError(400, "Email and password are required");
    }

    // Find the user by email
    const user = await User.findOne({ email }).select("+password"); // Include password field
    console.log("User found:", user ? "Yes" : "No");

    if (!user) {
      console.log("No user found with email:", email);
      throw new ApiError(401, "Invalid email or password");
    }

    // Compare passwords
    const isPasswordValid = await user.isPasswordCorrect(password);
    console.log("Password valid:", isPasswordValid);

    if (!isPasswordValid) {
      console.log("Invalid password for user:", email);
      throw new ApiError(401, "Invalid email or password");
    }

    // Generate access and refresh tokens
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    console.log("Tokens generated successfully");

    // Save the refresh token in the database
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // Skip validation to avoid re-hashing the password
    console.log("Refresh token saved to database");

    // Set cookies with HttpOnly and Secure flags
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax", // Changed from strict to lax for better compatibility
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Send tokens in cookies and response
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: {
              _id: user._id,
              username: user.username,
              email: user.email,
              profilePictureUrl: user.profilePictureUrl,
            },
          },
          "Login successful"
        )
      );
  } catch (error) {
    console.error("Login error:", error);
    throw new ApiError(
      error.statusCode || 500,
      error.message || "Server error"
    );
  }
};

const logout = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: {
        refreshToken: 1, // this removes the field from document
      },
    },
    {
      new: true,
    }
  );

  const options = {
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"));
});

// Helper function to generate new tokens
const generateAccessAndRefereshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    // Save refresh token to user
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, "Something went wrong while generating tokens");
  }
};

// Refresh token handler
const refreshAccessToken = asyncHandler(async (req, res) => {
  try {
    const incomingRefreshToken = req.cookies?.refreshToken;

    if (!incomingRefreshToken) {
      throw new ApiError(401, "Unauthorized request - No refresh token");
    }

    // Verify the refresh token
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    // Find user and include refreshToken field
    const user = await User.findById(decodedToken?._id).select("+refreshToken");
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }

    // Verify that the incoming refresh token matches the stored one
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    // Generate new tokens
    const { accessToken, refreshToken } = await generateAccessAndRefereshTokens(
      user._id
    );

    // Set cookie options
    const options = {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    };

    // Send new tokens
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          {
            user: { _id: user._id, email: user.email, username: user.username },
          },
          "Access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

export { register, login, logout, refreshAccessToken };
