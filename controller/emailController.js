const nodemailer = require("nodemailer");

console.log("📧 EMAIL USER:", process.env.EMAIL_USER);
console.log("🔑 EMAIL PASS EXISTS:", !!process.env.EMAIL_PASS);

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

transporter.verify(function(error, success) {
    if (error) {
        console.log("❌ SMTP ERROR:", error);
    } else {
        console.log("✅ SMTP READY TO SEND EMAIL");
    }
});



async function sendEmail(to, subject, text) {
    try {
        console.log("📨 SENDING EMAIL TO:", to);

        const info = await transporter.sendMail({
            from: `"NutriLink" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text
        });

        console.log("📧 EMAIL SENT:", info.messageId);
        return info;

    } catch (err) {
        console.log("❌ EMAIL ERROR:", err.message);
        throw err;
    }
}

module.exports = sendEmail;