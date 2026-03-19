# Productivity Hub

A full-stack productivity application that helps users manage tasks, notes, events, and notifications with automated reminders and calendar synchronization.

## Features

- **Task Management**: Create, update, and track tasks with due dates, priorities, and status tracking
- **Calendar Integration**: Sync tasks and events to external calendars via n8n workflows
- **Notes**: Store and organize personal notes
- **Event Planning**: Schedule and manage events
- **Notifications**: In-app notifications and email reminders for upcoming tasks
- **User Authentication**: Secure account management with JWT authentication
- **Automated Reminders**: Scheduled task reminders via email (Nodemailer)
- **Profile Management**: User profile customization and settings

## Tech Stack

### Client

- **Framework**: React + Vite
- **State Management**: React Context API (AuthContext)
- **HTTP Client**: Axios
- **Styling**: CSS

### Server

- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Scheduling**: node-cron for automated task reminders
- **External Integration**: n8n webhooks for workflow automation
- **File Upload**: Multer middleware

### Workflow Automation

- **n8n**: Workflow automation for calendar sync and advanced features

## Project Structure

```
productivity_hub/
├── client/                          # React frontend
│   ├── src/
│   │   ├── pages/                   # Page components
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Tasks.jsx
│   │   │   ├── Calendar.jsx
│   │   │   ├── Notes.jsx
│   │   │   ├── Planner.jsx
│   │   │   ├── Notifications.jsx
│   │   │   ├── Profile.jsx
│   │   │   ├── Login.jsx
│   │   │   └── Register.jsx
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Authentication context
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   ├── vite.config.js
│   └── index.html
│
├── server/                          # Express backend
│   ├── models/                      # MongoDB schemas
│   │   ├── User.js
│   │   ├── Task.js
│   │   ├── Event.js
│   │   ├── Note.js
│   │   ├── Notification.js
│   │   └── Task.js
│   ├── routes/                      # API routes
│   │   ├── userRoutes.js
│   │   ├── taskRoutes.js
│   │   ├── eventRoutes.js
│   │   ├── noteRoutes.js
│   │   ├── plannerRoutes.js
│   │   └── notificationRoutes.js
│   ├── controllers/                 # Route handlers
│   ├── middleware/                  # Custom middleware
│   │   ├── authMiddleware.js
│   │   └── uploadMiddleware.js
│   ├── services/                    # Business logic
│   │   ├── emailService.js          # Email sending via Nodemailer
│   │   └── n8nService.js            # n8n webhook integration
│   ├── utils/
│   │   └── scheduler.js             # Task reminder cron jobs
│   ├── server.js                    # Express app entry point
│   ├── package.json
│   ├── .env                         # Environment variables
│   ├── test-reminder.js             # Test script for reminders
│   ├── test-basic-webhook.js        # Test script for webhooks
│   └── uploads/                     # File uploads directory
│
├── productivity_hub.json            # n8n workflow definition
└── README.md                        # This file
```

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (local or Atlas)
- npm or yarn
- n8n instance (optional, for workflow automation)
- Gmail account with app password (for email reminders)

### Client Setup

```bash
cd client
npm install
npm run dev
```

The client will start on `http://localhost:5173` (default Vite port).

### Server Setup

```bash
cd server
npm install
```

Create a `.env` file in the `server/` directory with the following variables:

```dotenv
# Database
MONGO_URI=mongodb://127.0.0.1:27017/productivity-hub

# Authentication
JWT_SECRET=your_jwt_secret_key

# Server
PORT=5000

# Email Configuration (Gmail)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password

# Google OAuth (Optional)
GOOGLE_CLIENT_ID=your_google_client_id

# n8n Webhook Integration
N8N_WEBHOOK_URL=http://localhost:5678/webhook/remainder_n8n
```

Start the server:

```bash
npm run dev
```

The server will start on `http://localhost:5000`.

## API Endpoints

### Authentication

- `POST /api/users/register` - Register a new user
- `POST /api/users/login` - Login user
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile

### Tasks

- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `GET /api/tasks/:id` - Get task by ID
- `PUT /api/tasks/:id` - Update task
- `DELETE /api/tasks/:id` - Delete task

### Events

- `GET /api/events` - Get all events
- `POST /api/events` - Create a new event
- `GET /api/events/:id` - Get event by ID
- `PUT /api/events/:id` - Update event
- `DELETE /api/events/:id` - Delete event

### Notes

- `GET /api/notes` - Get all notes
- `POST /api/notes` - Create a new note
- `GET /api/notes/:id` - Get note by ID
- `PUT /api/notes/:id` - Update note
- `DELETE /api/notes/:id` - Delete note

### Notifications

- `GET /api/notifications` - Get all notifications
- `POST /api/notifications` - Create a notification
- `DELETE /api/notifications/:id` - Delete notification

## Features in Detail

### Task Management

Tasks support:

- **Title & Description**: Basic task information
- **Due Dates**: When the task should be completed
- **Status**: pending, in-progress, completed
- **Priority**: low, medium, high
- **Automatic Reminders**: Email notifications 20-30 minutes before due time

