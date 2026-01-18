const mongoose = require('mongoose');

/**
 * @typedef {Object} RoundScore
 * @property {number} roundNumber - The index of the round (1-based).
 * @property {number} wpm - Words Per Minute achieved in this round.
 * @property {number} accuracy - Accuracy percentage (0-100).
 * @property {number} rank - Rank achieved in this specific round.
 * @property {number} errors - Total uncorrected errors.
 * @property {number} backspaces - Total backspaces used.
 */

/**
 * @typedef {Object} ParticipantDocument
 * @property {mongoose.Schema.Types.ObjectId} competitionId - Reference to the parent Competition.
 * @property {string} name - Display name of the participant.
 * @property {string} socketId - Current Socket.IO ID (transient).
 * @property {Date} joinedAt - Timestamp when participant joined the lobby.
 * @property {number} totalWpm - Aggregate WPM across all completed rounds.
 * @property {number} totalAccuracy - Aggregate accuracy across all completed rounds.
 * @property {number} roundsCompleted - Count of rounds fully finished.
 * @property {number} finalRank - The final calculated rank in the competition.
 * @property {RoundScore[]} roundScores - History of performance per round.
 */

/**
 * Participant Schema
 * 
 * Represents a single user's participation in a specific Competition.
 * This collection is the authoritative source for user statistics and rankings.
 * 
 * @type {mongoose.Schema<ParticipantDocument>}
 */
const ParticipantSchema = new mongoose.Schema({
  competitionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Competition',
    required: true,
    index: true,
  },
  name: { type: String, required: true },
  socketId: { type: String },
  joinedAt: { type: Date, default: Date.now },

  // Aggregate Stats (Updated at end of competition)
  totalWpm: { type: Number, default: 0 },
  totalAccuracy: { type: Number, default: 0 },
  roundsCompleted: { type: Number, default: 0 },
  finalRank: { type: Number },

  // Per-Round History
  roundScores: [
    {
      roundNumber: { type: Number },
      wpm: { type: Number },
      accuracy: { type: Number },
      rank: { type: Number },
      errors: { type: Number, default: 0 },
      backspaces: { type: Number, default: 0 },
      keyStats: {
        type: Map, of: new mongoose.Schema({
          count: { type: Number, default: 0 },
          errors: { type: Number, default: 0 },
          totalLatency: { type: Number, default: 0 } // In milliseconds
        }, { _id: false })
      }
    },
  ],
});

// Index to quickly find a participant by name in a specific competition (prevent duplicates)
ParticipantSchema.index({ competitionId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Participant', ParticipantSchema);
