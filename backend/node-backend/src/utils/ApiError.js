/**
 * A thrown error that carries an HTTP status code, so controllers can
 * `throw new ApiError(404, 'Alert not found')` and the central error
 * handler middleware turns it into the right JSON response.
 */
class ApiError extends Error {
  constructor(statusCode, message, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = ApiError;
