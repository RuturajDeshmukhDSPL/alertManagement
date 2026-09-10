const ApiError = require('../utils/ApiError');

/** Turns "no route matched" into a proper 404 ApiError instead of Express's default HTML page. */
function notFoundHandler(req, res, next) {
  next(new ApiError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/**
 * Centralized error handler. Recognizes ApiError (explicit status code),
 * Sequelize validation/constraint errors (mapped to 400), and falls back
 * to 500 for anything unexpected.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
    statusCode = 400;
    details = err.errors?.map((e) => ({ field: e.path, message: e.message }));
  } else if (err.name === 'SequelizeForeignKeyConstraintError') {
    statusCode = 400;
    message = 'Referenced record does not exist (invalid facilityId/ownerId).';
  }

  if (process.env.NODE_ENV !== 'test') {
    // eslint-disable-next-line no-console
    console.error(`[${statusCode}]`, message, err.stack ? `\n${err.stack}` : '');
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details ? { details } : {}),
  });
}

module.exports = { notFoundHandler, errorHandler };
