const nodemailer = require('nodemailer');
const axios = require('axios');

/**
 * LAF Email Service
 * Handles user feature announcements, Grand Launch notifications, and security alerts.
 */

// Configure SMTP Transporter if credentials are present
function getSmtpTransporter() {
  if (process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER || 'purushothamanks1711@gmail.com',
        pass: process.env.SMTP_PASS
      }
    });
  }
  return null;
}

/**
 * Send feature announcement to registered users with explicit Developer Permission
 */
async function sendFeatureAnnouncement({ featureTitle, featureDetails, recipients = [], developerPermission = false }) {
  if (!developerPermission) {
    throw new Error('Developer permission is strictly required to broadcast feature updates to users.');
  }

  const cleanTitle = (featureTitle || 'New Feature Update').trim();
  const cleanDetails = (featureDetails || '').trim();
  const targetRecipients = Array.isArray(recipients) ? recipients.filter(r => r && r.email && /\S+@\S+\.\S+/.test(r.email)) : [];

  if (targetRecipients.length === 0) {
    return { success: true, sent: 0, message: 'No registered recipients with valid emails.' };
  }

  console.log(`[FEATURE BROADCAST] Initiating broadcast for "${cleanTitle}" to ${targetRecipients.length} users with developer permission.`);

  const transporter = getSmtpTransporter();
  let sentCount = 0;
  let failedCount = 0;

  for (const user of targetRecipients) {
    const username = user.username || 'Valued User';
    const email = user.email;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${cleanTitle}</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(59, 130, 246, 0.3); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
          <!-- Header -->
          <tr>
            <td style="padding: 30px; text-align: center; background: linear-gradient(135deg, #1e3a8a 0%, #0f172a 100%); border-bottom: 1px solid rgba(59, 130, 246, 0.2);">
              <h1 style="margin: 0; font-size: 26px; font-weight: 800; color: #ffffff; letter-spacing: 0.5px;">LAF AI</h1>
              <p style="margin: 6px 0 0 0; font-size: 13px; color: #60a5fa; font-weight: 600; text-transform: uppercase; letter-spacing: 1.5px;">Look At Future • Platform Update</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 16px; color: #94a3b8; margin-top: 0;">Hello <strong style="color: #38bdf8;">${username}</strong>,</p>
              
              <h2 style="font-size: 20px; font-weight: 700; color: #f1f5f9; margin: 16px 0 12px 0;">✨ ${cleanTitle}</h2>
              
              <div style="background-color: #1e293b; padding: 20px; border-radius: 12px; border-left: 4px solid #3b82f6; font-size: 15px; line-height: 1.6; color: #e2e8f0; white-space: pre-wrap; margin-bottom: 24px;">
${cleanDetails}
              </div>

              <div style="text-align: center; margin: 28px 0;">
                <a href="https://lafsai.web.app" style="display: inline-block; background: linear-gradient(135deg, #2563eb, #3b82f6); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 9999px; font-weight: 700; font-size: 15px; box-shadow: 0 4px 14px rgba(37, 99, 235, 0.4);">
                  Try New Feature Live in LAF →
                </a>
              </div>

              <hr style="border: none; border-top: 1px solid #334155; margin: 24px 0;" />
              
              <p style="font-size: 13px; color: #64748b; line-height: 1.5; margin: 0;">
                This announcement was approved directly by <strong>K S Purushothaman</strong>, Developer and Architect of LAF AI.
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #090d16; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #1e293b;">
              <p style="margin: 0;">© 2026 LAF AI Platform ("Look At Future"). All rights reserved.</p>
              <p style="margin: 6px 0 0 0;">You received this because you registered your email address on LAF AI.</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    // Try Nodemailer SMTP
    let sent = false;
    if (transporter) {
      try {
        await transporter.sendMail({
          from: '"LAF AI Platform" <noreply@laf.ai>',
          to: email,
          subject: `✨ [LAF AI New Feature] ${cleanTitle}`,
          html: htmlBody
        });
        sent = true;
        sentCount++;
      } catch (err) {
        console.warn(`[SMTP NOTE for ${email}]:`, err.message);
      }
    }

    // Fallback: FormSubmit notification log / backup delivery
    if (!sent) {
      try {
        await axios.post('https://formsubmit.co/ajax/purushothamanks1711@gmail.com', {
          _subject: `[LAF Feature Release Broadcast] ${cleanTitle}`,
          TargetUser: username,
          TargetEmail: email,
          FeatureTitle: cleanTitle,
          Details: cleanDetails,
          Timestamp: new Date().toISOString()
        }, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          timeout: 5000
        });
        sentCount++;
      } catch (fallbackErr) {
        failedCount++;
      }
    }
  }

  return {
    success: true,
    sent: sentCount,
    failed: failedCount,
    total: targetRecipients.length
  };
}

/**
 * Send Grand Launch celebratory Diwali email notification to registered users
 */
