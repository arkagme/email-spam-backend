const rateLimit = require('express-rate-limit');
const config = require('../config/env');
const logger = require('../utils/logger');

const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs, 
  max: config.rateLimit.maxRequests, 
  message: {
    status: 'error',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(429).json({
      status: 'error',
      message: 'Too many requests from this IP, please try again later.',
      retryAfter: Math.ceil(config.rateLimit.windowMs / 1000 / 60) + ' minutes'
    });
  }
});

const testCreationLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, 
  max: config.maxTestsPerUserPerDay, 
  message: {
    status: 'error',
    message: 'Daily test limit reached. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {

    return req.body.userEmail || req.ip;
  },
  handler: (req, res) => {
    logger.warn(`Test creation limit exceeded for: ${req.body.userEmail || req.ip}`);
    res.status(429).json({
      status: 'error',
      message: `You have reached the daily limit of ${config.maxTestsPerUserPerDay} tests. Please try again tomorrow.`,
      retryAfter: '24 hours'
    });
  }
});


const reportAccessLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 50, 
  message: {
    status: 'error',
    message: 'Too many report access attempts. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  testCreationLimiter,
  reportAccessLimiter
};