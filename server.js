import express from "express";
import cors from "cors";
import connectDB from "./config/db.js";
import dotenv from "dotenv";
import router from "./routes/index.js";
import cookieParser from "cookie-parser";

dotenv.config(); // Load environment variables

const app = express();

// Configure CORS with specific origin
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5173", // Vite's default port
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

// Parse cookies
app.use(cookieParser());

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

app.use(express.static("public")); // Serve static files from the "public" directory

connectDB(); // Creating database connection

// Mount routes
app.use("/api", router); // load all the routes (index.js)

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
