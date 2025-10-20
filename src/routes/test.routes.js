const express = require('express');
const router = express.Router();
const testController = require('../controllers/test.controller');
const { validate, schemas, validateTestCode } = require('../middleware/validation.middleware');
const { apiLimiter, testCreationLimiter } = require('../middleware/rate-limit.middleware');


router.post(
  '/',
  testCreationLimiter,
  validate(schemas.createTest),
  testController.createTest
);

router.post(
  '/:testCode/detect',
  apiLimiter,
  validateTestCode,
  testController.startDetection
);

router.get(
  '/:testCode/status',
  apiLimiter,
  validateTestCode,
  testController.getDetectionStatus
);

router.get(
  '/:testCode',
  apiLimiter,
  validateTestCode,
  testController.getTest
);

router.get(
  '/history/:userEmail',
  apiLimiter,
  testController.getUserHistory
);

router.get(
  '/statistics/:userEmail',
  apiLimiter,
  testController.getStatistics
);

module.exports = router;