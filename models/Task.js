import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: {
      type: String,
      required: [true, "Task name is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "Medium",
    },
    start_time: {
      type: Date,
      required: [true, "Start time is required"],
    },
    end_time: {
      type: Date,
      required: [true, "End time is required"],
    },
    recurrence: {
      type: String,
      enum: ["Daily", "Weekly", "Custom", "None"],
      default: "Daily",
    },
  },
  { timestamps: true }
);

const Task = mongoose.model("Task", taskSchema);

export default Task;
