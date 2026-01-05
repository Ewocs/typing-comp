const express = require('express');
const Competition = require('../models/Competition');
const generateCode = require('../utils/codeGenerator');
const auth = require('../middleware/auth');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     Round:
 *       type: object
 *       properties:
 *         roundNumber:
 *           type: integer
 *           description: Round number in the competition
 *         text:
 *           type: string
 *           description: Text content for the typing round
 *         duration:
 *           type: integer
 *           description: Duration of the round in seconds
 *         status:
 *           type: string
 *           enum: [pending, in-progress, completed]
 *           description: Current status of the round
 *         startedAt:
 *           type: string
 *           format: date-time
 *           description: When the round started
 *         endedAt:
 *           type: string
 *           format: date-time
 *           description: When the round ended
 *         participantsCompleted:
 *           type: integer
 *           description: Number of participants who completed the round
 *         highestWpm:
 *           type: number
 *           description: Highest WPM achieved in the round
 *         lowestWpm:
 *           type: number
 *           description: Lowest WPM achieved in the round
 *         averageWpm:
 *           type: number
 *           description: Average WPM for the round
 *         averageAccuracy:
 *           type: number
 *           description: Average accuracy for the round
 *     Competition:
 *       type: object
 *       properties:
 *         id:
 *           type: string
 *           description: Competition unique ID
 *         name:
 *           type: string
 *           description: Competition name
 *         code:
 *           type: string
 *           description: Unique competition code
 *         status:
 *           type: string
 *           enum: [pending, ongoing, completed]
 *           description: Competition status
 *         roundCount:
 *           type: integer
 *           description: Total number of rounds
 *         roundsCompleted:
 *           type: integer
 *           description: Number of completed rounds
 *         participants:
 *           type: integer
 *           description: Number of participants
 *         currentRound:
 *           type: integer
 *           description: Current round number (-1 if not started)
 *     CreateCompetitionRequest:
 *       type: object
 *       required:
 *         - name
 *         - rounds
 *       properties:
 *         name:
 *           type: string
 *           description: Competition name
 *         description:
 *           type: string
 *           description: Optional competition description
 *         rounds:
 *           type: array
 *           items:
 *             type: object
 *             required:
 *               - text
 *               - duration
 *             properties:
 *               text:
 *                 type: string
 *                 description: Text content for the round
 *               duration:
 *                 type: integer
 *                 description: Duration in seconds
 *     CompetitionResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           description: Operation success status
 *         code:
 *           type: string
 *           description: Generated competition code
 *         competitionId:
 *           type: string
 *           description: Competition ID
 *     CompetitionsList:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         competitions:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/Competition'
 *         count:
 *           type: integer
 *           description: Total number of competitions
 *     RankingsResponse:
 *       type: object
 *       properties:
 *         success:
 *           type: boolean
 *           example: true
 *         name:
 *           type: string
 *           description: Competition name
 *         code:
 *           type: string
 *           description: Competition code
 *         rankings:
 *           type: array
 *           items:
 *             type: object
 *             properties:
 *               rank:
 *                 type: integer
 *                 description: Final rank
 *               participantName:
 *                 type: string
 *                 description: Participant's name
 *               averageWpm:
 *                 type: number
 *                 description: Average WPM across all rounds
 *               averageAccuracy:
 *                 type: number
 *                 description: Average accuracy across all rounds
 *               totalRoundsCompleted:
 *                 type: integer
 *                 description: Number of rounds completed
 *               highestWpm:
 *                 type: number
 *                 description: Highest WPM achieved
 *               lowestWpm:
 *                 type: number
 *                 description: Lowest WPM achieved
 *         status:
 *           type: string
 *           description: Competition status
 */

/**
 * @swagger
 * /api/create:
 *   post:
 *     summary: Create a new typing competition
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCompetitionRequest'
 *     responses:
 *       200:
 *         description: Competition created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompetitionResponse'
 *       400:
 *         description: Validation error - missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/competition/{code}:
 *   get:
 *     summary: Get competition details by code
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition code
 *     responses:
 *       200:
 *         description: Competition details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Competition'
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/my-competitions:
 *   get:
 *     summary: Get competitions created by the authenticated organizer
 *     tags: [Competitions]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Competitions retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/CompetitionsList'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
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

/**
 * @swagger
 * /api/competition/id/{competitionId}:
 *   get:
 *     summary: Get full competition details by ID
 *     tags: [Competitions]
 *     parameters:
 *       - in: path
 *         name: competitionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Competition ID
 *     responses:
 *       200:
 *         description: Full competition details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 competition:
 *                   $ref: '#/components/schemas/Competition'
 *       404:
 *         description: Competition not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/competition/id/:competitionId', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.competitionId);
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }
    res.json({ competition });
  } catch (error) {
    console.error('Fetch competition error:', error);
    res.status(500).json({ error: 'Failed to fetch competition' });
  }
});

// GET COMPETITION RANKINGS
router.get('/competition/:competitionId/rankings', async (req, res) => {
  try {
    const competition = await Competition.findById(req.params.competitionId)
      .select('name code finalRankings status');
    
    if (!competition) {
      return res.status(404).json({ error: 'Competition not found' });
    }

    res.json({
      success: true,
      name: competition.name,
      code: competition.code,
      rankings: competition.finalRankings,
      status: competition.status
    });
  } catch (error) {
    console.error('Fetch rankings error:', error);
    res.status(500).json({ error: 'Failed to fetch rankings' });
  }
});

module.exports = router;