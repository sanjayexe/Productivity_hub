const cron = require('node-cron');
const Task = require('../models/Task');
const Notification = require('../models/Notification');
const User = require('../models/User'); // Need User to get email
const { sendEmail } = require('../services/emailService');
const OpenAI = require("openai");

const initScheduler = () => {
    // Run every minute
    cron.schedule('* * * * *', async () => {
        console.log('Running Task Scheduler...');
        try {
            const now = new Date();
            // Check tasks due 20-30 mins from now (approx gap)
            // Or simpler: tasks due in the next 30 minutes that haven't been notified
            const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);
            
            const tasks = await Task.find({
                dueDate: { $gte: now, $lte: thirtyMinutesFromNow },
                status: { $ne: 'completed' },
                notificationSent: false
            }).populate('user');

            for (const task of tasks) {
                let message = `Reminder: Task "${task.title}" is due soon (at ${new Date(task.dueDate).toLocaleTimeString()})`;
                
                // Try to use OpenRouter to generate a personalized reminder
                try {
                    const openai = new OpenAI({
                        baseURL: "https://openrouter.ai/api/v1",
                        apiKey: process.env.OPENROUTER_API_KEY,
                    });
                    const prompt = `Write a short, friendly, and personalized reminder email for the following task.
Task: ${task.title}
Description: ${task.description || 'No description'}
Priority: ${task.priority}

Keep it under 3 sentences. Make it feel like a helpful assistant nudge, not a generic alert. Do not include subject lines or greetings like "Dear User", just the body of the message.`;
                    
                    const completion = await openai.chat.completions.create({
                        model: "openai/gpt-4o-mini",
                        messages: [{ role: "user", content: prompt }],
                        max_tokens: 200
                    });
                    
                    if (completion.choices[0].message.content) {
                        message = completion.choices[0].message.content.trim();
                    }
                } catch (aiError) {
                    console.error('OpenRouter AI generation failed, falling back to default message:', aiError.message);
                }

                // 1. Create In-App Notification
                await Notification.create({
                    user: task.user._id,
                    message: message,
                    type: 'task_due'
                });

                // 2. Send External Message (Email)
                // Use task.user.email
                if (task.user && task.user.email) {
                    await sendEmail(task.user.email, 'Task Reminder', message);
                }

                // 3. Mark as notified so we don't spam
                task.notificationSent = true;
                await task.save();
                console.log(`Notification processed for task: ${task.title}`);
            }

        } catch (error) {
            console.error('Scheduler Error:', error);
        }
    });
};

module.exports = initScheduler;
