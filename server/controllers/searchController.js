const Task = require("../models/Task");
const Note = require("../models/Note");
const Event = require("../models/Event");

// global search across tasks, notes, events for a user
const globalSearch = async (req, res) => {
  const { q } = req.query;
  const userId = req.user._id;
  if (!q) {
    return res.status(400).json({ message: "Query parameter required" });
  }

  const regex = new RegExp(q, "i");

  try {
    const [tasks, notes, events] = await Promise.all([
      Task.find({ user: userId, title: regex }),
      Note.find({ user: userId, content: regex }),
      Event.find({ user: userId, title: regex }),
    ]);
    res.json({ tasks, notes, events });
  } catch (error) {
    console.error("Search error", error);
    res.status(500).json({ message: "Server error" });
  }
};

module.exports = { globalSearch };
