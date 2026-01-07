const jwt = require('jsonwebtoken');
const Organizer = require('../models/Organizer');
const logger = require('../config/logger');

const auth = async (req, res, next) => {
  try {
    // Get token from header
    const authHeader = req.header('Authorization');

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'No authentication token provided',
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify token
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'fallback_secret_key_change_in_production'
    );

    // Find organizer
    const organizer = await Organizer.findById(decoded.id);

    if (!organizer) {
      return res.status(401).json({
        error: 'Organizer not found',
      });
    }

    // Attach organizer to request
    req.organizer = {
      id: organizer._id,
      name: organizer.name,
      email: organizer.email,
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      logger.warn('Invalid token attempt');
      return res.status(401).json({ error: 'Invalid token' });
    }

    if (error.name === 'TokenExpiredError') {
      logger.warn('Expired token attempt');
      return res.status(401).json({ error: 'Token expired' });
    }

    logger.error('Auth middleware error:', error);
    res.status(401).json({ error: 'Authentication failed' });
  }
};

module.exports = auth;
