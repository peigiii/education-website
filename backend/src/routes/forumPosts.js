const express = require('express');
const { body, param, validationResult } = require('express-validator');
const ForumPost = require('../models/ForumPost');
const { requireAuth, requireRole } = require('../middleware/auth');

const router = express.Router();

const statusValues = ['pending', 'approved', 'rejected'];

router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status && statusValues.includes(status)) {
      filter.status = status;
    }
    const list = await ForumPost.find(filter)
      .populate('user_id', 'username email role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const doc = await ForumPost.findById(req.params.id).populate(
      'user_id',
      'username email role'
    );
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  requireAuth,
  [
    body('title').trim().notEmpty(),
    body('content').trim().notEmpty(),
    body('status').optional().isIn(statusValues),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const payload = {
        user_id: req.userId,
        title: req.body.title,
        content: req.body.content,
      };
      if (req.body.status && ['moderator', 'admin'].includes(req.userRole)) {
        payload.status = req.body.status;
      }
      const doc = await ForumPost.create(payload);
      await doc.populate('user_id', 'username email role');
      res.status(201).json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  requireAuth,
  [param('id').isMongoId()],
  [
    body('title').optional().trim().notEmpty(),
    body('content').optional().trim().notEmpty(),
    body('status').optional().isIn(statusValues),
  ],
  async (req, res, next) => {
    try {
      const v = validationResult(req);
      if (!v.isEmpty()) {
        return res.status(400).json({ success: false, errors: v.array() });
      }
      const doc = await ForumPost.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      const isOwner = doc.user_id.toString() === req.userId;
      const isStaff = ['moderator', 'admin'].includes(req.userRole);
      if (!isOwner && !isStaff) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      if (req.body.status !== undefined && !isStaff) {
        return res.status(403).json({ success: false, message: 'Only staff can change status' });
      }
      Object.assign(doc, req.body);
      await doc.save();
      await doc.populate('user_id', 'username email role');
      res.json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id',
  requireAuth,
  [param('id').isMongoId()],
  async (req, res, next) => {
    try {
      if (!validationResult(req).isEmpty()) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      const doc = await ForumPost.findById(req.params.id);
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      const isOwner = doc.user_id.toString() === req.userId;
      const isAdmin = req.userRole === 'admin';
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      await doc.deleteOne();
      res.json({ success: true, message: 'Deleted' });
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/moderate',
  requireAuth,
  requireRole('moderator', 'admin'),
  [param('id').isMongoId(), body('status').isIn(statusValues)],
  async (req, res, next) => {
    try {
      const v = validationResult(req);
      if (!v.isEmpty()) {
        return res.status(400).json({ success: false, errors: v.array() });
      }
      const doc = await ForumPost.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      ).populate('user_id', 'username email role');
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Post not found' });
      }
      res.json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
