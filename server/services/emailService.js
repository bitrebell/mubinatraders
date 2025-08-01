const nodemailer = require('nodemailer');

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  async sendEmail(to, subject, html, text = null) {
    try {
      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, '') // Strip HTML for text version
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully:', result.messageId);
      return result;
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
  }

  async sendWelcomeEmail(email, name) {
    const subject = 'Welcome to College Notes Manager!';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">Welcome to College Notes Manager!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            Welcome to College Notes Manager - your one-stop solution for managing college notes and previous year question papers.
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="color: #667eea; margin-top: 0;">What you can do:</h3>
            <ul style="color: #666; line-height: 1.8;">
              <li>📝 Upload and share your notes with classmates</li>
              <li>📋 Access previous year question papers</li>
              <li>🔍 Search and filter content by subject, semester, and department</li>
              <li>📧 Get email notifications for new uploads</li>
              <li>⭐ Rate and review study materials</li>
            </ul>
          </div>
          <p style="color: #666; line-height: 1.6;">
            Start exploring and contributing to build a comprehensive knowledge base for your college!
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}" 
               style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold;">
              Get Started
            </a>
          </div>
        </div>
        <div style="background: #333; color: #ccc; padding: 20px; text-align: center; font-size: 14px;">
          <p>College Notes Manager &copy; ${new Date().getFullYear()}</p>
          <p>If you have any questions, feel free to contact our support team.</p>
        </div>
      </div>
    `;

    return this.sendEmail(email, subject, html);
  }

  async sendNewNotesNotification(email, name, notesTitle, subject, department) {
    const emailSubject = `New Notes Available: ${notesTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📝 New Notes Available!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            New notes have been uploaded that might interest you:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4CAF50;">
            <h3 style="color: #4CAF50; margin-top: 0;">${notesTitle}</h3>
            <p style="color: #666; margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Department:</strong> ${department}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/notes" 
               style="background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold;">
              View Notes
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, emailSubject, html);
  }

  async sendNewQuestionPaperNotification(email, name, paperTitle, subject, department, year) {
    const emailSubject = `New Question Paper: ${paperTitle}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); padding: 30px; text-align: center;">
          <h1 style="color: white; margin: 0;">📋 New Question Paper Available!</h1>
        </div>
        <div style="padding: 30px; background-color: #f9f9f9;">
          <h2 style="color: #333;">Hi ${name}!</h2>
          <p style="color: #666; line-height: 1.6;">
            A new question paper has been uploaded:
          </p>
          <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #FF9800;">
            <h3 style="color: #FF9800; margin-top: 0;">${paperTitle}</h3>
            <p style="color: #666; margin: 10px 0;"><strong>Subject:</strong> ${subject}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Department:</strong> ${department}</p>
            <p style="color: #666; margin: 10px 0;"><strong>Year:</strong> ${year}</p>
          </div>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/questions" 
               style="background: linear-gradient(135deg, #FF9800 0%, #F57C00 100%); 
                      color: white; padding: 12px 30px; text-decoration: none; 
                      border-radius: 6px; font-weight: bold;">
              View Question Papers
            </a>
          </div>
        </div>
      </div>
    `;

    return this.sendEmail(email, emailSubject, html);
  }

  async sendBulkNotification(users, subject, html) {
    const promises = users.map(user => {
      if (user.notifications && user.notifications.email) {
        return this.sendEmail(user.email, subject, html);
      }
    });

    try {
      await Promise.allSettled(promises);
      console.log(`Bulk notification sent to ${users.length} users`);
    } catch (error) {
      console.error('Bulk notification error:', error);
    }
  }
}

module.exports = new EmailService();
