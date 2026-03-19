const Event = require("../models/Event");

// @desc    Get events
// @route   GET /api/events
// @access  Private
const getEvents = async (req, res) => {
  const events = await Event.find({ user: req.user.id });
  res.status(200).json(events);
};

// @desc    Create event
// @route   POST /api/events
// @access  Private
const createEvent = async (req, res) => {
  const { title, description, start, end, allDay } = req.body;

  if (!title || !start || !end) {
    res.status(400).json({ message: "Please add title, start, and end dates" });
    return;
  }

  const event = await Event.create({
    user: req.user.id,
    title,
    description,
    start,
    end,
    allDay,
  });

  // Send email notification instead of N8N sync
  if (req.user && req.user.email) {
    try {
      const { sendEmail } = require("../services/emailService");
      const startDate = new Date(start).toLocaleString();
      const endDate = new Date(end).toLocaleString();

      const emailText = `Event: ${title}\nDescription: ${description || "No description"}\nStart: ${startDate}\nEnd: ${endDate}\n\nCheck your calendar for more details.`;

      const emailHtml = `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f5f5f5; border-radius: 8px;"><h2 style="color: #333;">New Event Created</h2><div style="background: white; padding: 20px; border-radius: 8px; margin-top: 10px;"><p><strong>Event:</strong> ${title}</p><p><strong>Description:</strong> ${description || "No description"}</p><p><strong>Start:</strong> ${startDate}</p><p><strong>End:</strong> ${endDate}</p></div><p style="color: #666; margin-top: 15px; font-size: 0.9em;">Please sign in to view the event in the app.</p></div>`;

      await sendEmail(
        req.user.email,
        "New Event: " + title,
        emailText,
        emailHtml,
      );
    } catch (error) {
      console.error("Error sending event notification email:", error.message);
      // Don't fail the request if email fails
    }
  }

  res.status(200).json(event);
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
const updateEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(400).json({ message: "Event not found" });
    return;
  }

  if (event.user.toString() !== req.user.id) {
    res.status(401).json({ message: "User not authorized" });
    return;
  }

  const updatedEvent = await Event.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
  });

  res.status(200).json(updatedEvent);
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
const deleteEvent = async (req, res) => {
  const event = await Event.findById(req.params.id);

  if (!event) {
    res.status(400).json({ message: "Event not found" });
    return;
  }

  if (event.user.toString() !== req.user.id) {
    res.status(401).json({ message: "User not authorized" });
    return;
  }

  await event.deleteOne();

  res.status(200).json({ id: req.params.id });
};

module.exports = {
  getEvents,
  createEvent,
  updateEvent,
  deleteEvent,
};
