const app = require('./app');
const http = require('http');
const socketIo = require('socket.io');
const logger = require('./config/logger');

const server = http.createServer(app);

const io = socketIo(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

require('./socket/events')(io);

const PORT = process.env.PORT || 3000;

server.listen(PORT, '0.0.0.0', () => {
  logger.info(`🚀 Server running on http://localhost:${PORT}`);
});

module.exports = { server, io };
