const nodemailer = require("nodemailer");

const sendMail = async ({ to, subject, html }) => {
  try {
    const transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: false,
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.MAIL_FROM,
      to,
      subject,
      html,
    });

    console.log("📧 Mail sent:", info.messageId);
  } catch (error) {
    console.error("❌ Mail error:", error.message);
  }
};

module.exports = sendMail;
