const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const Organizer = require('../models/Organizer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');


const sendMail = require('../utils/sendMail');




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
    // 📧 Send welcome email (non-blocking)
    sendMail({
  to: organizer.email,
  subject: "🎉 Welcome to Typing Platform — Your Organizer Account is Ready",
  html: `
  <div style="
    font-family: 'Segoe UI', Roboto, Arial, sans-serif;
    background-color: #f4f6f8;
    padding: 30px;
  ">
    <div style="
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      box-shadow: 0 10px 30px rgba(0,0,0,0.08);
      overflow: hidden;
    ">
      
      <!-- Header -->
      <div style="
        background: linear-gradient(135deg, #4f46e5, #3b82f6);
        color: #ffffff;
        padding: 28px;
        text-align: center;
      ">
        <h1 style="margin: 0; font-size: 26px;">Typing Platform</h1>
        <p style="margin: 8px 0 0; font-size: 15px; opacity: 0.9;">
          Organizer Dashboard Access
        </p>
      </div>

      <!-- Body -->
      <div style="padding: 32px;">
        <h2 style="margin-top: 0; color: #111827;">
          Welcome, ${organizer.name} 👋
        </h2>

        <p style="font-size: 15px; color: #374151; line-height: 1.6;">
          Your <strong>Organizer account</strong> has been successfully created.
          You can now create, manage, and monitor typing competitions with ease.
        </p>

        <div style="
          background-color: #f9fafb;
          border-left: 4px solid #4f46e5;
          padding: 16px;
          margin: 24px 0;
          border-radius: 6px;
        ">
          <p style="margin: 0; font-size: 14px; color: #111827;">
            🚀 <strong>What's next?</strong><br/>
            • Create competitions<br/>
            • Manage participants<br/>
            • Track results in real time
          </p>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="http://localhost:3000/organizer"
             style="
               display: inline-block;
               padding: 14px 26px;
               background-color: #4f46e5;
               color: #ffffff;
               text-decoration: none;
               border-radius: 8px;
               font-weight: 600;
               font-size: 15px;
             ">
            Go to Organizer Dashboard
          </a>
        </div>

        <p style="font-size: 14px; color: #4b5563;">
          If you have any questions or need help, feel free to reach out to our
          support team anytime.
        </p>

        <p style="font-size: 14px; color: #4b5563; margin-bottom: 0;">
          Happy Typing! 🚀<br/>
          <strong>Typing Platform Team</strong>
        </p>
      </div>

      <!-- Footer -->
      <div style="
        background-color: #f3f4f6;
        text-align: center;
        padding: 16px;
        font-size: 12px;
        color: #6b7280;
      ">
        © ${new Date().getFullYear()} Typing Platform. All rights reserved.
      </div>

    </div>
  </div>
  `,
}).catch(err => {
  logger.error("Email sending failed", {
    email: organizer.email,
    error: err.message,
  });
});



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
