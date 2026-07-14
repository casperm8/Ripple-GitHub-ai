const mongoose = require('mongoose');

const referralCodeSchema = new mongoose.Schema({
  code: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['uber', 'airbnb', 'doordash', 'lyft', 'shopify', 'amazon', 'other'],
    required: true
  },
  description: String,
  discount: {
    type: String,
    description: 'e.g., 20 off, 10% discount'
  },
  expiryDate: Date,
  usageLimit: Number,
  usageCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  views: {
    type: Number,
    default: 0
  },
  shares: {
    type: Number,
    default: 0
  },
  tags: [String],
  category: String,
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('ReferralCode', referralCodeSchema);
