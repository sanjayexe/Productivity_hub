const Task = require('../models/Task');
const Event = require('../models/Event');

// @desc    Generate a daily plan
// @route   POST /api/planner/generate
// @access  Private
// @desc    Generate a daily plan
// @route   POST /api/planner/generate
// @access  Private
const generatePlan = async (req, res) => {
    const { date } = req.body;
    const targetDate = date ? new Date(date) : new Date();
    
    // Define day window (e.g., 9 AM to 6 PM)
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(9, 0, 0, 0);
    
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(18, 0, 0, 0);

    // MongoDB Query bounds (full 24h day to catch all events for the day)
    const queryStart = new Date(targetDate);
    queryStart.setHours(0,0,0,0);
    const queryEnd = new Date(targetDate);
    queryEnd.setHours(23,59,59,999);

    try {
        // 1. Fetch Events (Fixed Blocks)
        const events = await Event.find({
            user: req.user.id,
            start: { $gte: queryStart, $lte: queryEnd }
        }).lean();

        // 2. Fetch Pending Tasks
        const tasks = await Task.find({ 
            user: req.user.id,
            status: { $ne: 'completed' } 
        }).lean();

        // 3. Separate Tasks into Timed (Fixed) and Floating
        const fixedItems = events.map(e => ({
            ...e,
            type: 'event',
            duration: (new Date(e.end) - new Date(e.start)) / 60000 // duration in mins
        }));

        const floatingTasks = [];

        tasks.forEach(task => {
            if (task.dueDate) {
                const taskTime = new Date(task.dueDate);
                // Only consider it "Timed" if it falls within our query day
                if (taskTime >= queryStart && taskTime <= queryEnd) {
                    fixedItems.push({
                        _id: task._id,
                        title: task.title,
                        start: taskTime,
                        end: new Date(taskTime.getTime() + 30 * 60000), // Assume 30 mins for timed tasks
                        type: 'focus_block',
                        priority: task.priority,
                        isFixed: true,
                        duration: 30
                    });
                } else {
                    floatingTasks.push(task);
                }
            } else {
                floatingTasks.push(task);
            }
        });

        // Sort Fixed Items by Start Time
        fixedItems.sort((a, b) => new Date(a.start) - new Date(b.start));

        // Sort Floating Tasks by Priority
        const priorityScore = { high: 3, medium: 2, low: 1 };
        floatingTasks.sort((a, b) => priorityScore[b.priority] - priorityScore[a.priority]);

        // 4. Fill Gaps
        const schedule = [];
        let currentTime = new Date(startOfDay);

        // Advance start time if "today" and currentTime is past 9 AM
        const now = new Date();
        if (targetDate.toDateString() === now.toDateString() && now > startOfDay) {
             // If it's already past 6 PM, just show summary? 
             // Let's assume user wants to reschedule even if late, or just start from 'now'
             if (now < endOfDay) {
                 currentTime = new Date(now);
                 // Round up to nearest 15 mins for neatness
                 const remainder = 15 - (currentTime.getMinutes() % 15);
                 currentTime.setMinutes(currentTime.getMinutes() + remainder);
             }
        }

        const addToSchedule = (item) => {
            schedule.push(item);
        };

        // Loop through fixed items
        for (const item of fixedItems) {
            const itemStart = new Date(item.start);
            const itemEnd = new Date(item.end);

            // If item starts after current time, we have a gap
            if (itemStart > currentTime) {
                let gapDuration = (itemStart - currentTime) / 60000; // mins
                
                // Try to fit floating tasks
                for (let i = 0; i < floatingTasks.length; i++) {
                    if (gapDuration < 30) break; // Gap too small for anything useful

                    const task = floatingTasks[i];
                    if (task.scheduled) continue; // Skip if already scheduled

                    const taskDuration = 45; // Standard focus block duration
                    
                    if (gapDuration >= taskDuration) {
                        // Schedule it
                        addToSchedule({
                            _id: task._id,
                            title: `Focus: ${task.title}`,
                            start: new Date(currentTime),
                            end: new Date(currentTime.getTime() + taskDuration * 60000),
                            type: 'focus_block',
                            priority: task.priority,
                            duration: `${taskDuration} mins`
                        });

                        // Update current time and gap
                        currentTime = new Date(currentTime.getTime() + taskDuration * 60000);
                        gapDuration -= taskDuration;
                        task.scheduled = true; // Mark as scheduled
                    }
                }
            }

            // Ensure we don't go backwards if items overlap
            if (currentTime < itemStart) {
                 currentTime = itemStart;
            }

            // Add the fixed item itself
            addToSchedule({
                ...item,
                start: itemStart, // ensure Date object
                end: itemEnd,     // ensure Date object
                duration: item.duration ? `${Math.round(item.duration)} mins` : '30 mins'
            });

            // Advance time to end of this item
            if (itemEnd > currentTime) {
                currentTime = itemEnd;
            }
        }

        // Check for empty slot after last fixed item until EndOfDay
        if (currentTime < endOfDay) {
            let gapDuration = (endOfDay - currentTime) / 60000;
             for (let i = 0; i < floatingTasks.length; i++) {
                if (gapDuration < 30) break;
                const task = floatingTasks[i];
                if (task.scheduled) continue;

                const taskDuration = 45;
                if (gapDuration >= taskDuration) {
                     addToSchedule({
                        _id: task._id,
                        title: `Focus: ${task.title}`,
                        start: new Date(currentTime),
                        end: new Date(currentTime.getTime() + taskDuration * 60000),
                        type: 'focus_block',
                        priority: task.priority,
                        duration: `${taskDuration} mins`
                    });
                    currentTime = new Date(currentTime.getTime() + taskDuration * 60000);
                    gapDuration -= taskDuration;
                    task.scheduled = true;
                }
            }
        }

        // Generate Summary
        const totalScheduled = schedule.filter(i => i.type === 'focus_block').length;
        const eventsCount = schedule.filter(i => i.type === 'event').length;
        const summary = `Generated a plan with ${eventsCount} events and ${totalScheduled} focus blocks. You have ${floatingTasks.filter(t => !t.scheduled).length} tasks remaining in the backlog.`;

        // 5. Response
        res.json({
            date: startOfDay.toISOString().split('T')[0],
            summary,
            schedule,
            metrics: {
                totalTasks: tasks.length,
                pendingHighPriority: tasks.filter(t => t.priority === 'high' && !taskIsScheduled(t)).length,
                eventsCount: events.length
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error generating plan' });
    }
    
    // Helper to check if task was mapped
    function taskIsScheduled(t) {
        // Since we modify the floatingTasks array in memory (adding .scheduled), this works assuming 'tasks' reference persisted or we look up
        // Actually 'tasks' array items might not have .scheduled if floatingTasks cloned them.
        // floatingTasks items ARE from tasks array (references) so it should work.
        // But for safety:
        return t.scheduled;
    }
};

module.exports = {
    generatePlan
};
