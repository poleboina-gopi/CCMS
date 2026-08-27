const nodemailer = require('nodemailer');
const { db } = require('../db');

// Create transporter based on environment config or local fallback
let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT || 587;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (smtpHost && smtpUser && smtpPass) {
    transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: Number(smtpPort) === 465,
      auth: {
        user: smtpUser,
        pass: smtpPass
      }
    });
    console.log(`📧 SMTP Email service connected to host: ${smtpHost}`);
  } else {
    // Local development mock transporter that captures emails without requiring real SMTP credentials
    transporter = nodemailer.createTransport({
      jsonTransport: true
    });
    console.log('📬 Email service initialized in Local Development / Direct Dispatch Mode.');
  }

  return transporter;
}

/**
 * Send automated email notification to student when their complaint is marked as Resolved.
 */
async function sendResolutionEmail({
  to,
  studentName = 'Student',
  ticketNumber,
  title,
  category,
  location,
  resolutionNotes = 'The reported issue has been inspected, repaired, and verified by our maintenance crew.',
  resolvedBy = 'Campus Maintenance Staff',
  complaintId
}) {
  try {
    if (!to) {
      console.warn('⚠️ Cannot send resolution email: No recipient email address provided.');
      return false;
    }

    const fromAddress = process.env.FROM_EMAIL || '"CampusResolve Helpdesk" <notifications@campusresolve.edu>';
    const subject = `✅ Issue Resolved: [${ticketNumber}] ${title}`;

    const htmlBody = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    body { font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f9; color: #1e293b; margin: 0; padding: 20px; }
    .container { max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.08); border: 1px solid #e2e8f0; }
    .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); padding: 28px 24px; text-align: center; color: #ffffff; }
    .header h1 { margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.02em; }
    .header p { margin: 6px 0 0; font-size: 14px; opacity: 0.9; }
    .content { padding: 28px 24px; }
    .ticket-badge { display: inline-block; background: #ecfdf5; color: #059669; font-weight: 800; font-size: 13px; padding: 4px 10px; border-radius: 6px; border: 1px solid #a7f3d0; margin-bottom: 14px; font-family: monospace; }
    .details-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; }
    .details-table td { padding: 10px 12px; border-bottom: 1px solid #f1f5f9; }
    .details-table td.label { font-weight: 600; color: #64748b; width: 35%; background: #f8fafc; }
    .details-table td.value { font-weight: 500; color: #0f172a; }
    .resolution-box { background: #f0fdf4; border: 1px solid #bbf7d0; border-left: 4px solid #10b981; padding: 14px 16px; border-radius: 6px; margin: 20px 0; }
    .resolution-box h4 { margin: 0 0 6px; color: #166534; font-size: 14px; font-weight: 700; }
    .resolution-box p { margin: 0; font-size: 14px; color: #14532d; line-height: 1.5; }
    .cta-btn { display: inline-block; background: #6366f1; color: #ffffff !important; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 700; font-size: 14px; margin-top: 10px; }
    .footer { background: #f8fafc; padding: 18px 24px; text-align: center; font-size: 12px; color: #94a3b8; border-top: 1px solid #e2e8f0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Campus Complaint Resolved</h1>
      <p>CampusResolve • College Grievance Redressal Portal</p>
    </div>
    <div class="content">
      <p style="font-size: 15px; margin-top: 0;">Dear <strong>${studentName}</strong>,</p>
      <p style="font-size: 14px; color: #475569; line-height: 1.6;">
        We are pleased to inform you that your campus complaint has been marked as <strong>Resolved</strong> by our operations team.
      </p>

      <div class="ticket-badge">#${ticketNumber}</div>

      <table class="details-table">
        <tr>
          <td class="label">Complaint Title</td>
          <td class="value">${title}</td>
        </tr>
        <tr>
          <td class="label">Category</td>
          <td class="value">${category}</td>
        </tr>
        <tr>
          <td class="label">Location</td>
          <td class="value">${location}</td>
        </tr>
        <tr>
          <td class="label">Resolved By</td>
          <td class="value">${resolvedBy}</td>
        </tr>
        <tr>
          <td class="label">Resolved At</td>
          <td class="value">${new Date().toLocaleString()}</td>
        </tr>
      </table>

      <div class="resolution-box">
        <h4>🔧 Resolution Remarks from Staff:</h4>
        <p>${resolutionNotes}</p>
      </div>

      <div style="text-align: center; margin: 24px 0 10px;">
        <p style="font-size: 13px; color: #64748b; margin-bottom: 12px;">
          Please log into your student portal to review the repair and submit your 5-star feedback rating to confirm closure.
        </p>
        <a href="http://localhost:5173" class="cta-btn">View Ticket & Rate Resolution</a>
      </div>
    </div>
    <div class="footer">
      <p style="margin: 0;">Campus Operations & Grievance Cell • CampusResolve CCMS</p>
      <p style="margin: 4px 0 0;">This is an automated notification from the College Complaint Management System.</p>
    </div>
  </div>
</body>
</html>
    `;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html: htmlBody,
      text: `Hello ${studentName},\n\nYour complaint #${ticketNumber} ("${title}") has been marked as RESOLVED.\n\nResolution Details: ${resolutionNotes}\nResolved by: ${resolvedBy}\n\nPlease login to review and provide your feedback rating.`
    };

    const mailer = getTransporter();
    const info = await mailer.sendMail(mailOptions);

    // Save to emails collection for auditing
    try {
      const { Email } = require('../db');
      await Email.create({
        recipient_email: to,
        recipient_name: studentName,
        subject,
        body_html: htmlBody,
        complaint_id: complaintId || null,
        status: 'sent'
      });
    } catch (dbErr) {
      console.error('Failed to log email to database:', dbErr);
    }

    console.log(`\n================== 📧 AUTOMATED RESOLUTION EMAIL DISPATCHED ==================`);
    console.log(`To: ${studentName} <${to}>`);
    console.log(`Subject: ${subject}`);
    console.log(`Ticket: #${ticketNumber} - ${title}`);
    console.log(`Resolved by: ${resolvedBy}`);
    console.log(`Resolution Notes: ${resolutionNotes}`);
    console.log(`===============================================================================\n`);

    return true;
  } catch (error) {
    console.error('❌ Failed to send resolution email:', error);
    return false;
  }
}

module.exports = {
  sendResolutionEmail,
  getTransporter
};
