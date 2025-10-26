const emailSender = require('../utils/email-sender');
const logger = require('../utils/logger');
require('dotenv').config();
const nodemailer = require('nodemailer');

class NotificationService {

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT),
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
  }


     generateReportEmailHTML(report) {
        return `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #333;">Email Spam Test Results</h2>
                <p><strong>Test Code:</strong> ${report.testCode}</p>
                <p><strong>Status:</strong> ${report.status}</p>
                
                <h3>Detection Results:</h3>
                <ul>
                    <li>Gmail: ${report.gmailResult ? 'Found ✅' : 'Not Found ❌'}</li>
                </ul>
                
                <p>
                    <a href="https://email.arkagme.me/report/${report.testCode}"
                       style="background: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        View Detailed Report
                    </a>
                </p>
            </div>
        `;
    }


  async sendReportEmail(to, report) {
    try {
      const htmlContent = this.generateReportEmailHTML(report);

      const mailOptions = {
        from: process.env.SMTP_USER,
        to,
        subject: `Spam Report for Test ${report.testCode}`,
        html: htmlContent,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Report email sent to: ${to}`);
    } catch (error) {
      logger.error(`Error sending report email: ${error.message}`);
      throw error;
    }
  }


  async sendTestInitiatedEmail(userEmail, testCode) {
    try {
      const mailOptions = {
        from: `"Email Spam Report Tool" <${config.smtp.user}>`,
        to: userEmail,
        subject: `Email Test Initiated - ${testCode}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Email Deliverability Test Initiated</h2>
            <p>Your test has been started with code: <strong>${testCode}</strong></p>
            <p>We are now checking the test inboxes for your email. This typically takes less than 5 minutes.</p>
            <p>You will receive another email once the report is ready.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info(`Test initiated email sent to ${userEmail}`);

    } catch (error) {
      logger.error(`Error sending test initiated email: ${error.message}`);
    }
  }

  async sendTestReport(recipientEmail, report) {
        try {
            const subject = `Spam Test Report - ${report.testCode}`;
            const html = this.generateReportEmailHTML(report);

            await emailSender.sendEmail({
                to: recipientEmail,
                subject,
                html
            });

            logger.info(`Report sent successfully for test: ${report.testCode}`);
        } catch (error) {
            logger.error(`Error sending report email: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new NotificationService();