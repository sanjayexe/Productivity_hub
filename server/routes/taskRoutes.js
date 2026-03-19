const express = require('express');
const router = express.Router();
const {
    getTasks,
    setTask,
    updateTask,
    deleteTask,
    smartBreakdown,
    createTaskNL,
} = require('../controllers/taskController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getTasks).post(protect, setTask);
router.post('/smart-breakdown', protect, smartBreakdown);
router.post('/nl', protect, createTaskNL);
router.route('/:id').put(protect, updateTask).delete(protect, deleteTask);

module.exports = router;
