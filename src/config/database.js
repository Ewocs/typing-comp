const mongoose = require('mongoose');
const logger = require('./logger');

mongoose
  .connect(
    process.env.MONGODB_URI || 'mongodb://localhost:27017/typing-platform'
  )
  .then(() => logger.info('✓ MongoDB connected'))
  .catch((err) => logger.error('❌ MongoDB error:', err));

module.exports = mongoose;
