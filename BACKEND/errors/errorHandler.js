const logger = require('../utils/logger');
const { AppError } = require('./AppError');

function errorHandler(err, req, res, next) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      details: err.details || undefined,
    });
  }

  logger.error('Unhandled Error:', err);

  if (process.env.NODE_ENV === 'development') {
    return res.status(500).json({
      success: false,
      code: 'INTERNAL_ERROR',
      message: err.message,
      stack: err.stack,
    });
  }

  return res.status(500).json({
    success: false,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
}

function asyncHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = {
  errorHandler,
  asyncHandler,
};
