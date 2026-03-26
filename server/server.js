require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cookieParser = require("cookie-parser");

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(
  cors({
    origin: "https://productivity-hub-roan.vercel.app/",
    credentials: true,
  }),
);
app.use(cookieParser());
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// Database Connection
const connectDB = async () => {
  try {
    const conn = await mongoose.connect(
      process.env.MONGO_URI || "mongodb://127.0.0.1:27017/productivity-hub",
    );
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
