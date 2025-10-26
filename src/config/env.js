require('dotenv').config();

module.exports = {
  // Server
  env: process.env.NODE_ENV || 'development',
  port: process.env.PORT || 5000,
  baseUrl: process.env.BASE_URL || 'http://localhost:5000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:8080/',

  // Database
  mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/email-spam-report',

  gmail: {
    clientId: process.env.GMAIL_CLIENT_ID,
    clientSecret: process.env.GMAIL_CLIENT_SECRET,
    redirectUri: process.env.GMAIL_REDIRECT_URI,
    refreshToken: process.env.GMAIL_REFRESH_TOKEN
  },

  outlook: {
    clientId: process.env.OUTLOOK_CLIENT_ID,
    clientSecret: process.env.OUTLOOK_CLIENT_SECRET,
    tenantId: process.env.OUTLOOK_TENANT_ID,
    redirectUri: process.env.OUTLOOK_REDIRECT_URI
  },


  yahoo: {
    email: process.env.YAHOO_EMAIL,
    appPassword: process.env.YAHOO_APP_PASSWORD
  },

  testInboxes: {
    gmail1: process.env.TEST_GMAIL_1,
    gmail2: process.env.TEST_GMAIL_2,
    outlook1: process.env.TEST_OUTLOOK_1,
    outlook2: process.env.TEST_OUTLOOK_2,
    yahoo1: process.env.TEST_YAHOO_1
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    user: process.env.SMTP_USER,
    password: process.env.SMTP_PASSWORD
  },

  reportExpiryDays: parseInt(process.env.REPORT_EXPIRY_DAYS) || 30,
  maxTestsPerUserPerDay: parseInt(process.env.MAX_TESTS_PER_USER_PER_DAY) || 10,


  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  }
};