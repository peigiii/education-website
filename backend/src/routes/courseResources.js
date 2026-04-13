const express = require('express');
const { body, param, validationResult } = require('express-validator');
const CourseResource = require('../models/CourseResource');
const User = require('../models/User');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

const resourceTypeValues = ['lecture_note', 'video_tutorial', 'interactive_quiz'];

router.get('/', async (_req, res, next) => {
  try {
    const list = await CourseResource.find().sort({ updatedAt: -1 });
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
    const doc = await CourseResource.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  [
    body('subject').trim().notEmpty(),
    body('module_title').trim().notEmpty(),
    body('resource_type').isIn(resourceTypeValues),
    body('title').trim().notEmpty(),
    body('content_url').optional({ nullable: true }).isString(),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const doc = await CourseResource.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  [
    param('id').isMongoId(),
    body('subject').optional().trim().notEmpty(),
    body('module_title').optional().trim().notEmpty(),
    body('resource_type').optional().isIn(resourceTypeValues),
    body('title').optional().trim().notEmpty(),
    body('content_url').optional({ nullable: true }).isString(),
  ],
  async (req, res, next) => {
    try {
      const vr = validationResult(req);
      if (!vr.isEmpty()) {
        return res.status(400).json({ success: false, errors: vr.array() });
      }
      const doc = await CourseResource.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }
      res.json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.delete('/:id', [param('id').isMongoId()], async (req, res, next) => {
  try {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const doc = await CourseResource.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Resource not found' });
    }
    await User.updateMany({}, { $pull: { saved_resources: doc._id } });
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/:id/save',
  requireAuth,
  [param('id').isMongoId()],
  async (req, res, next) => {
    try {
      if (!validationResult(req).isEmpty()) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      const resource = await CourseResource.findById(req.params.id);
      if (!resource) {
        return res.status(404).json({ success: false, message: 'Resource not found' });
      }
      await User.findByIdAndUpdate(req.userId, {
        $addToSet: { saved_resources: resource._id },
      });
      const user = await User.findById(req.userId).populate('saved_resources');
      res.json({ success: true, user: user.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

router.delete(
  '/:id/save',
  requireAuth,
  [param('id').isMongoId()],
  async (req, res, next) => {
    try {
      if (!validationResult(req).isEmpty()) {
        return res.status(400).json({ success: false, message: 'Invalid id' });
      }
      await User.findByIdAndUpdate(req.userId, {
        $pull: { saved_resources: req.params.id },
      });
      const user = await User.findById(req.userId).populate('saved_resources');
      res.json({ success: true, user: user.toJSON() });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
