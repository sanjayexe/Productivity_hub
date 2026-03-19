const axios = require("axios");

const n8nUrl = process.env.N8N_WEBHOOK_URL;

// ⚠️ DEPRECATED: Calendar sync now uses Nodemailer email instead
// Keep function as stub for backward compatibility
const syncToCalendar = async (data) => {
  console.log("✓ Calendar events are now sent via email notifications");
  return true;
};

const sendEmailViaN8N = async (to, subject, text, type = "notification") => {
  if (!n8nUrl) {
    console.log("N8N Webhook URL not set, skipping email via N8N");
    return false;
  }

  // send payload keys that match the workflow (email and message)
  const payload = {
    action: "send_email",
    type,
    email: to,
    subject,
    message: text,
  };

  console.log("sendEmailViaN8N using URL:", n8nUrl, "payload:", payload);

  try {
    const response = await axios.post(n8nUrl, payload);
    console.log(`Email sent via N8N to ${to}`, "status", response.status);
    return true;
  } catch (error) {
    console.error(
      "Error sending email via N8N:",
      error.message,
      "url:",
      n8nUrl,
      "payload",
      payload,
    );
    return false;
  }
};

module.exports = {
  syncToCalendar,
  sendEmailViaN8N,
};
