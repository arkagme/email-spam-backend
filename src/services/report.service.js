const Test = require('../models/test.model');
const Report = require('../models/report.model');
const config = require('../config/env');
const { generateReportUrl, getTimeDifference } = require('../utils/helper');
const logger = require('../utils/logger');
require('dotenv').config();

class ReportService {

  async generateReport(testCode) {
    try {
      const test = await Test.findOne({ testCode });
      
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.status !== 'completed') {
        throw new Error('Test is not completed yet');
      }
      let report = await Report.findOne({ testCode });

      if (!report) {
        const reportUrl = generateReportUrl(testCode, config.baseUrl);
        
        report = await Report.create({
          testId: test._id,
          testCode: test.testCode,
          reportUrl : `${process.env.BASE_URL}/api/reports/${testCode}`,
          expiresAt: test.expiresAt,
        });

        test.reportUrl = reportUrl;
        await test.save();
      }

      const reportData = this.buildReportData(test);

      logger.info(`Report generated for test: ${testCode}`);

      return {
        ...reportData,
        reportUrl: report.reportUrl,
        views: report.views
      };

    } catch (error) {
      logger.error(`Error generating report: ${error.message}`);
      throw error;
    }
  }

  buildReportData(test) {

    const totalInboxes = test.results.length;
    const receivedCount = test.results.filter(r => r.status === 'received').length;
    const inboxCount = test.results.filter(r => r.folder === 'inbox').length;
    const spamCount = test.results.filter(r => r.folder === 'spam').length;
    const promotionsCount = test.results.filter(r => r.folder === 'promotions').length;
    const notReceivedCount = test.results.filter(r => r.status === 'not_received').length;
    const errorCount = test.results.filter(r => r.status === 'error').length;


    const inboxPercentage = Math.round((inboxCount / totalInboxes) * 100);
    const spamPercentage = Math.round((spamCount / totalInboxes) * 100);
    const promotionsPercentage = Math.round((promotionsCount / totalInboxes) * 100);


    let overallStatus = 'excellent';
    if (test.deliverabilityScore < 40) overallStatus = 'poor';
    else if (test.deliverabilityScore < 70) overallStatus = 'fair';
    else if (test.deliverabilityScore < 90) overallStatus = 'good';

    const gmailResults = test.results.filter(r => r.type === 'gmail');
    const gmailResult = gmailResults.some(r => r.status === 'received');

    return {
      testCode: test.testCode,
      userEmail: test.userEmail,
      status: test.status,
      deliverabilityScore: test.deliverabilityScore,
      overallStatus,
      createdAt: test.createdAt,
      completedAt: test.completedAt,
      duration: test.metadata.duration ? getTimeDifference(test.startedAt, test.completedAt) : null,
      gmailResult,
      summary: {
        totalInboxes,
        receivedCount,
        inboxCount,
        spamCount,
        promotionsCount,
        notReceivedCount,
        errorCount,
        inboxPercentage,
        spamPercentage,
        promotionsPercentage
      },
      results: test.results.map(r => ({
        inboxId: r.inboxId,
        inboxName: r.inboxName,
        email: r.email,
        type: r.type,
        status: r.status,
        folder: r.folder,
        receivedAt: r.receivedAt,
        error: r.error
      })),
      recommendations: this.generateRecommendations(test)
    };
  }

  generateRecommendations(test) {
    const recommendations = [];
    const spamCount = test.results.filter(r => r.folder === 'spam').length;
    const promotionsCount = test.results.filter(r => r.folder === 'promotions').length;
    const notReceivedCount = test.results.filter(r => r.status === 'not_received').length;

    if (spamCount > 0) {
      recommendations.push({
        type: 'warning',
        title: 'Spam Folder Detection',
        message: `${spamCount} email(s) landed in spam. Consider improving your sender reputation and email authentication (SPF, DKIM, DMARC).`
      });
    }

    if (promotionsCount > 0) {
      recommendations.push({
        type: 'info',
        title: 'Promotions Tab',
        message: `${promotionsCount} email(s) landed in promotions. This is common for marketing emails. Consider personalizing your content.`
      });
    }

    if (notReceivedCount > 0) {
      recommendations.push({
        type: 'error',
        title: 'Delivery Issues',
        message: `${notReceivedCount} email(s) were not received. Check your sending IP reputation and ensure proper email authentication.`
      });
    }

    if (test.deliverabilityScore === 100) {
      recommendations.push({
        type: 'success',
        title: 'Perfect Deliverability',
        message: 'Excellent! Your email reached all test inboxes successfully.'
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'success',
        title: 'Good Deliverability',
        message: 'Your email deliverability is performing well. Keep monitoring regularly.'
      });
    }

    return recommendations;
  }

  async getReport(testCode) {
    try {
      const test = await Test.findOne({ testCode });
      
      if (!test) {
        throw new Error('Report not found');
      }

      if (test.isExpired()) {
        throw new Error('Report has expired');
      }

      // Increment view count
      const report = await Report.findOne({ testCode });
      if (report) {
        await report.incrementViews();
      }

      return this.buildReportData(test);

    } catch (error) {
      logger.error(`Error getting report: ${error.message}`);
      throw error;
    }
  }

  async getStatistics(userEmail) {
    try {
      const tests = await Test.find({ 
        userEmail,
        status: 'completed'
      }).sort({ createdAt: -1 }).limit(10);

      if (tests.length === 0) {
        return {
          totalTests: 0,
          averageScore: 0,
          trend: 'neutral'
        };
      }

      const totalTests = tests.length;
      const averageScore = Math.round(
        tests.reduce((sum, t) => sum + t.deliverabilityScore, 0) / totalTests
      );

      // Calculate trend (comparing last 3 vs previous 3)
      let trend = 'neutral';
      if (tests.length >= 6) {
        const recentAvg = tests.slice(0, 3).reduce((sum, t) => sum + t.deliverabilityScore, 0) / 3;
        const previousAvg = tests.slice(3, 6).reduce((sum, t) => sum + t.deliverabilityScore, 0) / 3;
        
        if (recentAvg > previousAvg + 5) trend = 'improving';
        else if (recentAvg < previousAvg - 5) trend = 'declining';
      }

      return {
        totalTests,
        averageScore,
        trend,
        recentTests: tests.slice(0, 5).map(t => ({
          testCode: t.testCode,
          deliverabilityScore: t.deliverabilityScore,
          createdAt: t.createdAt
        }))
      };

    } catch (error) {
      logger.error(`Error getting statistics: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new ReportService();