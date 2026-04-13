const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Book = require('../models/Book');

const router = express.Router();

router.get('/', async (_req, res, next) => {
  try {
    const list = await Book.find().sort({ title: 1 });
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
    const doc = await Book.findById(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, data: doc });
  } catch (e) {
    next(e);
  }
});

router.post(
  '/',
  [
    body('title').trim().notEmpty(),
    body('author').trim().notEmpty(),
    body('category').trim().notEmpty(),
    body('price').isFloat({ min: 0 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ success: false, errors: errors.array() });
      }
      const doc = await Book.create(req.body);
      res.status(201).json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

router.put(
  '/:id',
  [param('id').isMongoId()],
  [
    body('title').optional().trim().notEmpty(),
    body('author').optional().trim().notEmpty(),
    body('category').optional().trim().notEmpty(),
    body('price').optional().isFloat({ min: 0 }),
    body('stock_quantity').optional().isInt({ min: 0 }),
  ],
  async (req, res, next) => {
    try {
      const v = validationResult(req);
      if (!v.isEmpty()) {
        return res.status(400).json({ success: false, errors: v.array() });
      }
      const doc = await Book.findByIdAndUpdate(req.params.id, req.body, {
        new: true,
        runValidators: true,
      });
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Book not found' });
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
    const doc = await Book.findByIdAndDelete(req.params.id);
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Book not found' });
    }
    res.json({ success: true, message: 'Deleted' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
