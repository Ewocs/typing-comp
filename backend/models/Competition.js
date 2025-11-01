const mongoose = require('mongoose');

const CompetitionSchema = new mongoose.Schema({
  // Competition Meta
  name: { type: String, required: true, trim: true },
  code: { type: String, required: true, unique: true, uppercase: true },
  organizer: { type: String, default: 'Admin' },
  status: { type: String, enum: ['pending', 'ongoing', 'completed'], default: 'pending' },
  
  // Rounds with detailed tracking
  rounds: [{
    // Round Info
    roundNumber: { type: Number, required: true },
    text: { type: String, required: true },
    duration: { type: Number, required: true }, // seconds
    
    // Round Status
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    startedAt: { type: Date, default: null },
    endedAt: { type: Date, default: null },
    totalDuration: { type: Number, default: 0 }, // actual duration in ms
    
    // Round Statistics
    participantsCompleted: { type: Number, default: 0 },
    highestWpm: { type: Number, default: 0 },
    lowestWpm: { type: Number, default: 0 },
    averageWpm: { type: Number, default: 0 },
    averageAccuracy: { type: Number, default: 0 },
    
    // Detailed Results
    results: [{
      participantName: { type: String, required: true },
      participantId: { type: String },
      
      // Scores
      wpm: { type: Number, default: 0 },
      accuracy: { type: Number, default: 0 }, // 0-100
      correctChars: { type: Number, default: 0 },
      totalChars: { type: Number, default: 0 },
      incorrectChars: { type: Number, default: 0 },
      
      // Ranking
      rank: { type: Number },
      
      // Time tracking
      typingTime: { type: Number, default: 0 }, // seconds
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now }
    }],
    
    // Metadata
    createdAt: { type: Date, default: Date.now }
  }],
  
  // Participants
  participants: [{
    name: { type: String, required: true },
    socketId: { type: String },
    joinedAt: { type: Date, default: Date.now },
    
    // Per-participant stats
    totalWpm: { type: Number, default: 0 },
    totalAccuracy: { type: Number, default: 0 },
    roundsCompleted: { type: Number, default: 0 },
    finalRank: { type: Number },
    
    // Individual round data
    roundScores: [{
      roundNumber: { type: Number },
      wpm: { type: Number },
      accuracy: { type: Number },
      rank: { type: Number }
    }]
  }],
  
  // Competition Status
  currentRound: { type: Number, default: -1 },
  totalRounds: { type: Number, default: 0 },
  roundsCompleted: { type: Number, default: 0 },
  
  // Final Statistics
  finalRankings: [{
    rank: { type: Number },
    participantName: { type: String },
    averageWpm: { type: Number },
    averageAccuracy: { type: Number },
    totalRoundsCompleted: { type: Number },
    highestWpm: { type: Number },
    lowestWpm: { type: Number }
  }],
  
  // Timestamps
  createdAt: { type: Date, default: Date.now },
  startedAt: { type: Date },
  completedAt: { type: Date },
  
  // Metadata
  description: { type: String, default: '' },
  location: { type: String, default: '' },
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' }
});

// Indexes for performance
CompetitionSchema.index({ code: 1 });
CompetitionSchema.index({ createdAt: -1 });
CompetitionSchema.index({ status: 1 });

module.exports = mongoose.model('Competition', CompetitionSchema);
