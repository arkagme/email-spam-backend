const app = require('./src/app');
const config = require('./src/config/env');
const connectDB = require('./src/config/database');
const logger = require('./src/utils/logger');
require('dotenv').config();

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION! Shutting down...');
  logger.error(err.name, err.message);
  process.exit(1);
});

// Connect to MongoDB
connectDB();

// Start server
const server = app.listen(config.port, '0.0.0.0' ,() => {
  logger.info(`Server running in ${config.env} mode on port ${config.port}`);
  logger.info(`Base URL: ${config.baseUrl}`);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err) => {
  logger.error('UNHANDLED REJECTION! Shutting down...');
  logger.error(err.name, err.message);
  server.close(() => {
    process.exit(1);
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM RECEIVED. Shutting down gracefully');
  server.close(() => {
    logger.info('Process terminated!');
  });
});