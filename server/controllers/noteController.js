const Note = require('../models/Note');

// @desc    Get notes
// @route   GET /api/notes
// @access  Private
const getNotes = async (req, res) => {
    const notes = await Note.find({ user: req.user.id });
    res.status(200).json(notes);
};

// @desc    Create note
// @route   POST /api/notes
// @access  Private
const createNote = async (req, res) => {
    const { title, content, tags, isPinned } = req.body;

    if (!title) {
        res.status(400).json({ message: 'Please add a title' });
        return;
    }

    const note = await Note.create({
        user: req.user.id,
        title,
        content,
        tags,
        isPinned
    });

    res.status(200).json(note);
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
const updateNote = async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(400).json({ message: 'Note not found' });
        return;
    }

    if (note.user.toString() !== req.user.id) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    const updatedNote = await Note.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
    });

    res.status(200).json(updatedNote);
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
const deleteNote = async (req, res) => {
    const note = await Note.findById(req.params.id);

    if (!note) {
        res.status(400).json({ message: 'Note not found' });
        return;
    }

    if (note.user.toString() !== req.user.id) {
        res.status(401).json({ message: 'User not authorized' });
        return;
    }

    await note.deleteOne();

    res.status(200).json({ id: req.params.id });
};

module.exports = {
    getNotes,
    createNote,
    updateNote,
    deleteNote
};
