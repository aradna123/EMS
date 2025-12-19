const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Validation errors
  if (err.name === 'ValidationError' || err.name === 'MulterError') {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors || err.message,
    });
  }

  // Database errors
  if (err.code === '23505') {
    return res.status(409).json({
      message: 'Duplicate entry',
      error: 'This record already exists',
    });
  }

  if (err.code === '23503') {
    return res.status(400).json({
      message: 'Foreign key constraint violation',
      error: 'Referenced record does not exist',
    });
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({ message: 'Invalid token' });
  }

  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({ message: 'Token expired' });
  }

  // Default error
  res.status(err.status || 500).json({
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
};

module.exports = errorHandler;

