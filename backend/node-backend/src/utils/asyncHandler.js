/**
 * Wraps an async Express handler so any rejected promise / thrown error
 * is forwarded to `next(err)` instead of crashing the process or hanging
 * the request. Keeps controllers free of repetitive try/catch blocks.
 */
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

module.exports = asyncHandler;
