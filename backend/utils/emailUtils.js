// utils/emailUtils.js
const nodemailer = require('nodemailer');

const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: parseInt(process.env.EMAIL_PORT),
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Exported alias used by adminController bulk-email
const createTransporterInstance = createTransporter;

/**
 * Send Blood Request Email to Donor
 */
const sendBloodRequestEmail = async (donorEmail, donorName, requesterName, bloodGroup, hospital, urgency) => {
  const transporter = createTransporter();
  const urgencyColor = urgency === 'critical' ? '#e53e3e' : urgency === 'urgent' ? '#dd6b20' : '#3182ce';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: donorEmail,
    subject: `🩸 Blood Request - ${urgency.toUpperCase()} | ${bloodGroup} Required`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #c0392b, #e74c3c); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🩸 Blood Donation Request</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Someone needs your help today</p>
        </div>
        <div style="padding: 30px;">
          <div style="background: ${urgencyColor}20; border-left: 4px solid ${urgencyColor}; padding: 15px; border-radius: 0 8px 8px 0; margin-bottom: 20px;">
            <strong style="color: ${urgencyColor}; text-transform: uppercase; font-size: 14px;">⚠️ ${urgency} Request</strong>
          </div>
          <p style="font-size: 16px; color: #333;">Dear <strong>${donorName}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">You have received a blood donation request from <strong>${requesterName}</strong>.</p>
          <div style="background: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
            <h3 style="margin: 0 0 15px; color: #c0392b;">Request Details</h3>
            <p style="margin: 8px 0;"><strong>Blood Group:</strong> <span style="background: #e74c3c; color: white; padding: 2px 10px; border-radius: 20px;">${bloodGroup}</span></p>
            <p style="margin: 8px 0;"><strong>Hospital:</strong> ${hospital}</p>
            <p style="margin: 8px 0;"><strong>Requester:</strong> ${requesterName}</p>
          </div>
          <p style="color: #555; line-height: 1.6;">Please log in to your account to accept or decline this request.</p>
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL}/donor-dashboard" style="background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">View Request →</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>BloodConnect - Saving Lives Together 🩸</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send Request Status Update Email to Requester
 */
const sendRequestStatusEmail = async (requesterEmail, requesterName, donorName, status, bloodGroup, message) => {
  const transporter = createTransporter();
  const statusColor = status === 'accepted' ? '#27ae60' : '#e74c3c';
  const statusIcon = status === 'accepted' ? '✅' : '❌';

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: requesterEmail,
    subject: `${statusIcon} Blood Request ${status.charAt(0).toUpperCase() + status.slice(1)} | ${bloodGroup}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, ${statusColor}, ${statusColor}cc); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">${statusIcon} Request ${status.charAt(0).toUpperCase() + status.slice(1)}</h1>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Dear <strong>${requesterName}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">Your blood request for <strong>${bloodGroup}</strong> has been <strong style="color: ${statusColor};">${status}</strong> by donor <strong>${donorName}</strong>.</p>
          ${message ? `<div style="background: #f8f9fa; border-radius: 8px; padding: 15px; margin: 15px 0;"><strong>Message from donor:</strong><p style="margin: 8px 0; color: #555;">${message}</p></div>` : ''}
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL}/dashboard" style="background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">View Dashboard →</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>BloodConnect - Saving Lives Together 🩸</p>
        </div>
      </div>
    `,
  });
};

/**
 * Send Welcome Email
 */
const sendWelcomeEmail = async (email, name, role) => {
  const transporter = createTransporter();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: email,
    subject: '🩸 Welcome to BloodConnect!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #c0392b, #e74c3c); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 28px;">🩸 Welcome to BloodConnect</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">Every drop counts. You're making a difference.</p>
        </div>
        <div style="padding: 30px;">
          <p style="font-size: 16px; color: #333;">Dear <strong>${name}</strong>,</p>
          <p style="color: #555; line-height: 1.6;">Welcome aboard! Your account has been created as a <strong>${role}</strong>.</p>
          ${role === 'donor' ? '<p style="color: #555;">Please complete your donor profile so patients can find you. Remember to get admin approval to appear in search results.</p>' : '<p style="color: #555;">You can now search for donors and request blood in emergencies.</p>'}
          <div style="text-align: center; margin: 25px 0;">
            <a href="${process.env.CLIENT_URL}/login" style="background: linear-gradient(135deg, #c0392b, #e74c3c); color: white; padding: 14px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">Get Started →</a>
          </div>
        </div>
        <div style="background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px;">
          <p>BloodConnect - Saving Lives Together 🩸</p>
        </div>
      </div>
    `,
  });
};

module.exports = {
  sendBloodRequestEmail,
  sendRequestStatusEmail,
  sendWelcomeEmail,
  createTransporterInstance,
};
