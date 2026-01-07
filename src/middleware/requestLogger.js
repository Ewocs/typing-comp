const logger = require('../config/logger');

/**
 * Middleware to log incoming HTTP requests
 */
const requestLogger = (req, res, next) => {
  const start = Date.now();

  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.http(`${req.method} ${req.url}`, {
      status: res.statusCode,
      duration: `${duration}ms`,
      method: req.method,
      path: req.url,
      ip: req.ip,
    });
  });

  next();
};

module.exports = requestLogger;
