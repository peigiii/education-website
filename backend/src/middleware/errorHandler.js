function errorHandler(err, _req, res, _next) {
  const status = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  if (status >= 500) {
    console.error(err);
  }
  res.status(status).json({
    success: false,
    message,
    ...(process.env.NODE_ENV !== 'production' && err.stack ? { detail: err.stack } : {}),
  });
}

function notFoundHandler(_req, res) {
  res.status(404).json({ success: false, message: 'Not found' });
}

module.exports = { errorHandler, notFoundHandler };
