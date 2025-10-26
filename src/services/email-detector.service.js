const Test = require('../models/test.model');
const gmailService = require('./gmail.service');
//const outlookService = require('./outlook.service');
//const yahooService = require('./yahoo.service');
const { providers, retryConfig } = require('../config/email-provider');
const { sleep } = require('../utils/helper');
const logger = require('../utils/logger');
const notificationService = require('./notification.service');
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

class EmailDetectorService {

  // async checkGmailTestInbox(testCode, maxAttempts = 10) {
  //   const results = [];
  //   const gmailProviders = providers.filter(p => p.type === 'gmail');
    
  //   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  //     logger.debug(`Checking Gmail Test Inboxes (attempt ${attempt}/${maxAttempts})`);
  //     const emails = await gmailService.searchTestEmail(testCode);
      
  //     if (emails.length > 0) {
  //       results.push(...emails);
  //       if (results.length === gmailProviders.length) {
  //         break; // Found in all inboxes
  //       }
  //     }
  //     await delay(5000);
  //   }
    
  //   return results;
  // }


  async checkGmailTestInbox(testCode, maxAttempts = 10) {
  const results = [];
  const gmailProviders = providers.filter(p => p.type === 'gmail');

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    logger.debug(`Checking Gmail Test Inboxes (attempt ${attempt}/${maxAttempts})`);

    // loop through all Gmail providers
    for (const provider of gmailProviders) {

      const emails = await gmailService.searchTestEmail(testCode, provider);

      if (emails.length > 0) {
        results.push(...emails.map(email => ({
          ...email,
          providerId: provider.id,
          email: provider.email,
          status: 'received'
        })));
      } else {

        if (attempt === maxAttempts) {
          results.push({
            providerId: provider.id,
            email: provider.email,
            status: 'notreceived'
          });
        }
      }
    }

    // stop early if received from all configured Gmail inboxes
    const receivedCount = results.filter(r => r.status === 'received').length;
    if (receivedCount === gmailProviders.length) {
      break;
    }

    await delay(5000);
  }

  return results;
}


  // async checkOutlookTestInbox(testCode, maxAttempts = 10) {
  //   for (let attempt = 1; attempt <= maxAttempts; attempt++) {
  //     logger.debug(`Checking Outlook Test Inbox (attempt ${attempt}/${maxAttempts})`);
  //     try {
  //       const emails = await outlookService.searchInbox(testCode);
  //       if (emails.length > 0) {
  //         return emails[0];
  //       }
  //     } catch (error) {
  //       logger.error(`Error detecting in Outlook Inbox: ${error.message}`);
  //     }
  //     await delay(5000);
  //   }
  //   logger.warn('Email not found in Outlook Test Inbox after maximum attempts');
  //   return null;
  // }

    async sendReportEmail(recipientEmail, report) {
        try {
            const subject = `Spam Test Report - ${report.testCode}`;
            const content = `
                <h2>Email Spam Test Results</h2>
                <p>Test Code: ${report.testCode}</p>
                <p>Gmail Result: ${report.gmailResult ? 'Found' : 'Not Found'}</p>
            `;

            await sendEmail(recipientEmail, subject, content);
            logger.info(`Report email sent successfully for test: ${report.testCode}`);
        } catch (error) {
            logger.error(`Error sending report email: ${error.message}`);
            throw error;
        }
    }
  async startDetection(testCode, recipientEmail) {
    try {
      logger.info(`Starting email detection for test: ${testCode}`);
      const gmailResults = await this.checkGmailTestInbox(testCode);
      const test = await Test.findOne({ testCode });
      
      if (!test) {
        throw new Error('Test not found');
      }

      const results = gmailResults.map(result => ({
        inboxId: result.providerId,
        inboxName: `Gmail Test Inbox ${result.providerId.split('-')[1]}`,
        email: result.email,
        type: 'gmail',
        status: 'received',
        folder: gmailService.determineFolder(result.labelIds),
        receivedAt: new Date(),
        messageId: result.id,
        error: null
      }));

      test.results = results;
      test.status = 'completed';
      test.completedAt = new Date();
      await test.save();

      return {
        testCode,
        status: 'completed',
        results: results,
        timestamp: new Date()
      };
    } catch (error) {
      logger.error(`Error in detection process for ${testCode}: ${error.message}`);
      throw error;
    }
  }

  async detectInAllInboxes(testCode, userEmail) {
    const detectionPromises = providers.map(provider =>
      this.detectInInbox(provider, testCode, userEmail)
    );

    return await Promise.all(detectionPromises);
  }

  async detectInInbox(provider, testCode, userEmail) {
    const result = {
      inboxId: provider.id,
      inboxName: provider.name,
      email: provider.email,
      type: provider.type,
      status: 'not_received',
      folder: 'not_found'
    };

    let retries = 0;
    const maxRetries = retryConfig.maxRetries;

    while (retries < maxRetries) {
      try {
        logger.debug(`Checking ${provider.name} (attempt ${retries + 1}/${maxRetries})`);

        let emailData = null;

        // Call appropriate service based on provider type
        switch (provider.type) {
          case 'gmail':
            emailData = await gmailService.searchEmail(testCode, userEmail);
            break;
          case 'outlook':
            emailData = await outlookService.searchEmail(testCode, provider.email);
            break;
          case 'yahoo':
            emailData = await yahooService.searchEmail(testCode, userEmail);
            break;
          default:
            throw new Error(`Unknown provider type: ${provider.type}`);
        }

        // If email found, update result and break
        if (emailData) {
          result.status = 'received';
          result.folder = emailData.folder;
          result.receivedAt = emailData.receivedAt;
          result.messageId = emailData.messageId;
          
          logger.info(`Email found in ${provider.name} - Folder: ${emailData.folder}`);
          break;
        }

        // Wait before next retry
        if (retries < maxRetries - 1) {
          await sleep(retryConfig.retryDelay);
        }

        retries++;

      } catch (error) {
        logger.error(`Error detecting in ${provider.name}: ${error.message}`);
        result.status = 'error';
        result.error = error.message;
        break;
      }
    }

    if (result.status === 'not_received') {
      logger.warn(`Email not found in ${provider.name} after ${maxRetries} attempts`);
    }

    return result;
  }


  async getDetectionStatus(testCode) {
    try {
      const test = await Test.findOne({ testCode });
      
      if (!test) {
        throw new Error('Test not found');
      }

      const completed = test.results.filter(r => 
        r.status === 'received' || r.status === 'not_received' || r.status === 'error'
      ).length;

      const total = test.results.length;

      return {
        testCode,
        status: test.status,
        progress: {
          completed,
          total,
          percentage: Math.round((completed / total) * 100)
        },
        results: test.results,
        deliverabilityScore: test.deliverabilityScore
      };

    } catch (error) {
      logger.error(`Error getting detection status: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new EmailDetectorService();