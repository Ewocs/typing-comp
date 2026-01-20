const express = require('express');
const { body, param, validationResult } = require('express-validator');
const Competition = require('../models/Competition');
const Participant = require('../models/Participant');
const generateCode = require('../utils/codeGenerator');
const auth = require('../middleware/auth');
const roleMiddleware = require("../middleware/roleMiddleware");
const AppError = require('../utils/appError');
const logger = require('../config/logger');
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
  body('mode')
    .optional()
    .isIn(['rounds', 'timed', 'word-count'])
    .withMessage('Mode must be one of: rounds, timed, word-count'),
  body('modeConfig')
    .optional()
    .isObject()
    .withMessage('Mode configuration must be an object'),
  body('modeConfig.timeLimit')
    .optional()
    .isInt({ min: 30, max: 3600 })
    .withMessage('Time limit must be between 30 and 3600 seconds'),
  body('modeConfig.targetWords')
    .optional()
    .isInt({ min: 10, max: 1000 })
    .withMessage('Target words must be between 10 and 1000'),
  body('modeConfig.textPool')
    .optional()
    .isArray({ min: 1, max: 50 })
    .withMessage('Text pool must contain 1-50 texts'),
  body('modeConfig.textPool.*')
    .optional()
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Each text in pool must be between 10 and 2000 characters'),
  body('rounds')
    .if(body('mode').not().equals('rounds'))
    .optional()
    .custom(() => true) // Skip validation for non-rounds modes
    .if(body('mode').equals('rounds'))
    .isArray({ min: 1, max: 10 })
    .withMessage('At least 1 round is required for rounds mode, maximum 10 rounds allowed'),
  body('rounds.*.text')
    .if(body('mode').equals('rounds'))
    .trim()
    .isLength({ min: 10, max: 2000 })
    .withMessage('Round text must be between 10 and 2000 characters'),
  body('rounds.*.duration')
    .if(body('mode').equals('rounds'))
    .isInt({ min: 30, max: 600 })
    .withMessage('Round duration must be between 30 and 600 seconds')
];

const validateCompetitionCode = [
  param('code')
    .isLength({ min: 5, max: 5 })
    .withMessage('Competition code must be exactly 5 characters')
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
  const { name, description, mode = 'rounds', modeConfig = {}, rounds, maxPlayers } = req.body;

  // Validate mode-specific requirements
  if (mode === 'timed' && (!modeConfig.timeLimit || modeConfig.timeLimit < 30)) {
    return next(new AppError('Timed mode requires a time limit of at least 30 seconds', 400));
  }

  if (mode === 'word-count' && (!modeConfig.targetWords || modeConfig.targetWords < 10)) {
    return next(new AppError('Word count mode requires a target of at least 10 words', 400));
  }

  if (mode === 'word-count' && (!modeConfig.textPool || modeConfig.textPool.length === 0)) {
    return next(new AppError('Word count mode requires at least one text in the pool', 400));
  }

  if (mode === 'rounds' && (!rounds || rounds.length === 0)) {
    return next(new AppError('Rounds mode requires at least one round', 400));
  }

  if (maxPlayers !== undefined) {
    if (typeof maxPlayers !== 'number' || maxPlayers < 1) {
      return next(new AppError('Maximum players must be a number greater than 0', 400));
    }
  }

  logger.info(`Generating competition code for organizer: ${req.organizer.id}`);
  const code = generateCode();
  logger.info(`Competition code generated: ${code}`);

  const competitionData = {
    name: name.trim(),
    description: description ? description.trim() : '',
    code,
    organizerId: req.organizer.id,
    organizer: req.organizer.name,
    mode,
    modeConfig,
    maxPlayers,
    status: 'pending',
    currentRound: -1,
    totalRounds: 0,
    roundsCompleted: 0,
    finalRankings: [],
    createdAt: new Date(),
  };

  // Add rounds only for rounds mode
  if (mode === 'rounds' && rounds) {
    competitionData.rounds = rounds.map((r, index) => ({
      roundNumber: index + 1,
      text: r.text.trim(),
      language: r.language || 'en',
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
    }));
    competitionData.totalRounds = rounds.length;
  }

  const competition = new Competition(competitionData);

  await competition.save();
  logger.info(`✓ Competition created successfully with code: ${code} (mode: ${mode})`);
  res.json({ success: true, code, competitionId: competition._id, mode });
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
