const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

function signToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

router.post(
  '/register',
  [
    body('username').trim().isLength({ min: 2 }).escape(),
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 6 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { username, email, password } = req.body;
      const password_hash = await bcrypt.hash(password, 10);
      const user = await User.create({ username, email, password_hash });
      const token = signToken(user);
      res.status(201).json({ success: true, token, user: user.toJSON() });
    } catch (e) {
      if (e.code === 11000) {
        e.statusCode = 409;
        e.message = 'Username or email already exists';
      }
      next(e);
    }
  }
);

router.post(
  '/login',
  [body('email').isEmail().normalizeEmail(), body('password').notEmpty()],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const { email, password } = req.body;
      const user = await User.findOne({ email });
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        return res.status(401).json({ success: false, message: 'Invalid email or password' });
      }
      const token = signToken(user);
      res.json({ success: true, token, user: user.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('saved_resources');
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({ success: true, user: user.toJSON() });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
