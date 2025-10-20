const { google } = require('googleapis');
require('dotenv').config();
const logger = require('../utils/logger');
const config = require('../config/email-provider');


class GmailService {
  constructor() {
    this.gmailClients = new Map();
    
    config.providers
      .filter(provider => provider.type === 'gmail')
      .forEach(provider => {
        const clientId = provider.id === 'gmail-1' ? 
          process.env.GMAIL_CLIENT_ID : 
          process.env.GMAIL_CLIENT_ID_2;
        
        const clientSecret = provider.id === 'gmail-1' ? 
          process.env.GMAIL_CLIENT_SECRET : 
          process.env.GMAIL_CLIENT_SECRET_2;
        
        const redirectUri = provider.id === 'gmail-1' ? 
          process.env.GMAIL_REDIRECT_URI : 
          process.env.GMAIL_REDIRECT_URI_2;
        
        const refreshToken = provider.id === 'gmail-1' ? 
          process.env.GMAIL_REFRESH_TOKEN : 
          process.env.GMAIL_REFRESH_TOKEN_2;

        const oauth2Client = new google.auth.OAuth2(
          clientId,
          clientSecret,
          redirectUri
        );

        oauth2Client.setCredentials({
          refresh_token: refreshToken,
        });

        oauth2Client.on('tokens', (tokens) => {
          if (tokens.refresh_token) {
            logger.info(`Received new refresh token for ${provider.email}`);
          }
          logger.info(`Access token refreshed for ${provider.email}`);
        });

        this.gmailClients.set(provider.id, {
          auth: oauth2Client,
          gmail: google.gmail({ version: 'v1', auth: oauth2Client }),
          email: provider.email
        });
      });
  }

  // async searchTestEmail(testCode) {
  //   const results = [];

  //   for (const [providerId, client] of this.gmailClients) {
  //     try {
  //       const response = await client.gmail.users.messages.list({
  //         userId: 'me',
  //         q: `subject:Email-${testCode}`,
  //         maxResults: 1,
  //       });

  //       const messages = response.data.messages || [];
        
  //       if (messages.length > 0) {
  //         const messageId = messages[0].id;
  //         const message = await client.gmail.users.messages.get({
  //           userId: 'me',
  //           id: messageId,
  //         });

  //         results.push({
  //           ...message.data,
  //           providerId,
  //           email: client.email
  //         });
  //       } else {
  //         logger.debug(`No matching Gmail messages found in ${client.email}`);
  //       }
  //     } catch (error) {
  //       logger.error(`Gmail search error for ${client.email}: ${error.message}`);
  //     }
  //   }

  //   return results;
  // }

  async searchTestEmail(testCode, provider = null) {
  const results = [];

  if (provider) {
    // search only this provider
    const client = this.gmailClients.get(provider.id);
    if (!client) throw new Error(`Gmail provider not found: ${provider.id}`);

    try {
      const response = await client.gmail.users.messages.list({
        userId: 'me',
        q: `subject:Email-${testCode}`,
        maxResults: 1,
      });

      const messages = response.data.messages || [];
      if (messages.length > 0) {
        const messageId = messages[0].id;
        const message = await client.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
        });

        results.push({
          ...message.data,
          providerId: provider.id,
          email: provider.email,
          folder: 'inbox',
        });
      } else {
        logger.debug(`No matching Gmail messages found in ${provider.email}`, { service: 'email-spam-report' });
      }
    } catch (error) {
      logger.error(`Gmail search error for ${provider.email}: ${error.message}`);
    }

    return results;
  }

  // Fallback: loop through all gmail clients (old behavior)
  for (const [providerId, client] of this.gmailClients) {
    try {
      const response = await client.gmail.users.messages.list({
        userId: 'me',
        q: `subject:Email-${testCode}`,
        maxResults: 1,
      });

      const messages = response.data.messages || [];

      if (messages.length > 0) {
        const messageId = messages[0].id;
        const message = await client.gmail.users.messages.get({
          userId: 'me',
          id: messageId,
        });

        results.push({
          ...message.data,
          providerId,
          email: client.email,
          folder: 'inbox',
        });
      } else {
        logger.debug(`No matching Gmail messages found in ${client.email}`, { service: 'email-spam-report' });
      }
    } catch (error) {
      logger.error(`Gmail search error for ${client.email}: ${error.message}`);
    }
  }

  return results;
}


  determineFolder(labelIds = []) {
    if (!labelIds || labelIds.length === 0) return 'inbox';

    if (labelIds.includes('SPAM')) return 'spam';
    if (labelIds.includes('CATEGORY_PROMOTIONS')) return 'promotions';
    if (labelIds.includes('INBOX')) return 'inbox';
    if (labelIds.includes('TRASH')) return 'trash';

    return 'inbox'; // Default to inbox
  }


  getHeader(headers, name) {
    const header = headers.find(h => h.name.toLowerCase() === name.toLowerCase());
    return header ? header.value : '';
  }


  async listLabels(providerId) {
    const client = this.gmailClients.get(providerId);
    if (!client) {
      throw new Error(`Gmail provider ${providerId} not found`);
    }

    try {
      const response = await client.gmail.users.labels.list({
        userId: 'me'
      });
      return response.data.labels;
    } catch (error) {
      logger.error(`Error listing Gmail labels for ${client.email}: ${error.message}`);
      throw error;
    }
  }


  async markAsRead(providerId, messageId) {
    const client = this.gmailClients.get(providerId);
    if (!client) {
      throw new Error(`Gmail provider ${providerId} not found`);
    }

    try {
      await client.gmail.users.messages.modify({
        userId: 'me',
        id: messageId,
        requestBody: {
          removeLabelIds: ['UNREAD']
        }
      });
    } catch (error) {
      logger.error(`Error marking Gmail message as read in ${client.email}: ${error.message}`);
    }
  }
 

  async checkInbox(providerId, query, attempt = 1, MAX_ATTEMPTS = 10, CHECK_INTERVAL = 5000) {
    const client = this.gmailClients.get(providerId);
    if (!client) {
      throw new Error(`Gmail provider ${providerId} not found`);
    }

    if (attempt > MAX_ATTEMPTS) {
      logger.warn(`Email not found after ${MAX_ATTEMPTS} attempts in ${client.email}`);
      return null;
    }

    try {
      const response = await client.gmail.users.messages.list({
        userId: 'me',
        q: query,
        maxResults: 1
      });

      if (response.data.messages && response.data.messages.length > 0) {
        return response.data.messages[0];
      }

      await new Promise(resolve => setTimeout(resolve, CHECK_INTERVAL));
      return await this.checkInbox(providerId, query, attempt + 1, MAX_ATTEMPTS, CHECK_INTERVAL);
    } catch (error) {
      logger.error(`Gmail search error for ${client.email}: ${error.message}`);
      throw error;
    }
  }


}

module.exports = new GmailService();