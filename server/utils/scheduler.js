const cron = require("node-cron");
const Task = require("../models/Task");
const Notification = require("../models/Notification");
const { sendEmail } = require("../services/emailService");
const { resolveTimeZone, formatDateTime } = require("./dateTime");

const REMINDER_WINDOWS = [
  {
    offsetMinutes: 10,
    flagName: "reminder10Sent",
    subject: "Task Reminder - 10 minutes left",
    label: "10 minutes",
  },
  {
    offsetMinutes: 1,
    flagName: "reminder1Sent",
    subject: "Task Reminder - 1 minute left",
    label: "1 minute",
  },
];

const buildWindowRange = (now, offsetMinutes) => {
  const targetTime = now.getTime() + offsetMinutes * 60000;
  return {
    start: new Date(targetTime - 60000),
    end: new Date(targetTime + 60000),
  };
};

const initScheduler = () => {
  // Run every minute
  cron.schedule("* * * * *", async () => {
    console.log("Running Task Scheduler...");
    try {
      const now = new Date();
      for (const windowConfig of REMINDER_WINDOWS) {
        const { start, end } = buildWindowRange(
          now,
          windowConfig.offsetMinutes,
        );

        const tasks = await Task.find({
          dueDate: { $gte: start, $lt: end },
          status: { $ne: "completed" },
          [windowConfig.flagName]: false,
        }).populate("user");

        for (const task of tasks) {
          const claimResult = await Task.updateOne(
            {
              _id: task._id,
              [windowConfig.flagName]: false,
            },
            {
              $set: { [windowConfig.flagName]: true },
            },
          );

          if (claimResult.modifiedCount !== 1) {
            continue;
          }

          const taskTimeZone = resolveTimeZone(task.timezone);
          const dueTime = formatDateTime(task.dueDate, taskTimeZone);
          const message = `Reminder: Task "${task.title}" is due in ${windowConfig.label} at ${dueTime}.`;

          await Notification.create({
            user: task.user._id,
            message: message,
            type: "task_due",
          });

          if (task.user && task.user.email) {
            await sendEmail(task.user.email, windowConfig.subject, message);
          }

          console.log(
            `Notification processed for task: ${task.title} (${windowConfig.label} reminder)`,
          );
        }
      }
    } catch (error) {
      console.error("Scheduler Error:", error);
    }
  });
};

module.exports = initScheduler;
