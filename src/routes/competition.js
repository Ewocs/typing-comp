const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Competition = require('../models/Competition');
const Participant = require('../models/Participant');
const generateCode = require('../utils/codeGenerator');
const auth = require('../middleware/auth');
const roleMiddleware = require("../middleware/roleMiddleware");
const AppError = require('../utils/appError');
const catchAsync = require('../utils/catchAsync');
const router = express.Router();

// Input validation middleware
const validateCompetitionCreation = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Competition name must be between 3 and 100 characters')
    .matches(/^[a-zA-Z0-9\s\-_]+$/)
    .withMessage('Competition name can only contain letters, numbers, spaces, hyphens, and underscores'),
  body('description')
    .optional()
    .trim()
    .isLength({ max: 500 })
    .withMessage('Description cannot exceed 500 characters'),
  body('rounds')
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 round is required, maximum 10 rounds allowed'),
  body('rounds.*.text')
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Round text must be between 10 and 2000 characters'),
  body('rounds.*.duration')
    .isInt({ min: 30, max: 600 })
    .withMessage('Round duration must be between 30 and 600 seconds')
];

const validateCompetitionCode = [
  param('code')
    .isLength({ min: 6, max: 6 })
    .withMessage('Competition code must be exactly 6 characters')
    .matches(/^[A-Z0-9]+$/)
    .withMessage('Competition code must contain only uppercase letters and numbers')
];

const validateCompetitionId = [
  param('competitionId')
    .isMongoId()
    .withMessage('Invalid competition ID format')
];

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(new AppError('Validation failed', 400, errors.array()));
  }
  next();
};

// CREATE COMPETITION (Protected)
router.post('/create', auth, validateCompetitionCreation, handleValidationErrors, catchAsync(async (req, res, next) => {
  const { name, description, rounds, maxPlayers } = req.body;

  if (maxPlayers !== undefined) {
    if (typeof maxPlayers !== 'number' || maxPlayers < 1) {
      return next(new AppError('Maximum players must be a number greater than 0', 400));
    }
  }

  const code = generateCode();

  const competition = new Competition({
    name: name.trim(),
    description: description ? description.trim() : '',
    code,
    organizerId: req.organizer.id,
    organizer: req.organizer.name,
    maxPlayers, // Add maxPlayers
    rounds: rounds.map((r, index) => ({
      roundNumber: index + 1,
      text: r.text.trim(),
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
      createdAt: new Date(),
    })),
    status: 'pending',
    currentRound: -1,
    totalRounds: rounds.length,
    roundsCompleted: 0,
    finalRankings: [],
    createdAt: new Date(),
  });

  await competition.save();
  logger.info(`✓ Competition created: ${code}`); // Using logger instead of console.log if available, but staying consistent with file
  res.json({ success: true, code, competitionId: competition._id });
}));



// GET COMPETITION BY CODE
router.get('/competition/:code', validateCompetitionCode, handleValidationErrors, catchAsync(async (req, res, next) => {
  const competition = await Competition.findOne({ code: req.params.code });

  if (!competition) {
    return next(new AppError('Competition not found', 404));
  }

  res.json({
    id: competition._id,
    name: competition.name,
    code: competition.code,
    status: competition.status,
    roundCount: competition.rounds.length,
    roundsCompleted: competition.roundsCompleted,
    participants: await Participant.countDocuments({
      competitionId: competition._id,
    }),
    currentRound: competition.currentRound,
  });
}));

// GET MY COMPETITIONS (Protected)
router.get('/my-competitions', auth, catchAsync(async (req, res, next) => {
  const competitions = await Competition.find({
    organizerId: req.organizer.id,
  })
    .select(
      'name code status currentRound totalRounds createdAt'
    )
    .sort({ createdAt: -1 })
    .limit(50);

  res.json({
    success: true,
    competitions,
    count: competitions.length,
  });
}));

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
 * */
router.get('/competition/id/:competitionId', validateCompetitionId, handleValidationErrors, catchAsync(async (req, res, next) => {
  const competition = await Competition.findById(req.params.competitionId);
  if (!competition) {
    return next(new AppError('Competition not found', 404));
  }
  res.json({ competition });
}));

// GET COMPETITION RANKINGS
router.get('/competition/:competitionId/rankings', validateCompetitionId, handleValidationErrors, catchAsync(async (req, res, next) => {
  const competition = await Competition.findById(req.params.competitionId)
    .select('name code finalRankings status');

  if (!competition) {
    return next(new AppError('Competition not found', 404));
  }

  res.json({
    success: true,
    name: competition.name,
    code: competition.code,
    rankings: competition.finalRankings,
    status: competition.status
  });
}));

module.exports = router;
