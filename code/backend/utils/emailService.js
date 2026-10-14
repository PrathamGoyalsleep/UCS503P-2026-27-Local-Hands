const nodemailer = require("nodemailer");

/**
 * Creates and returns the nodemailer transporter.
 * Uses environment variables if configured, otherwise returns null for safe simulation.
 */
function getTransporter() {
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;

    if (!user || !pass) {
        return null;
    }

    if (process.env.EMAIL_SERVICE) {
        return nodemailer.createTransport({
            service: process.env.EMAIL_SERVICE,
            auth: { user, pass }
        });
    }

    return nodemailer.createTransport({
        host: process.env.EMAIL_HOST || "smtp.gmail.com",
        port: process.env.EMAIL_PORT ? parseInt(process.env.EMAIL_PORT, 10) : 587,
        secure: process.env.EMAIL_SECURE === "true" || process.env.EMAIL_PORT === "465",
        auth: { user, pass }
    });
}

/**
 * Generic email sender with automatic fallback to console simulation when SMTP is unconfigured.
 */
async function sendEmail({ to, subject, html, text }) {
    const from = process.env.EMAIL_FROM || `"ServeConnect Support" <${process.env.EMAIL_USER || "notifications@serveconnect.com"}>`;

    const transporter = getTransporter();

    if (!transporter) {
        console.log("\n=======================================================");
        console.log(" [AUTOMATIC EMAIL GENERATOR - SIMULATED DELIVERY]");
        console.log(` To:      ${to}`);
        console.log(` From:    ${from}`);
        console.log(` Subject: ${subject}`);
        console.log("-------------------------------------------------------");
        console.log(text || html);
        console.log("=======================================================\n");
        return { success: true, simulated: true, to, subject };
    }

    try {
        const info = await transporter.sendMail({
            from,
            to,
            subject,
            text,
            html
        });
        console.log(`[EMAIL DISPATCHED] Email sent to ${to}. MessageId: ${info.messageId}`);
        return { success: true, messageId: info.messageId, to, subject };
    } catch (error) {
        console.error(`[EMAIL ERROR] Failed to send email to ${to}:`, error.message);
        return { success: false, error: error.message };
    }
}

/**
 * Automatically generates and sends an approval notification email to a worker
 * when an admin accepts their application.
 */
async function sendWorkerApprovalEmail(worker) {
    const workerName = worker?.userId?.name || "Professional";
    const workerEmail = worker?.userId?.email;
    const category = worker?.category || "Professional Services";
    const location = worker?.location || "Your City";
    const charges = worker?.charges ? `₹${worker.charges}/hour` : "Standard Rates";
    const experience = worker?.experience ? `${worker.experience} Years` : "Experienced";
    const phone = worker?.phone || "Registered Contact";
    const portalUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!workerEmail) {
        console.warn("[EMAIL WARNING] Cannot send worker approval email: worker.userId.email is missing.");
        return { success: false, error: "Missing recipient email" };
    }

    const subject = "🎉 Congratulations! Your ServeConnect Professional Profile Has Been Approved";

    const text = `Hi ${workerName},

Congratulations! Your registration as a service professional on ServeConnect has been reviewed and APPROVED by our administration team.

Profile Details:
- Service Category: ${category}
- Location: ${location}
- Hourly Charges: ${charges}
- Experience: ${experience}
- Contact Phone: ${phone}

Your profile is now live on the ServeConnect directory. Customers in ${location} can now discover, contact, and book your services.

To view and manage incoming service requests, visit:
${portalUrl}/bookings

Thank you for partnering with ServeConnect!

Best regards,
The ServeConnect Team
https://serveconnect.com`;

    const html = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0;">
          
          <!-- Brand Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%); padding: 36px 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">ServeConnect</h1>
              <p style="margin: 6px 0 0 0; color: #bfdbfe; font-size: 14px; font-weight: 500;">Trusted Home Services Marketplace</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <div style="display: inline-block; background-color: #ecfdf5; border: 1px solid #a7f3d0; border-radius: 9999px; padding: 6px 14px; margin-bottom: 16px;">
                <span style="color: #059669; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">✓ Application Approved</span>
              </div>

              <h2 style="margin: 0 0 12px 0; color: #0f172a; font-size: 22px; font-weight: 800;">
                Welcome to ServeConnect, ${workerName}!
              </h2>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Great news! Your professional service provider application has been verified and <strong>approved by our admin team</strong>. Your profile is now officially live on our platform.
              </p>

              <!-- Profile Details Card -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; margin-bottom: 24px;">
                <tr>
                  <td style="padding: 20px;">
                    <h3 style="margin: 0 0 14px 0; color: #1e293b; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.8px;">Verified Profile Details</h3>
                    <table role="presentation" width="100%" cellspacing="0" cellpadding="6" style="font-size: 14px;">
                      <tr>
                        <td width="35%" style="color: #64748b; font-weight: 600;">Category:</td>
                        <td style="color: #0f172a; font-weight: 700;">${category}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Location:</td>
                        <td style="color: #0f172a; font-weight: 600;">${location}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Charges:</td>
                        <td style="color: #0f172a; font-weight: 600;">${charges}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Experience:</td>
                        <td style="color: #0f172a; font-weight: 600;">${experience}</td>
                      </tr>
                      <tr>
                        <td style="color: #64748b; font-weight: 600;">Contact Phone:</td>
                        <td style="color: #0f172a; font-weight: 600;">${phone}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- What's Next Box -->
              <div style="background-color: #eff6ff; border-left: 4px solid #2563eb; padding: 16px; border-radius: 0 8px 8px 0; margin-bottom: 28px;">
                <p style="margin: 0; color: #1e40af; font-size: 14px; line-height: 1.5;">
                  <strong>What happens next?</strong> Customers in ${location} searching for <strong>${category}</strong> can now view your credentials and send you direct service bookings.
                </p>
              </div>

              <!-- Call to Action Button -->
              <div style="text-align: center; margin-bottom: 24px;">
                <a href="${portalUrl}/bookings" style="background: linear-gradient(135deg, #1d4ed8 0%, #2563eb 100%); color: #ffffff; padding: 14px 32px; border-radius: 10px; font-weight: 700; font-size: 15px; text-decoration: none; display: inline-block; box-shadow: 0 4px 14px rgba(37,99,235,0.35);">
                  View Your Job Dashboard →
                </a>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                Need help or have questions? Contact support anytime at <a href="mailto:support@serveconnect.com" style="color: #2563eb; text-decoration: none;">support@serveconnect.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 6px 0; color: #64748b; font-size: 12px;">
                © 2026 ServeConnect — Trusted Local Hands. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                You received this automatic email because your service provider application on ServeConnect was accepted by an administrator.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

    return sendEmail({
        to: workerEmail,
        subject,
        text,
        html
    });
}

module.exports = {
    sendEmail,
    sendWorkerApprovalEmail
};
