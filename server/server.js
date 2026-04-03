require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

const DEFAULT_ALLOWED_ORIGINS = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
  "https://productivity-hub-roan.vercel.app",
];

const allowedOrigins = (
  process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(",")
    : DEFAULT_ALLOWED_ORIGINS
)
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

const corsOptions = {
  origin: (origin, callback) => {
    // Allow non-browser clients (no Origin header) and configured web origins.
    if (!origin) return callback(null, true);

    const normalizedOrigin = origin.replace(/\/$/, "");
    if (allowedOrigins.includes(normalizedOrigin)) {
      return callback(null, true);
    }

    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

// Database Connection
const connectDB = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error("MONGO_URI is not set");
    }

    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

// Routes
const userRoutes = require("./routes/userRoutes");
const taskRoutes = require("./routes/taskRoutes");
const eventRoutes = require("./routes/eventRoutes");
const noteRoutes = require("./routes/noteRoutes");
const plannerRoutes = require("./routes/plannerRoutes");
const searchRoutes = require("./routes/searchRoutes");
const quoteRoutes = require("./routes/quoteRoutes");

app.get("/", (req, res) => {
  res.send("API is running...");
});

app.use("/api/users", userRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/notes", noteRoutes);
app.use("/api/planner", plannerRoutes);
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/search", searchRoutes);
app.use("/api/quote", quoteRoutes);

// Convert middleware/runtime errors (including multer) into JSON responses.
app.use((err, req, res, next) => {
  if (!err) return next();

  if (err.name === "MulterError") {
    if (err.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({ message: "Image too large. Max size is 5MB." });
    }
    return res.status(400).json({ message: err.message || "Image upload failed." });
  }

  return res.status(500).json({ message: err.message || "Server error" });
});

// Scheduler
const initScheduler = require("./utils/scheduler");

// Start Server
connectDB().then(() => {
  initScheduler(); // Start the cron jobs
  const server = app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      console.error(
        `Port ${PORT} already in use. Make sure no other instance is running.`,
      );
      process.exit(1);
    } else {
      console.error("Server error:", err);
    }
  });
});
