const express = require('express');
const cors = require('cors');
const path = require('path');
const dotenv = require('dotenv');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const logger = require('./config/logger');
const requestLogger = require('./middleware/requestLogger');


dotenv.config();

require('./config/database');

const app = express();

// Security headers (including CSP) via Helmet
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          "'unsafe-inline'",
          "https://cdn.socket.io",
          "https://cdn.sheetjs.com",
          "https://cdnjs.cloudflare.com",
          "https://cdn.jsdelivr.net",
        ],
        connectSrc: [
          "'self'",
          "ws://localhost:3000",
          "http://localhost:3000",
          "https://cdn.socket.io",
        ],
        imgSrc: ["'self'", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrcAttr: ["'self'"],
      },
    },
  }),
);

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// API Documentation
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Middleware
app.use(compression());
app.use(cors());
app.use(express.json());
app.use(mongoSanitize());
app.use(requestLogger);

logger.info('✓ Express app initialized');

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
  });
});

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/export', require('./routes/export'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api', require('./routes/competition'));

// Static files
app.use(express.static(path.join(__dirname, './public')));

// Route handlers for specific pages
app.get('/participant', (req, res) => {
  res.sendFile(path.join(__dirname, './public/participant.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, './public/index.html'));
});

app.get('/organizer', (req, res) => {
  res.sendFile(path.join(__dirname, './public/organizer.html'));
});

app.get('/login', (req, res) => {
  res.sendFile(path.join(__dirname, './public/login.html'));
});

app.get('/register', (req, res) => {
  res.sendFile(path.join(__dirname, './public/register.html'));
});

app.get('/analytics', (req, res) => {
  res.sendFile(path.join(__dirname, './public/analytics.html'));
});

app.get('/exportrankings', (req, res) => {
  res.sendFile(path.join(__dirname, './public/exportrankings.html'));
});

// API 404 handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    message: `The API endpoint ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    docs: '/api-docs'
  });
});

// Catch-all route for HTML pages - 404 handler
app.get('*', (req, res) => {
  // Only handle HTML requests with custom 404 page
  const acceptHeader = req.headers.accept || '';
  
  if (acceptHeader.includes('text/html')) {
    res.status(404).sendFile(path.join(__dirname, './public/404.html'));
  } else {
    // For non-HTML requests (API, JSON, etc.)
    res.status(404).json({
      error: 'Not Found',
      message: `The requested resource ${req.originalUrl} was not found on this server`,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = app;