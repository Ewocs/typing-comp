const mongoose = require('mongoose');

/**
 * @typedef {Object} RoundResult
 * @property {string} participantName - Name of the participant.
 * @property {string} participantId - Socket ID or User ID.
 * @property {number} wpm - Words Per Minute.
 * @property {number} accuracy - Accuracy percentage.
 * @property {number} correctChars - Count of correct keystrokes.
 * @property {number} totalChars - Total keystrokes.
 * @property {number} incorrectChars - Count of wrong keystrokes.
 * @property {number} errors - Final error count.
 * @property {number} backspaces - Backspaces usage.
 * @property {number} rank - Rank in this round.
 * @property {number} typingTime - Time taken in seconds.
 * @property {Date} createdAt - Timestamp.
 * @property {Date} updatedAt - Timestamp.
 */

/**
 * @typedef {Object} Round
 * @property {number} roundNumber - 1-based index.
 * @property {string} text - The typing challenge text.
 * @property {number} duration - Time limit in seconds.
 * @property {string} status - 'pending' | 'in-progress' | 'completed'.
 * @property {Date} startedAt - Start timestamp.
 * @property {Date} endedAt - End timestamp.
 * @property {RoundResult[]} results - Array of results for this round.
 */

/**
 * Competition Schema
 * 
 * Manages the state, configuration, and flow of a typing battle.
 * Note: Individual participant stats are OFF-LOADED to the Participant model.
 * This model contains aggregate round data and configuration.
 */
const CompetitionSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  organizer: { type: String, default: 'Admin' },
  organizerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Organizer',
    default: null,
  },
  mode: {
    type: String,
    enum: ['rounds', 'timed', 'word-count'],
    default: 'rounds',
  },
  // Mode-specific configuration
  modeConfig: {
    // For timed mode: fixed time limit for all participants
    timeLimit: { type: Number, default: null }, // in seconds
    // For word-count mode: target word count
    targetWords: { type: Number, default: null },
    // For word-count mode: text pool (array of texts to choose from)
    textPool: [{ type: String }],
  },
  status: {
    type: String,
    enum: ['pending', 'ongoing', 'completed'],
    default: 'pending',
  },

  rounds: [
    {
      roundNumber: { type: Number, required: function() { return this.mode === 'rounds'; } },
      text: { type: String, required: function() { return this.mode === 'rounds'; } },
      language: { type: String, default: 'en', enum: ['en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ar', 'hi', 'zh', 'ja', 'ko'] },
      duration: { type: Number, required: function() { return this.mode === 'rounds'; } },
      status: {
        type: String,
        enum: ['pending', 'in-progress', 'completed'],
        default: 'pending',
      },
      startedAt: { type: Date, default: null },
      endedAt: { type: Date, default: null },
      totalDuration: { type: Number, default: 0 },
      participantsCompleted: { type: Number, default: 0 },
      highestWpm: { type: Number, default: 0 },
      lowestWpm: { type: Number, default: 0 },
      averageWpm: { type: Number, default: 0 },
      averageAccuracy: { type: Number, default: 0 },
      results: [
        {
          participantName: { type: String, required: true },
          participantId: { type: String },
          wpm: { type: Number, default: 0 },
          accuracy: { type: Number, default: 0 },
          correctChars: { type: Number, default: 0 },
          totalChars: { type: Number, default: 0 },
          incorrectChars: { type: Number, default: 0 },
          errors: { type: Number, default: 0 }, // NEW
          backspaces: { type: Number, default: 0 }, // NEW
          rank: { type: Number },
          typingTime: { type: Number, default: 0 },
          createdAt: { type: Date, default: Date.now },
          updatedAt: { type: Date, default: Date.now },
        },
      ],
      createdAt: { type: Date, default: Date.now },
    },
  ],

  currentRound: { type: Number, default: -1 },
  totalRounds: { type: Number, default: 0 },
  roundsCompleted: { type: Number, default: 0 },

  // Snapshot of final results for quick display
  finalRankings: [
    {
      rank: { type: Number },
      participantName: { type: String },
      averageWpm: { type: Number },
      averageAccuracy: { type: Number },
      totalRoundsCompleted: { type: Number },
      highestWpm: { type: Number },
      lowestWpm: { type: Number },
    },
  ],

  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  difficulty: {
    type: String,
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
    // ...
  },
});

CompetitionSchema.index({ code: 1 });
CompetitionSchema.index({ createdAt: -1 });
CompetitionSchema.index({ status: 1 });

module.exports = mongoose.model('Competition', CompetitionSchema);
