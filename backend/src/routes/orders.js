const express = require('express');
const mongoose = require('mongoose');
const { body, param, validationResult } = require('express-validator');
const Order = require('../models/Order');
const Book = require('../models/Book');
const { requireAuth } = require('../middleware/auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res, next) => {
  try {
    const filter = { user_id: req.userId };
    if (['moderator', 'admin'].includes(req.userRole)) {
      delete filter.user_id;
    }
    const list = await Order.find(filter)
      .populate('items.book_id')
      .populate('user_id', 'username email')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: list });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', requireAuth, [param('id').isMongoId()], async (req, res, next) => {
  try {
    if (!validationResult(req).isEmpty()) {
      return res.status(400).json({ success: false, message: 'Invalid id' });
    }
    const doc = await Order.findById(req.params.id)
      .populate('items.book_id')
      .populate('user_id', 'username email');
    if (!doc) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }
    const ownerId = doc.user_id._id ? doc.user_id._id.toString() : doc.user_id.toString();
    const isOwner = ownerId === req.userId;
    const isStaff = ['moderator', 'admin'].includes(req.userRole);
    if (!isOwner && !isStaff) {
      return res.status(403).json({ success: false, message: 'Forbidden' });
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
    body('items').isArray({ min: 1 }),
    body('items.*.book_id').isMongoId(),
    body('items.*.quantity').isInt({ min: 1 }),
    body('status').optional().isIn(['pending', 'completed', 'cancelled']),
  ],
  async (req, res, next) => {
    try {
      const v = validationResult(req);
      if (!v.isEmpty()) {
        return res.status(400).json({ success: false, errors: v.array() });
      }

      const session = await mongoose.startSession();
      session.startTransaction();
      try {
        const lineItems = [];
        let total = 0;

        for (const line of req.body.items) {
          const book = await Book.findById(line.book_id).session(session);
          if (!book) {
            const err = new Error(`Book not found: ${line.book_id}`);
            err.statusCode = 400;
            throw err;
          }
          if (book.stock_quantity < line.quantity) {
            const err = new Error(`Insufficient stock for "${book.title}"`);
            err.statusCode = 400;
            throw err;
          }
          const price_at_purchase = book.price;
          total += price_at_purchase * line.quantity;
          book.stock_quantity -= line.quantity;
          await book.save({ session });
          lineItems.push({
            book_id: book._id,
            quantity: line.quantity,
            price_at_purchase,
          });
        }

        const [order] = await Order.create(
          [
            {
              user_id: req.userId,
              total_amount: total,
              status: req.body.status || 'completed',
              items: lineItems,
            },
          ],
          { session }
        );

        await session.commitTransaction();
        await order.populate('items.book_id');
        await order.populate('user_id', 'username email');
        res.status(201).json({ success: true, data: order });
      } catch (e) {
        await session.abortTransaction();
        throw e;
      } finally {
        session.endSession();
      }
    } catch (e) {
      next(e);
    }
  }
);

router.patch(
  '/:id/status',
  requireAuth,
  [param('id').isMongoId(), body('status').isIn(['pending', 'completed', 'cancelled'])],
  async (req, res, next) => {
    try {
      if (!['moderator', 'admin'].includes(req.userRole)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
      }
      const v = validationResult(req);
      if (!v.isEmpty()) {
        return res.status(400).json({ success: false, errors: v.array() });
      }
      const doc = await Order.findByIdAndUpdate(
        req.params.id,
        { status: req.body.status },
        { new: true, runValidators: true }
      )
        .populate('items.book_id')
        .populate('user_id', 'username email');
      if (!doc) {
        return res.status(404).json({ success: false, message: 'Order not found' });
      }
      res.json({ success: true, data: doc });
    } catch (e) {
      next(e);
    }
  }
);

module.exports = router;
