const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  testId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Test',
    required: true,
    index: true
  },
  testCode: {
    type: String,
    required: true,
    index: true
  },
  reportUrl: {
    type: String,
    required: true,
    unique: true
  },
  pdfUrl: {
    type: String,
    default: null
  },
  views: {
    type: Number,
    default: 0
  },
  lastViewedAt: {
    type: Date,
    default: null
  },
  isPublic: {
    type: Boolean,
    default: true
  },
  expiresAt: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Index for efficient queries
reportSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Increment view count
reportSchema.methods.incrementViews = function() {
  this.views += 1;
  this.lastViewedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Report', reportSchema);