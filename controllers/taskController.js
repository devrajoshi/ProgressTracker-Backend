import Task from "../models/Task.js";
import mongoose from "mongoose";
import TaskCompletion from "../models/TaskCompletion.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// Create a new task
const createTask = async (req, res) => {
  try {
    const { name, description, priority, start_time, end_time, recurrence } =
      req.body;

    // Validate required fields
    if (!name || !start_time || !end_time) {
      throw new ApiError(
        400,
        "Task name, start time, and end time are required"
      );
    }

    // Validate time format (HH:mm)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      throw new ApiError(400, "Invalid time format. Use HH:mm (e.g., 08:00)");
    }

    // Convert start_time and end_time to Date objects with today's date
    const today = new Date();
    const [startHours, startMinutes] = start_time.split(":").map(Number);
    const [endHours, endMinutes] = end_time.split(":").map(Number);

    const newStartTime = new Date(today);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(today);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

    // Validate that end_time is after start_time
    if (newEndTime <= newStartTime) {
      throw new ApiError(400, "End time must be after start time");
    }

    // Check for overlapping tasks
    const overlappingTask = await Task.findOne({
      user_id: req.user._id,
      $or: [
        {
          start_time: { $lt: newEndTime },
          end_time: { $gt: newStartTime },
        },
      ],
    });

    if (overlappingTask) {
      throw new ApiError(400, "This task overlaps with an existing task");
    }

    // Create the task
    const newTask = new Task({
      user_id: req.user._id,
      name,
      description,
      priority,
      start_time: newStartTime,
      end_time: newEndTime,
      recurrence,
    });

    await newTask.save();

    // Format the response times for display
    const responseTask = newTask.toObject();
    responseTask.start_time = newTask.start_time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    responseTask.end_time = newTask.end_time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return res
      .status(201)
      .json(new ApiResponse(201, responseTask, "Task created successfully"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while creating task", err);
  }
};

// Fetch all tasks for the authenticated user
const getTasks = async (req, res) => {
  try {
    // Ensure the user is authenticated
    if (!req.user || !req.user._id) {
      throw new ApiError(401, "Unauthorized: User not authenticated");
    }

    // Fetch tasks for the authenticated user
    const tasks = await Task.find({ user_id: req.user._id }).sort({
      created_at: -1,
    });

    // Get today's date for completion status
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Format times for display in HH:mm format and add completion status
    const formattedTasks = await Promise.all(
      tasks.map(async (task) => {
        // Ensure we have valid Date objects
        const startTime = new Date(task.start_time);
        const endTime = new Date(task.end_time);

        // Format time to HH:mm
        const formatTime = (date) => {
          if (!(date instanceof Date) || isNaN(date.getTime())) {
            console.error("Invalid date:", date);
            return "Invalid time";
          }
          const hours = String(date.getHours()).padStart(2, "0");
          const minutes = String(date.getMinutes()).padStart(2, "0");
          return `${hours}:${minutes}`;
        };

        // Get completion status for today
        const completionRecord = await TaskCompletion.findOne({
          task_id: task._id,
          user_id: req.user._id,
          date: today,
        });

        // Get all completion records for this task
        const allCompletionRecords = await TaskCompletion.find({
          task_id: task._id,
          user_id: req.user._id,
        }).sort({ date: -1 });

        // Create a new object with formatted times and completion status
        const formattedTask = {
          ...task.toObject(),
          start_time: formatTime(startTime),
          end_time: formatTime(endTime),
          original_start_time: task.start_time,
          original_end_time: task.end_time,
          completionPercentage: completionRecord?.completionPercentage || 0,
          completionHistory: allCompletionRecords.map((record) => ({
            date: record.date,
            completionPercentage: record.completionPercentage,
            completed_at: record.completed_at,
          })),
        };

        return formattedTask;
      })
    );

    return res
      .status(200)
      .json(new ApiResponse(200, formattedTasks, "Tasks fetched successfully"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while fetching tasks", err);
  }
};

// Update an existing task
const updateTask = async (req, res) => {
  try {
    const { _id } = req.params;
    const { name, description, priority, start_time, end_time, recurrence } =
      req.body;

    // Validate task ID format
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new ApiError(400, "Invalid task ID");
    }

    // Check if task exists
    const existingTask = await Task.findById(_id);
    if (!existingTask) {
      throw new ApiError(404, "Task not found");
    }

    // Validate time inputs (HH:mm format)
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(start_time) || !timeRegex.test(end_time)) {
      throw new ApiError(400, "Invalid time format. Use HH:mm");
    }

    // Create Date objects with original task's date but new times
    const [startHours, startMinutes] = start_time.split(":").map(Number);
    const [endHours, endMinutes] = end_time.split(":").map(Number);

    const newStartTime = new Date(existingTask.start_time);
    newStartTime.setHours(startHours, startMinutes, 0, 0);

    const newEndTime = new Date(existingTask.end_time);
    newEndTime.setHours(endHours, endMinutes, 0, 0);

    // Validate time logic
    if (newEndTime <= newStartTime) {
      throw new ApiError(400, "End time must be after start time");
    }

    // Check for overlapping tasks (same day only)
    const startOfDay = new Date(newStartTime);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(newStartTime);
    endOfDay.setHours(23, 59, 59, 999);

    const overlappingTasks = await Task.find({
      user_id: existingTask.user_id,
      _id: { $ne: _id }, // Exclude the current task being updated
      start_time: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        {
          start_time: { $lt: newEndTime },
          end_time: { $gt: newStartTime },
        },
      ],
    });

    if (overlappingTasks.length > 0) {
      const formattedOverlaps = overlappingTasks.map((task) => ({
        name: task.name,
        time: `${task.start_time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })} - ${task.end_time.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        })}`,
      }));
      throw new ApiError(400, "Time overlaps with existing tasks", {
        overlaps: formattedOverlaps,
      });
    }

    // Update the task
    const updatedTask = await Task.findByIdAndUpdate(
      _id,
      {
        name,
        description,
        priority,
        start_time: newStartTime,
        end_time: newEndTime,
        recurrence,
      },
      { new: true, runValidators: true }
    );

    // Format the response times for display
    const responseTask = updatedTask.toObject();
    responseTask.start_time = updatedTask.start_time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    responseTask.end_time = updatedTask.end_time.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });

    return res
      .status(200)
      .json(new ApiResponse(200, responseTask, "Task updated successfully"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while updating task", err);
  }
};

