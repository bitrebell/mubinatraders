const nodemailer = require('nodemailer');
const crypto = require('crypto');

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransporter({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    secure: false, // true for 465, false for other ports
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });
};

// Generate OTP
const generateOTP = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Generate secure token
const generateToken = () => {
  return crypto.randomBytes(32).toString('hex');
};

// Send email verification OTP
const sendVerificationOTP = async (email, firstName, otp) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Email Verification - College Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Email Verification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .otp-box { background: white; border: 2px dashed #667eea; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; }
            .otp-code { font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 5px; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .btn { display: inline-block; background: #667eea; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🎓 College Management System</h1>
              <p>Email Verification Required</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>Welcome to our College Management System! To complete your registration, please verify your email address using the OTP below:</p>
              
              <div class="otp-box">
                <p>Your verification code is:</p>
                <div class="otp-code">${otp}</div>
                <p><small>This code will expire in 10 minutes</small></p>
              </div>
              
              <p>If you didn't create an account, please ignore this email.</p>
              
              <div class="footer">
                <p>Best regards,<br>College Management Team</p>
                <p><small>This is an automated email. Please do not reply.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send password reset email
const sendPasswordResetEmail = async (email, firstName, resetUrl) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: 'Password Reset - College Management System',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Password Reset</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .btn { display: inline-block; background: #f5576c; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; text-align: center; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset</h1>
              <p>College Management System</p>
            </div>
            <div class="content">
              <h2>Hello ${firstName}!</h2>
              <p>We received a request to reset your password. Click the button below to create a new password:</p>
              
              <div style="text-align: center;">
                <a href="${resetUrl}" class="btn">Reset Password</a>
              </div>
              
              <div class="warning">
                <strong>⚠️ Security Notice:</strong>
                <ul>
                  <li>This link will expire in 1 hour</li>
                  <li>If you didn't request this reset, please ignore this email</li>
                  <li>Your password will remain unchanged</li>
                </ul>
              </div>
              
              <p>If the button doesn't work, copy and paste this URL into your browser:</p>
              <p style="word-break: break-all; background: #e9ecef; padding: 10px; border-radius: 5px;">
                ${resetUrl}
              </p>
              
              <div class="footer">
                <p>Best regards,<br>College Management Team</p>
                <p><small>This is an automated email. Please do not reply.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

// Send event notification email
const sendEventNotification = async (emails, event) => {
  try {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      bcc: emails, // Use BCC for multiple recipients
      subject: `New Event: ${event.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>New Event Notification</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
            .event-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4facfe; }
            .footer { text-align: center; margin-top: 20px; color: #666; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📅 New Event Announcement</h1>
              <p>College Management System</p>
            </div>
            <div class="content">
              <h2>${event.title}</h2>
              
              <div class="event-details">
                <p><strong>📝 Description:</strong></p>
                <p>${event.description}</p>
                
                <p><strong>📅 Date:</strong> ${new Date(event.startDate).toLocaleDateString()}</p>
                <p><strong>⏰ Time:</strong> ${event.startTime} - ${event.endTime}</p>
                <p><strong>📍 Venue:</strong> ${event.venue}</p>
                <p><strong>🏷️ Type:</strong> ${event.eventType.charAt(0).toUpperCase() + event.eventType.slice(1)}</p>
              </div>
              
              <p>Don't miss out on this exciting event! Mark your calendar and be there.</p>
              
              <div class="footer">
                <p>Best regards,<br>College Management Team</p>
                <p><small>This is an automated notification.</small></p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email sending error:', error);
    return { success: false, error: error.message };
  }
};

module.exports = {
  generateOTP,
  generateToken,
  sendVerificationOTP,
  sendPasswordResetEmail,
  sendEventNotification
};
