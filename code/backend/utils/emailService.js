const nodemailer = require("nodemailer");

/**
 * Creates and returns the nodemailer transporter.
 * Uses environment variables if configured, otherwise returns null for safe simulation.
 */
function getTransporter() {
    const rawUser = process.env.EMAIL_USER;
    const rawPass = process.env.EMAIL_PASS;

    if (!rawUser || !rawPass) {
        return null;
    }

    const user = rawUser.trim();
    const pass = rawPass.trim().replace(/\s+/g, "");

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

/**
 * Automatically generates and sends a rejection/feedback notification email to a worker
 * when an admin declines their registration application.
 */
async function sendWorkerRejectionEmail(worker, reason = "") {
    const workerName = worker?.userId?.name || "Applicant";
    const workerEmail = worker?.userId?.email;
    const category = worker?.category || "Professional Services";
    const feedbackReason = reason || worker?.rejectionReason || "Application qualifications or submitted verification documents do not meet our current marketplace criteria.";
    const portalUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    if (!workerEmail) {
        console.warn("[EMAIL WARNING] Cannot send rejection email: worker.userId.email is missing.");
        return { success: false, error: "Missing recipient email" };
    }

    const subject = "Update Regarding Your ServeConnect Professional Registration Application";

    const text = `Hi ${workerName},

Thank you for your interest in partnering with ServeConnect as a service professional.

Our administration team has completed the review of your registration application for ${category}. At this time, we are unable to approve your application.

Reason / Administrator Feedback:
${feedbackReason}

What You Can Do:
If you believe this decision was made in error or if you have updated credentials, trade certifications, or verification documents to submit, please feel free to update your profile or contact our partner verification desk at support@serveconnect.com.

Thank you for your time and interest in ServeConnect.

Best regards,
The ServeConnect Verification Team
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
            <td style="background: linear-gradient(135deg, #1e293b 0%, #334155 100%); padding: 32px; text-align: center;">
              <h1 style="margin: 0; color: #ffffff; font-size: 24px; font-weight: 800; letter-spacing: -0.5px;">ServeConnect</h1>
              <p style="margin: 4px 0 0 0; color: #94a3b8; font-size: 13px; font-weight: 500;">Partner Verification Console</p>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px;">
              <div style="display: inline-block; background-color: #fef2f2; border: 1px solid #fecaca; border-radius: 9999px; padding: 6px 14px; margin-bottom: 16px;">
                <span style="color: #dc2626; font-weight: 700; font-size: 13px; letter-spacing: 0.5px; text-transform: uppercase;">Application Status: Not Approved</span>
              </div>

              <h2 style="margin: 0 0 14px 0; color: #0f172a; font-size: 20px; font-weight: 800;">
                Application Status Update
              </h2>

              <p style="margin: 0 0 16px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Hi <strong>${workerName}</strong>,
              </p>

              <p style="margin: 0 0 20px 0; color: #475569; font-size: 15px; line-height: 1.6;">
                Thank you for applying to offer your <strong>${category}</strong> services on ServeConnect. Our verification team has completed reviewing your submission. At this time, we are unable to approve your application.
              </p>

              <!-- Reason Box -->
              <div style="background-color: #fff1f2; border: 1.5px solid #fecaca; border-left: 5px solid #dc2626; padding: 18px 20px; border-radius: 8px; margin-bottom: 24px;">
                <div style="font-size: 12px; font-weight: 700; color: #991b1b; text-transform: uppercase; letter-spacing: 0.7px; margin-bottom: 6px;">
                  Review Feedback & Reason from Administration:
                </div>
                <div style="color: #7f1d1d; font-size: 14.5px; line-height: 1.55; font-weight: 500;">
                  "${feedbackReason}"
                </div>
              </div>

              <!-- Next Steps Box -->
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                <h3 style="margin: 0 0 8px 0; color: #1e293b; font-size: 14px; font-weight: 700;">
                  Can I re-apply or update my details?
                </h3>
                <p style="margin: 0; color: #64748b; font-size: 13.5px; line-height: 1.6;">
                  Yes. If you have valid credentials, updated government proof, or address verification that addresses the feedback above, you may reach out directly to our partner desk or update your application.
                </p>
              </div>

              <div style="text-align: center; margin-bottom: 20px;">
                <a href="mailto:support@serveconnect.com?subject=Application%20Inquiry%20-%20${encodeURIComponent(workerName)}" style="background-color: #0f172a; color: #ffffff; padding: 12px 28px; border-radius: 8px; font-weight: 600; font-size: 14px; text-decoration: none; display: inline-block;">
                  Contact Verification Support →
                </a>
              </div>

              <p style="margin: 0; color: #94a3b8; font-size: 13px; text-align: center;">
                If you have questions regarding this review, contact us at <a href="mailto:support@serveconnect.com" style="color: #2563eb; text-decoration: none;">support@serveconnect.com</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px 32px; text-align: center;">
              <p style="margin: 0 0 4px 0; color: #64748b; font-size: 12px;">
                © 2026 ServeConnect — Trusted Local Hands. All rights reserved.
              </p>
              <p style="margin: 0; color: #94a3b8; font-size: 11px;">
                This is an automated notification regarding your partner registration request.
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
    sendWorkerApprovalEmail,
    sendWorkerRejectionEmail
};