// Delete a task
const deleteTask = async (req, res) => {
  try {
    const { _id } = req.params;

    // Validate taskId format
    if (!mongoose.Types.ObjectId.isValid(_id)) {
      throw new ApiError(400, "Invalid task ID");
    }

    const deletedTask = await Task.findByIdAndDelete(_id);

    if (!deletedTask) {
      throw new ApiError(404, "Task not found");
    }

    return res
      .status(200)
      .json(new ApiResponse(200, null, "Task deleted successfully"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while deleting task", err);
  }
};

// Mark a task as completed
const markTaskAsCompleted = async (req, res) => {
  try {
    const { id } = req.params;
    const { date, completionPercentage } = req.body;

    // Check if the task exists
    const task = await Task.findById(id);
    if (!task) {
      throw new ApiError(404, "Task not found");
    }

    // Create or update the completion record
    const completionRecord = await TaskCompletion.findOneAndUpdate(
      { task_id: id, user_id: req.user._id, date },
      {
        completionPercentage: completionPercentage || 100,
        completed_at: Date.now(),
      },
      { upsert: true, new: true }
    );

    return res
      .status(200)
      .json(new ApiResponse(200, completionRecord, "Task marked as completed"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while marking task as completed", err);
  }
};

// Get task history with completion status
const getTaskHistory = async (req, res) => {
  try {
    console.log("Fetching history for user:", req.user._id);

    const history = await TaskCompletion.find({
      user_id: req.user._id,
    })
      .populate("task_id", "name")
      .sort({ date: -1 });

    console.log("Found history records:", history.length);
    console.log("Sample history record:", history[0]);

    return res
      .status(200)
      .json(new ApiResponse(200, history, "Task history fetched successfully"));
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    throw new ApiError(500, "Error while fetching task history", err);
  }
};

export {
  createTask,
  getTasks,
  updateTask,
  deleteTask,
  markTaskAsCompleted,
  getTaskHistory,
};
