require('dotenv').config();

if (!process.env.JWT_SECRET) {
  if (process.env.NODE_ENV === 'production') {
    console.error('FATAL: set JWT_SECRET in production');
    process.exit(1);
  }
  process.env.JWT_SECRET = 'dev-insecure-jwt-secret-change-me';
  console.warn('Using default JWT_SECRET (development only). Set JWT_SECRET in .env for real use.');
}

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { connectDB } = require('./db');
const { errorHandler, notFoundHandler } = require('./middleware/errorHandler');

const authRoutes = require('./routes/auth');
const courseResourceRoutes = require('./routes/courseResources');
const forumPostRoutes = require('./routes/forumPosts');
const bookRoutes = require('./routes/books');
const orderRoutes = require('./routes/orders');

const app = express();
const port = Number(process.env.PORT) || 5000;

const allowedOrigin = process.env.FRONTEND_ORIGIN || true;
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(morgan('dev'));

app.get('/api/health', (_req, res) => {
  res.json({
    success: true,
    ok: true,
    service: 'education-web-api',
    time: new Date().toISOString(),
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/course-resources', courseResourceRoutes);
app.use('/api/forum-posts', forumPostRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/orders', orderRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

async function start() {
  await connectDB();
  console.log('Connected to MongoDB');
  app.listen(port, () => {
    console.log(`API listening on http://localhost:${port}`);
    console.log(`Health: http://localhost:${port}/api/health`);
  });
}

start().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
