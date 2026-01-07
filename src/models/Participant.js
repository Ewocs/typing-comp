const mongoose = require('mongoose');

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
  totalWpm: { type: Number, default: 0 },
  totalAccuracy: { type: Number, default: 0 },
  roundsCompleted: { type: Number, default: 0 },
  finalRank: { type: Number },
  roundScores: [
    {
      roundNumber: { type: Number },
      wpm: { type: Number },
      accuracy: { type: Number },
      rank: { type: Number },
      errors: { type: Number, default: 0 },
      backspaces: { type: Number, default: 0 },
    },
  ],
});

// Index to quickly find a participant by name in a specific competition (prevent duplicates)
ParticipantSchema.index({ competitionId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Participant', ParticipantSchema);
