const config = require('./env');

module.exports = {
  providers: [
    {
      id: 'gmail-1',
      name: 'Gmail Test Inbox 1',
      email: 'agmetestg1@gmail.com',
      type: 'gmail',
      icon: '📧'
    },
    {
      id: 'gmail-2',
      name: 'Gmail Test Inbox 2',
      email: 'agmetestg02@gmail.com',
      type: 'gmail',
      icon: '📧'
    },

  ],


  // Folder detection mappings
  folderMappings: {
    gmail: {
      inbox: 'INBOX',
      spam: 'SPAM',
      promotions: 'CATEGORY_PROMOTIONS',
      important: 'IMPORTANT'
    },
  },

  // Detection timeouts (in seconds)
  detectionTimeout: 300, // 5 minutes

  // Retry configuration
  retryConfig: {
    maxRetries: 10,
    retryDelay: 15000 // 15 seconds between retries
  }
};