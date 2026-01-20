require('dotenv').config({ path: require('path').resolve(__dirname, '../.env.example') }); 

const app = require('./app');
const http = require('http');
const mongoose = require('mongoose');
const socketIo = require('socket.io');
const logger = require('./config/logger');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

require('./socket/events')(io);

//MongoDB Atlas connection
mongoose
  .connect(process.env.MONGODB_URI)
  .then(() => {
    logger.info('✓ MongoDB connected');
  })
  .catch((err) => {
    logger.error('❌ MongoDB error:', err);
  });

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  logger.info(`${signal} received: closing HTTP server and Database connection`);

  server.close(() => {
    logger.info('HTTP server closed');
  });

  io.close(() => {
    logger.info('Socket.IO closed');
  });

  try {
    await mongoose.connection.close(false);
    logger.info('MongoDB connection closed');
    process.exit(0);
  } catch (err) {
    logger.error('Error during graceful shutdown', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

module.exports = { server, io };
