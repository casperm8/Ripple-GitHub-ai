const express = require('express');
const User = require('../models/User');
const ReferralCode = require('../models/ReferralCode');
const authMiddleware = require('../middleware/auth');

const { escapeRegex } = require('../utils/regex');

const router = express.Router();

// Get User Profile
router.get('/:username', async (req, res) => {
  try {
    const user = await User.findOne({ username: req.params.username })
      .select('-password')
      .populate('referralCodes');

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({
      id: user._id,
      username: user.username,
      email: user.email,
      profile: user.profile,
      codesCount: user.referralCodes.length,
      followersCount: user.followers.length,
      followingCount: user.following.length,
      createdAt: user.createdAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User's Codes
router.get('/:username/codes', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const codes = await ReferralCode.find({ owner: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReferralCode.countDocuments({ owner: user._id });

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

// Follow User
router.post('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(req.userId);

    // Check if already following
    if (currentUser.following.includes(targetUser._id)) {
      return res.status(400).json({ error: 'Already following this user' });
    }

    // Add to following list
    currentUser.following.push(targetUser._id);
    await currentUser.save();

    // Add to followers list
    targetUser.followers.push(req.userId);
    await targetUser.save();

    res.json({ message: 'Now following user' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Unfollow User
router.delete('/:username/follow', authMiddleware, async (req, res) => {
  try {
    const targetUser = await User.findOne({ username: req.params.username });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    const currentUser = await User.findById(req.userId);

    // Remove from following list
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== targetUser._id.toString()
    );
    await currentUser.save();

    // Remove from followers list
    targetUser.followers = targetUser.followers.filter(
      id => id.toString() !== req.userId
    );
    await targetUser.save();

    res.json({ message: 'Unfollowed user' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get User's Feed (following's codes)
router.get('/:username/feed', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const user = await User.findOne({ username: req.params.username });
    if (!user) return res.status(404).json({ error: 'User not found' });

    const codes = await ReferralCode.find({
      owner: { $in: user.following },
      isActive: true
    })
      .populate('owner', 'username profile')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await ReferralCode.countDocuments({
      owner: { $in: user.following },
      isActive: true
    });

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

// Update User Profile
router.put('/profile', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const { firstName, lastName, bio, avatar } = req.body;
    user.profile = {
      ...user.profile,
      ...(firstName && { firstName }),
      ...(lastName && { lastName }),
      ...(bio && { bio }),
      ...(avatar && { avatar })
    };

    await user.save();

    res.json({
      id: user._id,
      username: user.username,
      profile: user.profile
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search Users
router.get('/search/:query', async (req, res) => {
  try {
    const escaped = escapeRegex(req.params.query);
    const users = await User.find({
      $or: [
        { username: { $regex: escaped, $options: 'i' } },
        { 'profile.firstName': { $regex: escaped, $options: 'i' } },
        { 'profile.lastName': { $regex: escaped, $options: 'i' } }
      ]
    })
      .select('username profile codesCount followersCount')
      .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
