const Joi = require('joi');
const { isValidEmail } = require('../utils/helper');

/**
 * Validate request using Joi schema
 * @param {object} schema - Joi schema
 * @returns {Function} Middleware function
 */
const validate = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation error',
        errors
      });
    }

    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  createTest: Joi.object({
    userEmail: Joi.string()
      .email()
      .required()
      .messages({
        'string.email': 'Please provide a valid email address',
        'any.required': 'Email address is required'
      }),
    metadata: Joi.object({
      userAgent: Joi.string().optional(),
      ipAddress: Joi.string().optional()
    }).optional()
  }),

  startDetection: Joi.object({
    testCode: Joi.string()
      .pattern(/^TEST-[A-Z0-9]+$/)
      .required()
      .messages({
        'string.pattern.base': 'Invalid test code format',
        'any.required': 'Test code is required'
      })
  }),

  getReport: Joi.object({
    format: Joi.string()
      .valid('json', 'pdf')
      .default('json')
      .optional()
  })
};

/**
 * Custom email validation middleware
 */
const validateEmail = (req, res, next) => {
  const { userEmail } = req.body;

  if (!userEmail || !isValidEmail(userEmail)) {
    return res.status(400).json({
      status: 'error',
      message: 'Please provide a valid email address'
    });
  }

  next();
};

/**
 * Validate test code format
 */
const validateTestCode = (req, res, next) => {
  const testCode = req.params.testCode || req.body.testCode;

  if (!testCode || !/^TEST-[A-Z0-9]+$/.test(testCode)) {
    return res.status(400).json({
      status: 'error',
      message: 'Invalid test code format'
    });
  }

  next();
};

module.exports = {
  validate,
  schemas,
  validateEmail,
  validateTestCode
};