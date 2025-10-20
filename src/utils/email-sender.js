const nodemailer = require('nodemailer');
require('dotenv').config();
const logger = require('./logger');

class EmailSender {
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD
      },
      tls: {
        rejectUnauthorized: false
      }
    });
  }

  /**
   * Verify SMTP connection
   * @returns {Promise<boolean>}
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('SMTP connection verified');
      return true;
    } catch (error) {
      logger.error(`SMTP verification failed: ${error.message}`);
      return false;
    }
  }

  async sendEmail({ to, subject, text, html, from }) {
    try {
      const mailOptions = {
        from: from || `"Email Spam Report Tool" <${process.env.SMTP_USER}>`,
        to,
        subject,
        text: text || '',
        html: html || text
      };

      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      
      return {
        success: true,
        messageId: info.messageId,
        accepted: info.accepted,
        rejected: info.rejected
      };

    } catch (error) {
      logger.error(`Error sending email to ${to}: ${error.message}`);
      throw error;
    }
  }

  /**
   * Send test email
   * @param {string} to - Recipient email
   * @returns {Promise<object>}
   */
  async sendTestEmail(to) {
    const subject = 'Email Spam Report Tool - Test Email';
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <h2 style="color: #667eea;">Test Email</h2>
        <p>This is a test email from the Email Spam Report Tool.</p>
        <p>If you received this, your email configuration is working correctly!</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Email Spam Report Tool<br>
          © ${new Date().getFullYear()}
        </p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send welcome email
   * @param {string} to - Recipient email
   * @returns {Promise<object>}
   */
  async sendWelcomeEmail(to) {
    const subject = 'Welcome to Email Spam Report Tool';
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f3f4f6;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                <tr>
                  <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                    <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">
                      Welcome! 🎉
                    </h1>
                    <p style="margin: 10px 0 0; color: #e0e7ff; font-size: 16px;">
                      Email Spam Report Tool
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 40px 30px;">
                    <h2 style="margin: 0 0 20px; color: #111827; font-size: 20px;">
                      Get Started with Email Deliverability Testing
                    </h2>
                    <p style="margin: 0 0 15px; color: #4b5563; line-height: 1.6;">
                      Thank you for using our Email Spam Report Tool! Here's how to test your email deliverability:
                    </p>
                    <ol style="color: #4b5563; line-height: 1.8; padding-left: 20px;">
                      <li>Create a test and get your unique test code</li>
                      <li>Send an email to our test inboxes with your test code</li>
                      <li>Start the detection process</li>
                      <li>Receive a comprehensive deliverability report</li>
                    </ol>
                    <p style="margin: 20px 0 0; color: #4b5563; line-height: 1.6;">
                      Our tool checks Gmail, Outlook, and Yahoo to see where your emails land - Inbox, Spam, or Promotions tab.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 0 30px 40px 30px; text-align: center;">
                    <a href="${config.baseUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: #ffffff; text-decoration: none; padding: 15px 40px; border-radius: 6px; font-weight: 600; font-size: 16px;">
                      Start Testing
                    </a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 30px; text-align: center; background-color: #f9fafb; border-top: 1px solid #e5e7eb;">
                    <p style="margin: 0; color: #6b7280; font-size: 14px;">
                      Need help? Check our documentation or contact support.
                    </p>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 20px 30px; text-align: center; background-color: #111827; color: #9ca3af; font-size: 12px;">
                    <p style="margin: 0;">
                      © ${new Date().getFullYear()} Email Spam Report Tool. All rights reserved.
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

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send error notification to admin
   * @param {string} errorMessage - Error message
   * @param {object} context - Additional context
   * @returns {Promise<object>}
   */
  async sendErrorNotification(errorMessage, context = {}) {
    try {
      const subject = `⚠️ Error Alert - Email Spam Report Tool`;
      const html = `
        // ...existing HTML template...
      `;

      // Send to admin email (from SMTP_USER)
      return this.sendEmail({
        to: process.env.SMTP_USER, // Changed from config.smtp.user
        subject,
        html
      });

    } catch (error) {
      logger.error(`Failed to send error notification: ${error.message}`);
    }
  }

  /**
   * Send bulk emails
   * @param {Array} recipients - Array of recipient objects [{to, subject, html}]
   * @returns {Promise<Array>} Array of results
   */
  async sendBulkEmails(recipients) {
    const results = [];

    for (const recipient of recipients) {
      try {
        const result = await this.sendEmail(recipient);
        results.push({ ...result, to: recipient.to });
      } catch (error) {
        results.push({
          success: false,
          to: recipient.to,
          error: error.message
        });
      }
    }

    return results;
  }

  /**
   * Generate email template with dynamic content
   * @param {string} template - Template name
   * @param {object} data - Template data
   * @returns {string} HTML content
   */
  generateTemplate(template, data) {
    const templates = {
      'test-initiated': (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #667eea;">Email Test Initiated</h2>
          <p>Your test has been started with code: <strong>${data.testCode}</strong></p>
          <p>We are now checking the test inboxes for your email. This typically takes less than 5 minutes.</p>
          <p>You will receive another email once the report is ready.</p>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
          <p style="color: #6b7280; font-size: 14px;">
            Test started at: ${new Date(data.startedAt).toLocaleString()}
          </p>
        </div>
      `,
      
      'detection-complete': (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #10b981;">Detection Complete ✓</h2>
          <p>Your email deliverability test is complete!</p>
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin: 0 0 10px; color: #111827;">Results Summary</h3>
            <p style="margin: 5px 0;"><strong>Test Code:</strong> ${data.testCode}</p>
            <p style="margin: 5px 0;"><strong>Deliverability Score:</strong> ${data.score}%</p>
            <p style="margin: 5px 0;"><strong>Inboxes Tested:</strong> ${data.totalInboxes}</p>
            <p style="margin: 5px 0;"><strong>Landed in Inbox:</strong> ${data.inboxCount}</p>
          </div>
          <p style="text-align: center;">
           <a href="${process.env.BASE_URL}/reports/${data.reportUrl}" 
              View Full Report
            </a>
          </p>
        </div>
      `,

      'reminder': (data) => `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #f59e0b;">Reminder</h2>
          <p>${data.message}</p>
          <p style="color: #6b7280; font-size: 14px;">
            This is an automated reminder from Email Spam Report Tool.
          </p>
        </div>
      `
    };

    const templateFn = templates[template];
    return templateFn ? templateFn(data) : '';
  }
}

module.exports = new EmailSender();