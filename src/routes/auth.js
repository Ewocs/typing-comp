const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Organizer = require('../models/Organizer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

/* ===========================
   VALIDATION MIDDLEWARE
=========================== */

const validateRegistration = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters')
    .matches(/^[a-zA-Z\s]+$/)
    .withMessage('Name can only contain letters and spaces'),

  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .isLength({ min: 12, max: 100 })
    .withMessage('Password must be between 12 and 100 characters')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/)
    .withMessage(
      'Password must contain lowercase, uppercase, number & special character'
    ),
];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),

  body('password')
    .notEmpty()
    .withMessage('Password is required'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array(),
    });
  }
  next();
};

/* ===========================
   JWT TOKEN GENERATOR (RBAC READY)
=========================== */

const generateToken = (organizer) => {
  return jwt.sign(
    {
      id: organizer._id,
      role: 'organizer', // 👈 RBAC FOUNDATION
      email: organizer.email,
    },
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

/* ===========================
   REGISTER ORGANIZER
=========================== */

router.post(
  '/register',
  validateRegistration,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { name, email, password } = req.body;

      const existingOrganizer = await Organizer.findOne({
        email: email.toLowerCase(),
      });

      if (existingOrganizer) {
        return res.status(400).json({
          error: 'Email already registered',
        });
      }

      const organizer = new Organizer({
        name: name.trim(),
        email: email.toLowerCase(),
        password,
        role: 'organizer', // 👈 RBAC ROLE STORED
      });

      await organizer.save();

      const token = generateToken(organizer);

      logger.info(`✓ New organizer registered: ${email}`);

      res.status(201).json({
        success: true,
        token,
        organizer: {
          id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          role: 'organizer',
        },
      });
    } catch (error) {
      logger.error('Registration error:', error);
      res.status(500).json({
        error: 'Registration failed',
      });
    }
  }
);

/* ===========================
   LOGIN ORGANIZER
=========================== */

router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      const organizer = await Organizer.findOne({
        email: email.toLowerCase(),
      }).select('+password');

      if (!organizer) {
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      const isPasswordValid = await organizer.comparePassword(password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Invalid email or password',
        });
      }

      organizer.lastLogin = new Date();
      await organizer.save();

      const token = generateToken(organizer);

      logger.info(`✓ Organizer logged in: ${email}`);

      res.json({
        success: true,
        token,
        organizer: {
          id: organizer._id,
          name: organizer.name,
          email: organizer.email,
          role: 'organizer',
        },
      });
    } catch (error) {
      logger.error('Login error:', error);
      res.status(500).json({
        error: 'Login failed',
      });
    }
  }
);

/* ===========================
   GET CURRENT ORGANIZER (PROTECTED)
=========================== */

router.get('/me', auth, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.user.id);

    if (!organizer) {
      return res.status(404).json({
        error: 'Organizer not found',
      });
    }

    res.json({
      success: true,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        role: 'organizer',
        createdAt: organizer.createdAt,
        lastLogin: organizer.lastLogin,
      },
    });
  } catch (error) {
    logger.error('Profile fetch error:', error);
    res.status(500).json({
      error: 'Failed to fetch organizer info',
    });
  }
});

module.exports = router;
