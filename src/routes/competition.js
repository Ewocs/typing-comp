const express = require('express');
const Competition = require('../models/Competition');
const generateCode = require('../utils/codeGenerator');
const auth = require('../middleware/auth');

const router = express.Router();

// CREATE COMPETITION (Protected)
router.post('/create', auth, async (req, res) => {
  try {
    const { name, description, rounds } = req.body;
    
    if (!name || !rounds || rounds.length === 0) {
      return res.status(400).json({ error: 'Name and rounds required' });
    }

    const code = generateCode();
    
    const competition = new Competition({
      name,
      description: description || '',
      code,
      organizerId: req.organizer.id,
      organizer: req.organizer.name,
      rounds: rounds.map((r, index) => ({
        roundNumber: index + 1,
        text: r.text,
        duration: r.duration,
        status: 'pending',
        startedAt: null,
        endedAt: null,
        totalDuration: 0,
        participantsCompleted: 0,
        highestWpm: 0,
        lowestWpm: 0,
        averageWpm: 0,
        averageAccuracy: 0,
        results: [],
        createdAt: new Date()
      })),
      status: 'pending',
      currentRound: -1,
      totalRounds: rounds.length,
      roundsCompleted: 0,
      finalRankings: [],
      createdAt: new Date()
    });

    await competition.save();
    console.log('✓ Competition created:', code);
    res.json({ success: true, code, competitionId: competition._id });
  } catch (error) {
    console.error('Create error:', error);
    res.status(500).json({ error: 'Failed to create competition' });
  }
});

// GET COMPETITION BY CODE
router.get('/competition/:code', async (req, res) => {
  try {
    const competition = await Competition.findOne({ code: req.params.code });
    
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    res.json({
      id: competition._id,
      name: competition.name,
      code: competition.code,
      status: competition.status,
      roundCount: competition.rounds.length,
      roundsCompleted: competition.roundsCompleted,
      participants: competition.participants.length,
      currentRound: competition.currentRound
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// GET MY COMPETITIONS (Protected)
router.get('/my-competitions', auth, async (req, res) => {
  try {
    const competitions = await Competition.find({ 
      organizerId: req.organizer.id 
    })
    .select('name code status currentRound totalRounds createdAt participants')
    .sort({ createdAt: -1 })
    .limit(50);
    
    res.json({ 
      success: true, 
      competitions,
      count: competitions.length
    });
  } catch (error) {
    console.error('Fetch competitions error:', error);
    res.status(500).json({ error: 'Failed to fetch competitions' });
  }
});

// GET COMPETITION BY ID
router.get('/compition/:compitionid', async (req, res) => {
  try {
    const compid = await Competition.findOne({ _id: req.params.compitionid });
    res.json({ compid });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

module.exports = router;