const { ClientSecretCredential } = require('@azure/identity');
const { Client } = require('@microsoft/microsoft-graph-client');
const config = require('../config/env');
const logger = require('../utils/logger');

class OutlookService {
  constructor() {
    this.tenantId = process.env.OUTLOOK_TENANT_ID;
    this.clientId = process.env.OUTLOOK_CLIENT_ID;
    this.clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
    this.redirectUri = process.env.OUTLOOK_REDIRECT_URI;
  }

  /**
   * Get access token using client credentials flow
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    try {
      const credential = new ClientSecretCredential(
        this.tenantId,
        this.clientId,
        this.clientSecret
      );
      const tokenResponse = await credential.getToken('https://graph.microsoft.com/.default');
      return tokenResponse.token;
    } catch (error) {
      throw new Error(`Failed to get Outlook access token: ${error.message}`);
    }
  }

    async getClient() {
    const accessToken = await this.getAccessToken();
    const client = Client.init({
      authProvider: (done) => {
        done(null, accessToken);
      }
    });
    return client;
  }

    async searchInbox(testCode) {
    try {
      const client = await this.getClient();
      const filter = `contains(subject,'${testCode}')`;
      const messages = await client
        .api('/me/mailFolders/inbox/messages')
        .filter(filter)
        .top(1)
        .get();
      return messages.value;
    } catch (error) {
      throw new Error(`Outlook search error: ${error.message}`);
    }
  }


  /**
   * Get Microsoft Graph client
   * @returns {Promise<Client>} Graph client
   */
  async getGraphClient() {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    return Client.init({
      authProvider: (done) => {
        done(null, this.accessToken);
      }
    });
  }

  /**
   * Search for email with specific test code
   * @param {string} testCode - Test code to search for
   * @param {string} userEmail - User email for mailbox access
   * @returns {Promise<object>} Email details if found
   */
    async searchEmail(testCode, email) {
        try {
            const accessToken = await this.getAccessToken();
            
            const client = Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                }
            });

            const response = await client
                .api('/me/messages')
                .filter(`contains(subject,'${testCode}')`)
                .top(1)
                .get();

            if (response.value && response.value.length > 0) {
                return {
                    folder: 'inbox',
                    messageId: response.value[0].id,
                    receivedAt: new Date(response.value[0].receivedDateTime)
                };
            }

            return null;
        } catch (error) {
            logger.error(`Outlook search error: ${error.message}`);
            throw error;
        }
    }

  /**
   * Get folder name from folder ID
   * @param {Client} client - Graph client
   * @param {string} userEmail - User email
   * @param {string} folderId - Folder ID
   * @returns {Promise<string>} Folder name
   */
  async getFolderName(client, userEmail, folderId) {
    try {
      const folder = await client
        .api(`/users/${userEmail}/mailFolders/${folderId}`)
        .select('displayName')
        .get();

      const folderName = folder.displayName.toLowerCase();

      // Map Outlook folder names to standard names
      if (folderName.includes('inbox')) return 'inbox';
      if (folderName.includes('junk') || folderName.includes('spam')) return 'spam';
      if (folderName.includes('clutter') || folderName.includes('promotions')) return 'promotions';
      if (folderName.includes('deleted')) return 'trash';

      return 'inbox'; // Default

    } catch (error) {
      logger.error(`Error getting Outlook folder name: ${error.message}`);
      return 'inbox';
    }
  }

  /**
   * List all folders (for debugging)
   * @param {string} userEmail - User email
   * @returns {Promise<Array>} List of folders
   */
  async listFolders(userEmail) {
    try {
      const client = await this.getGraphClient();
      const folders = await client
        .api(`/users/${userEmail}/mailFolders`)
        .get();
      
      return folders.value;
    } catch (error) {
      logger.error(`Error listing Outlook folders: ${error.message}`);
      throw error;
    }
  }

  /**
   * Mark email as read
   * @param {string} userEmail - User email
   * @param {string} messageId - Message ID
   * @returns {Promise<void>}
   */
  async markAsRead(userEmail, messageId) {
    try {
      const client = await this.getGraphClient();
      await client
        .api(`/users/${userEmail}/messages/${messageId}`)
        .update({ isRead: true });
    } catch (error) {
      logger.error(`Error marking Outlook message as read: ${error.message}`);
    }
  }

      async checkInbox(query) {
        try {
            const accessToken = await this.getAccessToken();
            
            const client = Client.init({
                authProvider: (done) => {
                    done(null, accessToken);
                }
            });

            const response = await client
                .api('/me/messages')
                .filter(`contains(subject,'${query}')`)
                .top(1)
                .get();

            if (response.value && response.value.length > 0) {
                return response.value[0];
            }

            return null;
        } catch (error) {
            logger.error(`Outlook search error: ${error.message}`);
            throw error;
        }
    }
}

module.exports = new OutlookService();