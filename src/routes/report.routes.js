const express = require('express');
const router = express.Router();
const reportController = require('../controllers/report.controller');
const { validateTestCode } = require('../middleware/validation.middleware');
const { reportAccessLimiter } = require('../middleware/rate-limit.middleware')


router.get(
  '/:testCode',
  reportAccessLimiter,
  validateTestCode,
  reportController.getReport
);

router.get(
  '/:testCode/summary',
  reportAccessLimiter,
  validateTestCode,
  reportController.getReportSummary
);

router.post(
  '/:testCode/send',
  reportAccessLimiter,
  validateTestCode,
  reportController.sendReport
);

module.exports = router;