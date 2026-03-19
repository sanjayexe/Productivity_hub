const nodemailer = require("nodemailer");

const sendEmail = async (to, subject, text, html = null) => {
  // Use Nodemailer directly
  try {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error(
        "❌ Email credentials not configured. Set EMAIL_USER and EMAIL_PASS in .env",
      );
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: process.env.EMAIL_SERVICE || "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    // Verify transporter connection
    await transporter.verify();
    console.log("✓ Email service connected");

    // Use a friendly display name and include headers that help deliverability
    const mailOptions = {
      from: `${process.env.EMAIL_FROM_NAME || "Productivity Hub"} <${process.env.EMAIL_USER}>`,
      to: to,
      replyTo: process.env.EMAIL_REPLY_TO || process.env.EMAIL_USER,
      subject: subject,
      text: text,
      html: html || `<p>${text}</p>`,
      headers: {
        "X-Mailer": "ProductivityHub-Mailer",
        "List-Unsubscribe": `<mailto:${process.env.EMAIL_USER}?subject=unsubscribe>`,
      },
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✓ Email sent to ${to}: ${info.response}`);
    return true;
  } catch (error) {
    console.error("❌ Error sending email:", error.message);
    console.error("Error details:", error);
    return false;
  }
};

module.exports = { sendEmail };
