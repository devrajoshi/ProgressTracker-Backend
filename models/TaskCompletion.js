import mongoose from "mongoose";

const taskCompletionSchema = new mongoose.Schema(
  {
    task_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Task",
      required: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    completionPercentage: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    completed_at: {
      type: Date,
    },
  },
  { timestamps: true }
);

const TaskCompletion = mongoose.model("TaskCompletion", taskCompletionSchema);

export default TaskCompletion;
