const logger = require('../config/logger');
const { handleJoin, handleOrganizerJoin } = require('./handlers/join');
const { handleProgress } = require('./handlers/typing');
const { handleStartRound } = require('./handlers/round');

const activeCompetitions = new Map();

function initializeSocketEvents(io) {
  io.on('connection', (socket) => {
    logger.info(`🔌 Socket Connected: ${socket.id}`);

    // JOIN COMPETITION
    socket.on('join', (data) => {
      logger.debug('Join event received', {
        socketId: socket.id,
        code: data.code,
      });
      handleJoin(socket, io, data, activeCompetitions);
    });

    // ORGANIZER JOINS
    socket.on('organizerJoin', (data) => {
      logger.debug('Organizer join event received', { socketId: socket.id });
      handleOrganizerJoin(socket, io, data);
    });

    // START ROUND
    socket.on('startRound', (data) => {
      logger.info('Start round event received', {
        competitionId: data.competitionId,
        roundIndex: data.roundIndex,
      });
      handleStartRound(socket, io, data, activeCompetitions);
    });

    // TYPING PROGRESS
    socket.on('progress', (data) => {
      logger.debug('Progress event', {
        socketId: socket.id,
        wpm: data.wpm || 'calculating',
      });
      handleProgress(socket, io, data, activeCompetitions);
    });

    // DISCONNECT
    socket.on('disconnect', async () => {
      logger.info(`🔌 Socket Disconnected: ${socket.id}`);
      if (socket.competitionId) {
        const compData = activeCompetitions.get(socket.competitionId);
        if (compData && !socket.isOrganizer) {
          const participant = compData.participants.get(socket.id);
          if (participant) {
            compData.participants.delete(socket.id);
            logger.debug(`Participant removed: ${participant.name}`, {
              remainingParticipants: compData.participants.size,
            });
            io.to(`competition_${socket.competitionId}`).emit(
              'participantLeft',
              {
                totalParticipants: compData.participants.size,
              }
            );
          }
        }
      }
    });
  });

  logger.info('Socket.IO events initialized');
}

module.exports = initializeSocketEvents;
module.exports.activeCompetitions = activeCompetitions;