### Automated Task Reminders

The server includes a task scheduler (`server/utils/scheduler.js`) that:

1. Runs every minute
2. Checks for tasks due within the next 30 minutes
3. Creates in-app notifications
4. Sends email reminders via Nodemailer
5. Prevents duplicate notifications using `notificationSent` flag

### Email Configuration

Emails are sent using Nodemailer with Gmail SMTP:

```javascript
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});
```

**Note**: Use Gmail app passwords for authentication. Generate one at: https://myaccount.google.com/apppasswords

### n8n Workflow Integration

The `productivity_hub.json` workflow enables:

1. **Calendar Sync**: Automatic task-to-calendar synchronization
2. **Advanced Notifications**: Complex workflow-based notifications

**Webhook Endpoint**: `http://localhost:5678/webhook/remainder_n8n`

**Workflow Structure**:

- Webhook → Receives task/event data
- Gmail Node → Sends emails with proper formatting
- Response Node → Returns 200 OK

## Configuration

### Environment Variables

| Variable           | Description                      | Example                                       |
| ------------------ | -------------------------------- | --------------------------------------------- |
| `MONGO_URI`        | MongoDB connection string        | `mongodb://127.0.0.1:27017/productivity-hub`  |
| `JWT_SECRET`       | Secret key for JWT tokens        | `your-secret-key`                             |
| `PORT`             | Server port                      | `5000`                                        |
| `EMAIL_USER`       | Gmail address for sending emails | `your-email@gmail.com`                        |
| `EMAIL_PASS`       | Gmail app password               | `xxxx xxxx xxxx xxxx`                         |
| `N8N_WEBHOOK_URL`  | n8n webhook endpoint             | `http://localhost:5678/webhook/remainder_n8n` |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID           | (optional)                                    |

## Testing

### Test Task Reminder

Create a test task with a due date in the future and trigger the scheduler:

```bash
cd server
node test-reminder.js
```

This script:

1. Connects to MongoDB
2. Creates a sample task due in 5 minutes
3. Sends a test email via Nodemailer
4. Returns success/failure status

### Test Webhook

Send a test request to the n8n webhook:

```bash
cd server
node test-basic-webhook.js
```

## Troubleshooting

### Email Not Sending

**Problem**: "Error sending email via N8N: Request failed with status code 404"

**Solutions**:

1. Check `N8N_WEBHOOK_URL` in `.env` is correct
2. Ensure n8n workflow is active and deployed
3. Verify webhook path matches the n8n workflow configuration

**Problem**: Nodemailer delivery failures

**Solutions**:

1. Use Gmail app passwords (not regular password)
2. Check `EMAIL_USER` and `EMAIL_PASS` in `.env`
3. Enable "Less secure app access" if using legacy Gmail account
4. Verify SMTP port 587 is not blocked

### Database Connection Issues

**Problem**: "MongoError: connect ECONNREFUSED 127.0.0.1:27017"

**Solutions**:

1. Ensure MongoDB is running: `mongod`
2. Check connection string in `MONGO_URI`
3. Verify database name and credentials

### Tasks Not Getting Reminders

**Problem**: Scheduler doesn't send reminders

**Solutions**:

1. Check server logs for scheduler startup message
2. Ensure task `notificationSent` field is set to `false`
3. Verify due date is within the 30-minute window
4. Check email credentials are valid

## Development

### Running in Development Mode

```bash
# Terminal 1: Start backend with auto-reload
cd server
npm run dev

# Terminal 2: Start frontend
cd client
npm run dev

# Terminal 3: Run n8n (if using workflow automation)
n8n start
```

### Database

MongoDB schema includes:

- **Users**: Email, password hash, profile info
- **Tasks**: Title, description, due date, status, priority, notification flag
- **Events**: Title, date, description
- **Notes**: Content, created/updated timestamps
- **Notifications**: Message, type, read status
- Timestamps (createdAt, updatedAt) for all models

## Security Notes

1. **JWT Authentication**: All protected routes require valid JWT token in Authorization header
2. **Password Hashing**: User passwords are hashed using bcryptjs
3. **Environment Variables**: Never commit `.env` files to version control
4. **CORS**: Configure CORS settings in `server.js` for production

## Future Enhancements

- [ ] Calendar integration (Google Calendar, Outlook)
- [ ] Global search (⌘K) — search across tasks, notes, and events with a single MongoDB query
- [ ] Optimistic UI updates — make the interface feel instant by updating locally before server confirmation
- [ ] Refresh token rotation — implement rotating JWT refresh tokens so sessions don’t just expire and log users out
- [ ] Recurring tasks and events
- [ ] Collaboration and shared tasks
- [ ] Mobile app (React Native)
- [ ] Advanced analytics and reporting
- [ ] Integration with Slack/Teams
- [ ] Dark mode support

## License

MIT

## Support

For issues or questions, please check the troubleshooting section or create an issue in the repository.
