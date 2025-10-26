const Test = require('../models/test.model');
const { generateTestCode } = require('../utils/helper');
const { providers } = require('../config/email-provider');
const logger = require('../utils/logger');
require('dotenv').config();

class TestCodeService {
  async createTest(userEmail, metadata = {}) {
    try {

      let testCode;
      let isUnique = false;
      
      while (!isUnique) {
        testCode = generateTestCode();
        const existing = await Test.findOne({ testCode });
        if (!existing) isUnique = true;
      }

      const results = providers.map(provider => ({
        inboxId: provider.id,
        inboxName: provider.name,
        email: provider.email,
        type: provider.type,
        status: 'pending',
        folder: null
      }));

      const test = await Test.create({
        testCode,
        userEmail,
        status: 'initiated',
        results,
        reportUrl:`${process.env.BASE_URL}/api/reports/${testCode}`,
        metadata
      });

      logger.info(`Test created: ${testCode} for user: ${userEmail}`);

      return {
        testCode: test.testCode,
        testId: test._id,
        testInboxes: providers.map(p => ({
          id: p.id,
          name: p.name,
          email: p.email,
          type: p.type
        })),
        userEmail: test.userEmail,
        createdAt: test.createdAt
      };

    } catch (error) {
      logger.error(`Error creating test: ${error.message}`);
      throw new Error('Failed to create test');
    }
  }


  async getTest(testCode) {
    try {
      const test = await Test.findOne({ testCode });
      
      if (!test) {
        throw new Error('Test not found');
      }

      if (test.isExpired()) {
        throw new Error('Test has expired');
      }

      return test;

    } catch (error) {
      logger.error(`Error fetching test ${testCode}: ${error.message}`);
      throw error;
    }
  }

  async updateTestStatus(testCode, status) {
    try {
      const test = await Test.findOneAndUpdate(
        { testCode },
        { 
          status,
          ...(status === 'completed' && { completedAt: new Date() })
        },
        { new: true }
      );

      if (!test) {
        throw new Error('Test not found');
      }

      logger.info(`Test ${testCode} status updated to: ${status}`);
      return test;

    } catch (error) {
      logger.error(`Error updating test status: ${error.message}`);
      throw error;
    }
  }


  async getUserHistory(userEmail, limit = 10) {
    try {
      const tests = await Test.getUserHistory(userEmail, limit);
      
      return tests.map(test => ({
        testCode: test.testCode,
        status: test.status,
        deliverabilityScore: test.deliverabilityScore,
        createdAt: test.createdAt,
        completedAt: test.completedAt,
        reportUrl: test.reportUrl.replace('/api/v1/reports/', '/api/reports/')
      }));

    } catch (error) {
      logger.error(`Error fetching user history: ${error.message}`);
      throw error;
    }
  }
}

module.exports = new TestCodeService();