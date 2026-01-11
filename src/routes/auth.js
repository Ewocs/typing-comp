const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Organizer = require('../models/Organizer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');

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
    // Log validation errors for monitoring and security
    const errorDetails = errors.array().map(err => ({
      field: err.path,
      message: err.msg,
      value: err.path === 'password' ? '[REDACTED]' : err.value // Don't log actual password values
    }));

    logger.warn('Authentication validation failed', {
      endpoint: req.path,
      method: req.method,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      email: req.body.email ? req.body.email.toLowerCase() : 'not provided',
      errors: errorDetails,
      errorCount: errors.array().length
    });

    return next(new AppError('Validation failed', 400, errors.array()));
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
  catchAsync(async (req, res, next) => {
    const { name, email, password } = req.body;

    const existingOrganizer = await Organizer.findOne({
      email: email.toLowerCase(),
    });

    if (existingOrganizer) {
      logger.warn('Registration attempt with existing email', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        email: email.toLowerCase(),
        existingOrganizerId: existingOrganizer._id,
        attemptType: 'duplicate_email'
      });
      return next(new AppError('Email already registered', 400));
    }

    const organizer = new Organizer({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
      role: 'organizer',
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
  })
);

/* ===========================
   LOGIN ORGANIZER
=========================== */

router.post(
  '/login',
  validateLogin,
  handleValidationErrors,
  catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    const organizer = await Organizer.findOne({
      email: email.toLowerCase(),
    }).select('+password');

    if (!organizer) {
      logger.warn('Login attempt with non-existent email', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        email: email.toLowerCase(),
        attemptType: 'non_existent_email'
      });
      return next(new AppError('Invalid email or password', 401));
    }

    const isPasswordValid = await organizer.comparePassword(password);
    if (!isPasswordValid) {
      logger.warn('Login attempt with invalid password', {
        endpoint: req.path,
        method: req.method,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        email: email.toLowerCase(),
        organizerId: organizer._id,
        attemptType: 'invalid_password'
      });
      return next(new AppError('Invalid email or password', 401));
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
  })
);

/* ===========================
   GET CURRENT ORGANIZER (PROTECTED)
=========================== */

router.get('/me', auth, catchAsync(async (req, res, next) => {
  const organizer = await Organizer.findById(req.user.id);

  if (!organizer) {
    return next(new AppError('Organizer not found', 404));
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
}));

module.exports = router;
