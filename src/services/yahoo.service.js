const Imap = require('imap');
const { simpleParser } = require('mailparser');
const config = require('../config/env');
const logger = require('../utils/logger');

class YahooService {
  constructor() {
    this.imapConfig = {
      user: config.yahoo.email,
      password: config.yahoo.appPassword,
      host: 'imap.mail.yahoo.com',
      port: 993,
      tls: true,
      tlsOptions: { rejectUnauthorized: false }
    };
  }

  /**
   * Connect to Yahoo IMAP server
   * @returns {Promise<Imap>} IMAP connection
   */
  async connect() {
    return new Promise((resolve, reject) => {
      const imap = new Imap(this.imapConfig);

      imap.once('ready', () => {
        resolve(imap);
      });

      imap.once('error', (err) => {
        logger.error(`Yahoo IMAP connection error: ${err.message}`);
        reject(err);
      });

      imap.connect();
    });
  }

  /**
   * Search for email with specific test code
   * @param {string} testCode - Test code to search for
   * @param {string} userEmail - Sender's email (optional for filtering)
   * @returns {Promise<object>} Email details if found
   */
  async searchEmail(testCode, userEmail = null) {
    let imap;
    
    try {
      imap = await this.connect();

      // Search in multiple folders
      const foldersToCheck = ['INBOX', 'Bulk Mail', 'Trash'];
      
      for (const folderName of foldersToCheck) {
        const result = await this.searchInFolder(imap, folderName, testCode, userEmail);
        if (result) {
          imap.end();
          return result;
        }
      }

      imap.end();
      return null;

    } catch (error) {
      if (imap) imap.end();
      logger.error(`Yahoo search error: ${error.message}`);
      throw error;
    }
  }

  /**
   * Search in specific folder
   * @param {Imap} imap - IMAP connection
   * @param {string} folderName - Folder name
   * @param {string} testCode - Test code
   * @param {string} userEmail - User email
   * @returns {Promise<object>} Email details if found
   */
  async searchInFolder(imap, folderName, testCode, userEmail) {
    return new Promise((resolve, reject) => {
      imap.openBox(folderName, true, (err, box) => {
        if (err) {
          logger.warn(`Could not open Yahoo folder ${folderName}: ${err.message}`);
          resolve(null);
          return;
        }

        // Build search criteria
        const searchCriteria = [
          ['OR', ['SUBJECT', testCode], ['BODY', testCode]]
        ];

        if (userEmail) {
          searchCriteria.push(['FROM', userEmail]);
        }

        // Search for messages
        imap.search(searchCriteria, (err, results) => {
          if (err) {
            logger.error(`Yahoo search error in ${folderName}: ${err.message}`);
            resolve(null);
            return;
          }

          if (!results || results.length === 0) {
            resolve(null);
            return;
          }

          // Fetch the most recent message
          const fetch = imap.fetch(results[results.length - 1], {
            bodies: '',
            struct: true
          });

          let emailData = null;

          fetch.on('message', (msg) => {
            msg.on('body', (stream) => {
              simpleParser(stream, (err, parsed) => {
                if (err) {
                  logger.error(`Error parsing Yahoo email: ${err.message}`);
                  return;
                }

                emailData = {
                  messageId: parsed.messageId,
                  folder: this.mapFolderName(folderName),
                  receivedAt: parsed.date || new Date(),
                  subject: parsed.subject,
                  from: parsed.from?.text,
                  snippet: parsed.text?.substring(0, 200)
                };
              });
            });
          });

          fetch.once('error', (err) => {
            logger.error(`Yahoo fetch error: ${err.message}`);
            resolve(null);
          });

          fetch.once('end', () => {
            resolve(emailData);
          });
        });
      });
    });
  }

  /**
   * Map Yahoo folder names to standard names
   * @param {string} folderName - Yahoo folder name
   * @returns {string} Standard folder name
   */
  mapFolderName(folderName) {
    const mapping = {
      'INBOX': 'inbox',
      'Bulk Mail': 'spam',
      'Trash': 'trash',
      'Sent': 'sent'
    };
    return mapping[folderName] || 'inbox';
  }

  /**
   * List all folders (for debugging)
   * @returns {Promise<Array>} List of folders
   */
  async listFolders() {
    let imap;
    
    try {
      imap = await this.connect();

      return new Promise((resolve, reject) => {
        imap.getBoxes((err, boxes) => {
          imap.end();
          
          if (err) {
            reject(err);
            return;
          }
          
          resolve(boxes);
        });
      });

    } catch (error) {
      if (imap) imap.end();
      logger.error(`Error listing Yahoo folders: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new YahooService();