/**
 * @fileoverview Verification Script for Issue #190 (Participant Data Loss)
 * 
 * This script simulates a competition lifecycle to verify that final rankings
 * are correctly persisted to the Participant collection.
 * 
 * USAGE:
 * node scripts/verifyRankingsDataLoss.js
 * 
 * SCENARIO:
 * 1. Create a Competition
 * 2. Create 5 Participants
 * 3. Simulate Round Completion
 * 4. Trigger handleShowFinalResults logic
 * 5. Verify Database State
 */

const mongoose = require('mongoose');
const Competition = require('../src/models/Competition');
const Participant = require('../src/models/Participant');
const { handleShowFinalResults } = require('../src/socket/handlers/round');

// Mock Socket.IO
const ioMock = {
  to: () => ({
    emit: (event, data) => {
      console.log(`[Socket] Emitted ${event}:`, JSON.stringify(data, null, 2).substring(0, 100) + '...');
    }
  })
};

// Database Configuration
const DB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/typing-comp-test';

async function runVerification() {
  console.log('Starting Verification for Issue #190...');

  try {
    await mongoose.connect(DB_URI);
    console.log('Connected to MongoDB');

    // cleanup
    await Competition.deleteMany({ code: 'TEST1' });
    await Participant.deleteMany({ name: /^TestUser/ });

    // 1. Setup Competition
    const competition = new Competition({
      name: 'Data Loss Verification Battle',
      code: 'TEST1',
      organizer: 'System',
      rounds: [{
        roundNumber: 1,
        text: 'Test text',
        duration: 60,
        status: 'completed',
        results: []
      }],
      currentRound: 0,
      totalRounds: 1
    });
    await competition.save();
    console.log('Competition created:', competition._id);

    // 2. Setup Participants
    const participants = [];
    for (let i = 1; i <= 5; i++) {
      const p = new Participant({
        competitionId: competition._id,
        name: `TestUser${i}`,
        socketId: `socket_${i}`
      });
      await p.save();
      participants.push(p);
    }
    console.log(`${participants.length} participants created`);

    // 3. Mock Memory State (as passed to handler)
    const compData = {
      participants: new Map()
    };

    participants.forEach((p, index) => {
      // simulate scores
      p.scores = [{
        round: 0,
        wpm: 100 - (index * 10), // 100, 90, 80...
        accuracy: 98,
        rank: index + 1,
        errors: index,
        backspaces: index * 2
      }];

      // Add to map as expected by handler
      compData.participants.set(p.socketId, p);
    });

    // 4. Trigger the Fix Target
    console.log('Triggering handleShowFinalResults...');
    await handleShowFinalResults(competition._id, compData, competition, ioMock, new Map());

    // 5. Verify Persistence
    console.log('Verifying Database persistence...');

    // Check Participant 1 (Winner)
    const p1 = await Participant.findOne({ name: 'TestUser1', competitionId: competition._id });

    if (!p1) throw new Error('Participant 1 not found in DB');

    console.log('Participant 1 Stats:', {
      finalRank: p1.finalRank,
      totalWpm: p1.totalWpm,
      roundsCompleted: p1.roundsCompleted
    });

    if (p1.finalRank !== 1) throw new Error(`Expected Rank 1, got ${p1.finalRank}`);
    if (p1.totalWpm !== 100) throw new Error(`Expected WPM 100, got ${p1.totalWpm}`);
    if (p1.roundsCompleted !== 1) throw new Error(`Expected Rounds 1, got ${p1.roundsCompleted}`);

    // Check Participant 5 (Last)
    const p5 = await Participant.findOne({ name: 'TestUser5', competitionId: competition._id });
    if (p5.finalRank !== 5) throw new Error(`Expected Rank 5, got ${p5.finalRank}`);

    console.log('✅ VERIFICATION SUCCESS: Data correctly saved to Participant collection.');

  } catch (error) {
    console.error('❌ VERIFICATION FAILED:', error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

runVerification();
