const express = require('express');
const jwt = require('jsonwebtoken');
const Organizer = require('../models/Organizer');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

const router = express.Router();

// Generate JWT token
const generateToken = (id) => {
  return jwt.sign(
    { id }, 
    process.env.JWT_SECRET || 'fallback_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

// REGISTER - Create new organizer account
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ 
        error: 'Name, email, and password are required' 
      });
    }

    if (password.length < 6) {
      return res.status(400).json({ 
        error: 'Password must be at least 6 characters' 
      });
    }

    // Check if organizer exists
    const existingOrganizer = await Organizer.findOne({ email: email.toLowerCase() });
    if (existingOrganizer) {
      return res.status(400).json({ 
        error: 'Email already registered' 
      });
    }

    // Create organizer
    const organizer = new Organizer({
      name,
      email: email.toLowerCase(),
      password
    });

    await organizer.save();

    // Generate token
    const token = generateToken(organizer._id);

    logger.info(`✓ New organizer registered: ${email}`);

    res.status(201).json({
      success: true,
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email
      }
    });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ 
      error: 'Registration failed. Please try again.' 
    });
  }
});

// LOGIN - Authenticate organizer
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ 
        error: 'Email and password are required' 
      });
    }

    // Find organizer (include password for comparison)
    const organizer = await Organizer.findOne({ 
      email: email.toLowerCase() 
    }).select('+password');

    if (!organizer) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Check password
    const isPasswordValid = await organizer.comparePassword(password);
    
    if (!isPasswordValid) {
      return res.status(401).json({ 
        error: 'Invalid email or password' 
      });
    }

    // Update last login
    organizer.lastLogin = new Date();
    await organizer.save();

    // Generate token
    const token = generateToken(organizer._id);

    logger.info(`✓ Organizer logged in: ${email}`);

    res.json({
      success: true,
      token,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email
      }
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ 
      error: 'Login failed. Please try again.' 
    });
  }
});

// GET CURRENT ORGANIZER - Get authenticated organizer info
router.get('/me', auth, async (req, res) => {
  try {
    const organizer = await Organizer.findById(req.organizer.id);
    
    if (!organizer) {
      return res.status(404).json({ error: 'Organizer not found' });
    }

    res.json({
      success: true,
      organizer: {
        id: organizer._id,
        name: organizer.name,
        email: organizer.email,
        createdAt: organizer.createdAt,
        lastLogin: organizer.lastLogin
      }
    });
  } catch (error) {
    logger.error('Get organizer error:', error);
    res.status(500).json({ error: 'Failed to get organizer info' });
  }
});

module.exports = router;
