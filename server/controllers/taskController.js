const Task = require("../models/Task");
const OpenAI = require("openai");
const { resolveTimeZone } = require("../utils/dateTime");

// @desc    Get tasks
// @route   GET /api/tasks
// @access  Private
const getTasks = async (req, res) => {
  const tasks = await Task.find({ user: req.user.id });
  res.status(200).json(tasks);
};

// @desc    Set task
// @route   POST /api/tasks
// @access  Private
const setTask = async (req, res) => {
  if (!req.body.title) {
    res.status(400).json({ message: "Please add a title" });
    return;
  }

  const task = await Task.create({
    user: req.user.id,
    title: req.body.title,
    description: req.body.description,
    dueDate: req.body.dueDate,
    timezone: resolveTimeZone(req.body.timezone),
    status: req.body.status,
    priority: req.body.priority,
  });

  res.status(200).json(task);
};

// @desc    Update task
// @route   PUT /api/tasks/:id
// @access  Private
const updateTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(400).json({ message: "Task not found" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  if (task.user.toString() !== req.user.id) {
    res.status(401).json({ message: "User not authorized" });
    return;
  }

  const updatedTask = await Task.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedTask);
};

// @desc    Delete task
// @route   DELETE /api/tasks/:id
// @access  Private
const deleteTask = async (req, res) => {
  const task = await Task.findById(req.params.id);

  if (!task) {
    res.status(400).json({ message: "Task not found" });
    return;
  }

  if (!req.user) {
    res.status(401).json({ message: "User not found" });
    return;
  }

  if (task.user.toString() !== req.user.id) {
    res.status(401).json({ message: "User not authorized" });
    return;
  }

  await task.deleteOne();

  res.status(200).json({ id: req.params.id });
};

// @desc    Smart breakdown task into subtasks using Gemini
// @route   POST /api/tasks/smart-breakdown
// @access  Private
const smartBreakdown = async (req, res) => {
  try {
    const { title, description } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Please provide a task title" });
    }

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const prompt = `Break down the following task into 5-10 actionable subtasks.
Task Title: ${title}
Task Description: ${description || "No description provided."}

Respond ONLY with a valid JSON array of objects, where each object has these exact keys:
- "title" (string, the subtask name)
- "duration" (string, estimated time like "15 mins", "1 hour")
- "priority" (string, strictly one of: "low", "medium", "high")

Do not include any markdown formatting, code blocks, or extra text outside the JSON array. Just the raw JSON.`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content;
    responseText = responseText
      .replace(/^```(json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const subtasks = JSON.parse(responseText);
    res.status(200).json(subtasks);
  } catch (error) {
    console.error("Smart Breakdown Error:", error);
    res.status(500).json({ message: "Failed to generate smart breakdown" });
  }
};

// @desc    Create task from natural language text
// @route   POST /api/tasks/nl
// @access  Private
const createTaskNL = async (req, res) => {
  try {
    const { text, timezone } = req.body;
    if (!text) {
      return res
        .status(400)
        .json({ message: "Please provide natural language text" });
    }

    const taskTimeZone = resolveTimeZone(timezone);

    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
    });

    const now = new Date().toLocaleString("en-US", { timeZone: taskTimeZone });
    const prompt = `You are an AI task assistant. Parse the following user request and extract the task details.
User Request: "${text}"
Current Date and Time (${taskTimeZone}): ${now}

Instructions:
1. Determine a concise "title" for the task.
2. Determine the "dueDate". Calculate it based on the Current Date and Time and the user's text. Return it as a valid ISO 8601 string. If no time is specified, default to 17:00:00 local time of that day. If no date is specified at all, return null.
3. Determine the "priority". It MUST be strictly one of: "low", "medium", or "high". Infer from context ("urgent", "top priority" = high). Default to "medium".
4. Determine the "description". If the user is asking to email someone, follow up, or message someone, Draft an email/message template and include it in the description. Otherwise, summarize any extra details from the prompt. 

Respond ONLY with a valid JSON object with the exact keys:
- "title" (string)
- "dueDate" (string or null)
- "priority" (string)
- "description" (string)

Do not include any markdown formatting, code blocks, or extra text outside the JSON object. Just the raw JSON.`;

    const completion = await openai.chat.completions.create({
      model: "openai/gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 1000,
    });

    let responseText = completion.choices[0].message.content;
    responseText = responseText
      .replace(/^```(json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsedData = JSON.parse(responseText);

    const task = await Task.create({
      user: req.user.id,
      title: parsedData.title,
      description: parsedData.description,
      dueDate: parsedData.dueDate,
      timezone: taskTimeZone,
      priority: parsedData.priority || "medium",
      status: "pending",
    });

    res.status(200).json(task);
  } catch (error) {
    console.error("Create Task NL Error:", error);
    res.status(500).json({ message: "Failed to create task from NLP" });
  }
};

module.exports = {
  getTasks,
  setTask,
  updateTask,
  deleteTask,
  smartBreakdown,
  createTaskNL,
};
