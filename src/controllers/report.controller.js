const reportService = require('../services/report.service');
const pdfGenerator = require('../utils/pdf-generator');
const path = require('path');
const fs = require('fs').promises;
const logger = require('../utils/logger');


exports.getReport = async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const format = req.query.format || 'json';

    const report = await reportService.getReport(testCode);

    if (format === 'pdf') {

      const pdfPath = path.join(__dirname, '../../reports', `${testCode}.pdf`);
      

      await fs.mkdir(path.dirname(pdfPath), { recursive: true });


      await pdfGenerator.generateReport(report, pdfPath);


      res.download(pdfPath, `report-${testCode}.pdf`, async (err) => {
        if (err) {
          logger.error(`Error sending PDF: ${err.message}`);
          next(err);
        }
        
        try {
          await fs.unlink(pdfPath);
        } catch (cleanupErr) {
          logger.warn(`Could not delete PDF file: ${cleanupErr.message}`);
        }
      });

    } else {

      res.status(200).json({
        status: 'success',
        data: report
      });
    }

  } catch (error) {
    next(error);
  }
};


exports.sendReport = async (req, res, next) => {
  try {
    const { testCode } = req.params;
    const { email } = req.body;

    const report = await reportService.getReport(testCode);
    
    const notificationService = require('../services/notification.service');
    await notificationService.sendReportEmail(email || report.userEmail, report);

    logger.info(`Report sent via email for test: ${testCode}`);

    res.status(200).json({
      status: 'success',
      message: 'Report sent successfully via email'
    });

  } catch (error) {
    next(error);
  }
};


exports.getReportSummary = async (req, res, next) => {
  try {
    const { testCode } = req.params;

    const report = await reportService.getReport(testCode);

    // Return only summary data
    res.status(200).json({
      status: 'success',
      data: {
        testCode: report.testCode,
        deliverabilityScore: report.deliverabilityScore,
        overallStatus: report.overallStatus,
        summary: report.summary,
        completedAt: report.completedAt
      }
    });

  } catch (error) {
    next(error);
  }
};