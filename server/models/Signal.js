const mongoose = require('mongoose');

const signalSchema = new mongoose.Schema({
  symbol: {
    type: String,
    required: true,
    index: true
  },
  direction: {
    type: String,
    enum: ['LONG', 'SHORT'],
    required: true
  },
  entryPrice: {
    type: Number,
    required: true
  },
  takeProfit: {
    type: Number,
    required: true
  },
  stopLoss: {
    type: Number,
    required: true
  },
  reason: {
    type: String,
    required: true
  },
  confidence: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  riskReward: {
    type: String,
    default: '2.0'
  },
  status: {
    type: String,
    enum: ['active', 'win', 'lose'],
    default: 'active'
  },
  currentPrice: {
    type: Number,
    required: true
  },
  exitPrice: {
    type: Number
  },
  profitLoss: {
    type: Number,
    default: 0
  },
  analysisTime: {
    type: Date,
    default: Date.now
  },
  exitTime: {
    type: Date
  },
  lastChecked: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Index for better query performance
signalSchema.index({ status: 1, analysisTime: -1 });
signalSchema.index({ symbol: 1, analysisTime: -1 });

module.exports = mongoose.model('Signal', signalSchema);
