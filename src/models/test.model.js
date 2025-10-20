const mongoose = require('mongoose');

const inboxResultSchema = new mongoose.Schema({
  inboxId: {
    type: String,
    required: true
  },
  inboxName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['gmail', 'outlook', 'yahoo'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'received', 'not_received', 'error'],
    default: 'pending'
  },
  folder: {
    type: String,
    enum: ['inbox', 'spam', 'promotions', 'not_found', 'error'],
    default: null
  },
  receivedAt: {
    type: Date,
    default: null
  },
  messageId: {
    type: String,
    default: null
  },
  error: {
    type: String,
    default: null
  }
}, { _id: false });

const testSchema = new mongoose.Schema({
  testCode: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  status: {
    type: String,
    enum: ['initiated', 'detecting', 'completed', 'failed', 'expired'],
    default: 'initiated'
  },
  results: [inboxResultSchema],
  deliverabilityScore: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  reportUrl: {
    type: String,
    default: null
  },
  reportSentAt: {
    type: Date,
    default: null
  },
  startedAt: {
    type: Date,
    default: Date.now
  },
  completedAt: {
    type: Date,
    default: null
  },
  expiresAt: {
    type: Date,
    default: function() {
      const config = require('../config/env');
      return new Date(Date.now() + config.reportExpiryDays * 24 * 60 * 60 * 1000);
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    duration: Number // in milliseconds
  }
}, {
  timestamps: true
});

// Index for efficient queries
testSchema.index({ userEmail: 1, createdAt: -1 });
testSchema.index({ status: 1, createdAt: -1 });
testSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Calculate deliverability score before saving
testSchema.pre('save', function(next) {
  if (this.status === 'completed') {
    const totalInboxes = this.results.length;
    const successfulDeliveries = this.results.filter(r => 
      r.status === 'received' && r.folder === 'inbox'
    ).length;
    
    this.deliverabilityScore = totalInboxes > 0 
      ? Math.round((successfulDeliveries / totalInboxes) * 100)
      : 0;
  }
  next();
});

// Static method to get user's test history
testSchema.statics.getUserHistory = function(userEmail, limit = 10) {
  return this.find({ userEmail })
    .sort({ createdAt: -1 })
    .limit(limit)
    .select('-__v');
};

// Instance method to check if test has expired
testSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

module.exports = mongoose.model('Test', testSchema);