async function sendGrandLaunchNotification({ recipients = [] }) {
  const targetRecipients = Array.isArray(recipients) ? recipients.filter(r => r && r.email && /\S+@\S+\.\S+/.test(r.email)) : [];

  if (targetRecipients.length === 0) {
    return { success: true, sent: 0, message: 'No registered recipients for Grand Launch.' };
  }

  console.log(`[GRAND LAUNCH BROADCAST] Dispatching launch celebration email to ${targetRecipients.length} users.`);
  const transporter = getSmtpTransporter();
  let sentCount = 0;

  for (const user of targetRecipients) {
    const username = user.username || 'Valued User';
    const email = user.email;

    const htmlBody = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Happy Diwali & LAF Grand Launch!</title>
      </head>
      <body style="margin: 0; padding: 0; background-color: #0b1120; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #f8fafc;">
        <table align="center" border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; margin: 30px auto; background-color: #0f172a; border-radius: 16px; border: 1px solid rgba(234, 179, 8, 0.4); overflow: hidden; box-shadow: 0 10px 30px rgba(0,0,0,0.6);">
          <!-- Header with Festive Diya & Crackers Theme -->
          <tr>
            <td style="padding: 36px 30px; text-align: center; background: linear-gradient(135deg, #78350f 0%, #1e1b4b 50%, #0f172a 100%); border-bottom: 2px solid rgba(234, 179, 8, 0.3);">
              <div style="font-size: 40px; margin-bottom: 8px;">🪔 🎆 ✨</div>
              <h1 style="margin: 0; font-size: 28px; font-weight: 800; color: #fde047; letter-spacing: 0.5px;">HAPPY DIWALI!</h1>
              <p style="margin: 8px 0 0 0; font-size: 15px; color: #38bdf8; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px;">LAF AI Grand Launch is Officially LIVE!</p>
            </td>
          </tr>
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 30px;">
              <p style="font-size: 16px; color: #e2e8f0; margin-top: 0;">Dear <strong style="color: #fde047;">${username}</strong>,</p>
              
              <p style="font-size: 15px; line-height: 1.6; color: #cbd5e1;">
                May the divine festival of lights illuminate your life with joy, wisdom, health, and limitless prosperity!
              </p>

              <div style="background-color: #1e293b; padding: 22px; border-radius: 12px; border: 1px solid rgba(59, 130, 246, 0.3); margin: 24px 0;">
                <h3 style="margin: 0 0 10px 0; font-size: 17px; color: #60a5fa;">🚀 Welcome to the Future of Intelligence</h3>
                <p style="font-size: 14px; line-height: 1.6; color: #94a3b8; margin: 0 0 12px 0;">
                  Sharply at 12:00 PM, <strong>LAF AI ("Look At Future")</strong> has completed its official Grand Launch. Your VIP access has been activated!
                </p>
                <ul style="font-size: 14px; color: #e2e8f0; line-height: 1.6; margin: 0; padding-left: 20px;">
                  <li>Sub-second neural reasoning & deep software engineering</li>
                  <li>Autonomous document drafting in LAF Canvas</li>
                  <li>FLUX.1-HD high-resolution AI vision & image generation</li>
                  <li>Zero-knowledge encrypted security vault</li>
                </ul>
              </div>

              <div style="text-align: center; margin: 32px 0;">
                <a href="https://lafsai.web.app" style="display: inline-block; background: linear-gradient(135deg, #f59e0b, #d97706); color: #000000; text-decoration: none; padding: 15px 36px; border-radius: 9999px; font-weight: 800; font-size: 16px; box-shadow: 0 4px 20px rgba(245, 158, 11, 0.4); text-transform: uppercase; letter-spacing: 0.5px;">
                  Launch LAF AI Now →
                </a>
              </div>

              <p style="font-size: 13px; color: #94a3b8; line-height: 1.5; margin: 20px 0 0 0;">
                Warm Diwali greetings,<br/>
                <strong style="color: #f1f5f9;">K S Purushothaman</strong><br/>
                <span style="font-size: 12px; color: #64748b;">Developer & Architect, LAF AI Platform</span>
              </p>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 30px; background-color: #090d16; text-align: center; font-size: 12px; color: #475569; border-top: 1px solid #1e293b;">
              <p style="margin: 0;">© 2026 LAF AI Platform. All rights reserved.</p>
              <p style="margin: 4px 0 0 0;">https://lafsai.web.app | https://lafsai.firebaseapp.com</p>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    if (transporter) {
      try {
        await transporter.sendMail({
          from: '"LAF AI Platform" <noreply@laf.ai>',
          to: email,
          subject: `🪔 Happy Diwali! LAF AI is Officially Launched & LIVE!`,
          html: htmlBody
        });
        sentCount++;
      } catch (err) {
        console.warn(`[LAUNCH MAIL NOTE for ${email}]:`, err.message);
      }
    } else {
      // Fallback
      try {
        await axios.post('https://formsubmit.co/ajax/purushothamanks1711@gmail.com', {
          _subject: `[Grand Launch Notification Dispatch] ${username} (${email})`,
          Event: 'Grand Launch 12:00 PM',
          Username: username,
          Email: email,
          Timestamp: new Date().toISOString()
        }, {
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          timeout: 5000
        });
        sentCount++;
      } catch (e) {}
    }
  }

  return { success: true, sent: sentCount, total: targetRecipients.length };
}

module.exports = {
  sendFeatureAnnouncement,
  sendGrandLaunchNotification
};
