const express = require('express');
const Joi = require('joi');
const ReferralCode = require('../models/ReferralCode');
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

const { escapeRegex } = require('../utils/regex');

const router = express.Router();

// Validation schema
const codeSchema = Joi.object({
  code: Joi.string().required(),
  platform: Joi.string().valid('uber', 'airbnb', 'doordash', 'lyft', 'shopify', 'amazon', 'other').required(),
  description: Joi.string(),
  discount: Joi.string(),
  expiryDate: Joi.date(),
  usageLimit: Joi.number(),
  tags: Joi.array().items(Joi.string()),
  category: Joi.string()
});

// Create Referral Code
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { error, value } = codeSchema.validate(req.body);
    if (error) return res.status(400).json({ error: error.details[0].message });

    // Check if code already exists
    const existingCode = await ReferralCode.findOne({ code: value.code });
    if (existingCode) {
      return res.status(409).json({ error: 'Code already exists' });
    }

    const newCode = new ReferralCode({
      ...value,
      owner: req.userId
    });

    await newCode.save();

    // Add code to user's referralCodes
    await User.findByIdAndUpdate(req.userId, {
      $push: { referralCodes: newCode._id }
    });

    res.status(201).json(newCode);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get All Codes (with pagination & filtering)
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const filter = { isActive: true };
    if (req.query.platform) filter.platform = req.query.platform;
    if (req.query.search) {
      const escaped = escapeRegex(req.query.search);
      filter.$or = [
        { description: { $regex: escaped, $options: 'i' } },
        { code: { $regex: escaped, $options: 'i' } },
        { tags: { $in: [new RegExp(escaped, 'i')] } }
      ];
    }

    const codes = await ReferralCode.find(filter)
      .populate('owner', 'username profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReferralCode.countDocuments(filter);

    res.json({
      codes,
      total,
      page,
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Featured Codes
router.get('/featured', async (req, res) => {
  try {
    const codes = await ReferralCode.find({ isActive: true })
      .populate('owner', 'username profile')
      .sort({ views: -1, shares: -1 })
      .limit(6);

    res.json(codes);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get Single Code
router.get('/:id', async (req, res) => {
  try {
    const code = await ReferralCode.findByIdAndUpdate(
      req.params.id,
      { $inc: { views: 1 } },
      { new: true }
    ).populate('owner', 'username profile');

    if (!code) return res.status(404).json({ error: 'Code not found' });

    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update Code
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    const code = await ReferralCode.findById(req.params.id);

    if (!code) return res.status(404).json({ error: 'Code not found' });
    if (code.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { error, value } = codeSchema.validate(req.body, { allowUnknown: true });
    if (error) return res.status(400).json({ error: error.details[0].message });

    Object.assign(code, value);
    code.updatedAt = Date.now();
    await code.save();

    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete Code
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const code = await ReferralCode.findById(req.params.id);

    if (!code) return res.status(404).json({ error: 'Code not found' });
    if (code.owner.toString() !== req.userId) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    await ReferralCode.findByIdAndDelete(req.params.id);
    await User.findByIdAndUpdate(req.userId, {
      $pull: { referralCodes: req.params.id }
    });

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track Share
router.post('/:id/share', async (req, res) => {
  try {
    const code = await ReferralCode.findByIdAndUpdate(
      req.params.id,
      { $inc: { shares: 1 } },
      { new: true }
    );

    if (!code) return res.status(404).json({ error: 'Code not found' });

    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Track Usage
router.post('/:id/use', async (req, res) => {
  try {
    const code = await ReferralCode.findByIdAndUpdate(
      req.params.id,
      { $inc: { usageCount: 1 } },
      { new: true }
    );

    if (!code) return res.status(404).json({ error: 'Code not found' });

    // Check if limit reached
    if (code.usageLimit && code.usageCount >= code.usageLimit) {
      await ReferralCode.findByIdAndUpdate(req.params.id, { isActive: false });
    }

    res.json(code);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
