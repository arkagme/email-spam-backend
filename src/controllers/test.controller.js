const testCodeService = require('../services/test-code.service');
const emailDetectorService = require('../services/email-detector.service');
const notificationService = require('../services/notification.service');
const reportService = require('../services/report.service');
const logger = require('../utils/logger');
require('dotenv').config();


exports.createTest = async (req, res, next) => {
  try {
    const { userEmail } = req.body;
    
    const metadata = {
      userAgent: req.get('user-agent'),
      ipAddress: req.ip || req.connection.remoteAddress
    };

    const test = await testCodeService.createTest(userEmail, metadata);

    logger.info(`Test created: ${test.testCode} by ${userEmail}`);

    res.status(201).json({
      status: 'success',
      message: 'Test created successfully',
      data: test
    });

  } catch (error) {
    next(error);
  }
};

exports.startDetection = async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const test = await testCodeService.getTest(testCode);
    emailDetectorService.startDetection(testCode)
      .then(async (result) => {
        const report = await reportService.generateReport(testCode);
        console.log(report);
        await notificationService.sendReportEmail(test.userEmail, report);
        logger.info(`Detection and notification completed for test: ${testCode}`);
      })
      .catch((error) => {
        logger.error(`Error in detection process for ${testCode}: ${error.message}`);
      });
      res.status(200).json({
        status: 'success',
        message: 'Email detection started. You will receive a report via email once completed.',
        data: {
          testCode,
          estimatedTime: '2-5 minutes'
        }
    });

  } catch (error) {
    next(error);
  }
};

exports.getDetectionStatus = async (req, res, next) => {
  try {
    const { testCode } = req.params;

    const status = await emailDetectorService.getDetectionStatus(testCode);

    res.status(200).json({
      status: 'success',
      data: status
    });

  } catch (error) {
    next(error);
  }
};

exports.getTest = async (req, res, next) => {
  try {
    const { testCode } = req.params;

    const test = await testCodeService.getTest(testCode);

    res.status(200).json({
      status: 'success',
      data: {
        testCode: test.testCode,
        userEmail: test.userEmail,
        status: test.status,
        deliverabilityScore: test.deliverabilityScore,
        results: test.results,
        reportUrl: `${process.env.BASE_URL}/api/reports/${testCode}`,
        createdAt: test.createdAt,
        completedAt: test.completedAt
      }
    });

  } catch (error) {
    next(error);
  }
};

exports.getUserHistory = async (req, res, next) => {
  try {
    const { userEmail } = req.params;
    const limit = parseInt(req.query.limit) || 10;

    const history = await testCodeService.getUserHistory(userEmail, limit);

    res.status(200).json({
      status: 'success',
      data: {
        userEmail,
        count: history.length,
        tests: history
      }
    });

  } catch (error) {
    next(error);
  }
};


exports.getStatistics = async (req, res, next) => {
  try {
    const { userEmail } = req.params;

    const statistics = await reportService.getStatistics(userEmail);

    res.status(200).json({
      status: 'success',
      data: statistics
    });

  } catch (error) {
    next(error);
  }
};