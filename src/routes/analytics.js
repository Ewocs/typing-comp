const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Competition = require('../models/Competition');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overview statistics for organizer's competitions
 * @access  Private (Organizer only)
 */
router.get('/overview', auth, async (req, res) => {
  try {
    const organizerId = req.organizer.id;

    // Get total competitions count
    const totalCompetitions = await Competition.countDocuments({
      organizerId,
    });

    // Get active competitions (status: 'active')
    const activeCompetitions = await Competition.countDocuments({
      organizerId,
      status: 'active',
    });

    // Get completed competitions
    const completedCompetitions = await Competition.countDocuments({
      organizerId,
      status: 'completed',
    });

    // Get total participants across all competitions
    const participantStats = await Competition.aggregate([
      { $match: { organizerId } },
      {
        $project: {
          participantCount: { $size: { $ifNull: ['$participants', []] } },
        },
      },
      {
        $group: {
          _id: null,
          totalParticipants: { $sum: '$participantCount' },
          avgParticipants: { $avg: '$participantCount' },
        },
      },
    ]);

    // Get average WPM across all completed rounds
    const wpmStats = await Competition.aggregate([
      { $match: { organizerId } },
      { $unwind: { path: '$rounds', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$rounds.results', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          avgWPM: { $avg: '$rounds.results.wpm' },
          maxWPM: { $max: '$rounds.results.wpm' },
          minWPM: { $min: '$rounds.results.wpm' },
        },
      },
    ]);

    res.json({
      success: true,
      data: {
        competitions: {
          total: totalCompetitions,
          active: activeCompetitions,
          completed: completedCompetitions,
        },
        participants: {
          total: participantStats[0]?.totalParticipants || 0,
          average: Math.round(participantStats[0]?.avgParticipants || 0),
        },
        performance: {
          avgWPM: Math.round(wpmStats[0]?.avgWPM || 0),
          maxWPM: Math.round(wpmStats[0]?.maxWPM || 0),
          minWPM: Math.round(wpmStats[0]?.minWPM || 0),
        },
      },
    });
  } catch (error) {
    console.error('Analytics overview error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics overview',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/analytics/competitions
 * @desc    Get detailed competition statistics
 * @access  Private (Organizer only)
 */
router.get('/competitions', auth, async (req, res) => {
  try {
    const organizerId = req.organizer.id;

    // Get competitions with participant count and avg WPM
    const competitions = await Competition.aggregate([
      { $match: { organizerId } },
      {
        $project: {
          name: 1,
          code: 1,
          status: 1,
          createdAt: 1,
          participantCount: { $size: { $ifNull: ['$participants', []] } },
          totalRounds: { $size: { $ifNull: ['$rounds', []] } },
          rounds: 1,
        },
      },
      {
        $addFields: {
          avgWPM: {
            $cond: {
              if: { $gt: [{ $size: { $ifNull: ['$rounds', []] } }, 0] },
              then: {
                $avg: {
                  $map: {
                    input: '$rounds',
                    as: 'round',
                    in: {
                      $avg: {
                        $map: {
                          input: { $ifNull: ['$$round.results', []] },
                          as: 'result',
                          in: '$$result.wpm',
                        },
                      },
                    },
                  },
                },
              },
              else: 0,
            },
          },
        },
      },
      { $sort: { createdAt: -1 } },
      { $limit: 20 }, // Limit to 20 most recent competitions
    ]);

    // Format data for chart
    const chartData = competitions.map((comp) => ({
      name: comp.name,
      code: comp.code,
      status: comp.status,
      participants: comp.participantCount,
      rounds: comp.totalRounds,
      avgWPM: Math.round(comp.avgWPM || 0),
      createdAt: comp.createdAt,
    }));

    res.json({
      success: true,
      data: chartData,
    });
  } catch (error) {
    console.error('Analytics competitions error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch competition analytics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/analytics/participants
 * @desc    Get participant distribution and performance across competitions
 * @access  Private (Organizer only)
 */
router.get('/participants', auth, async (req, res) => {
  try {
    const organizerId = req.organizer.id;

    // Get participant distribution by competition
    const participantDistribution = await Competition.aggregate([
      { $match: { organizerId } },
      {
        $project: {
          name: 1,
          code: 1,
          participantCount: { $size: { $ifNull: ['$participants', []] } },
        },
      },
      { $sort: { participantCount: -1 } },
      { $limit: 10 }, // Top 10 competitions by participants
    ]);

    // Get top performers across all competitions
    const topPerformers = await Competition.aggregate([
      { $match: { organizerId } },
      { $unwind: { path: '$rounds', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$rounds.results', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$rounds.results.name',
          avgWPM: { $avg: '$rounds.results.wpm' },
          maxWPM: { $max: '$rounds.results.wpm' },
          totalRounds: { $sum: 1 },
          avgAccuracy: { $avg: '$rounds.results.accuracy' },
        },
      },
      { $match: { _id: { $ne: null } } },
      { $sort: { avgWPM: -1 } },
      { $limit: 10 }, // Top 10 performers
    ]);

    res.json({
      success: true,
      data: {
        distribution: participantDistribution.map((comp) => ({
          competition: comp.name,
          code: comp.code,
          participants: comp.participantCount,
        })),
        topPerformers: topPerformers.map((performer) => ({
          name: performer._id,
          avgWPM: Math.round(performer.avgWPM),
          maxWPM: Math.round(performer.maxWPM),
          totalRounds: performer.totalRounds,
          avgAccuracy: Math.round(performer.avgAccuracy || 0),
        })),
      },
    });
  } catch (error) {
    console.error('Analytics participants error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch participant analytics',
      error: error.message,
    });
  }
});

/**
 * @route   GET /api/analytics/trends
 * @desc    Get performance trends over time
 * @access  Private (Organizer only)
 */
router.get('/trends', auth, async (req, res) => {
  try {
    const organizerId = req.organizer.id;
    const { period = '30' } = req.query; // Default to 30 days

    const daysAgo = parseInt(period);
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysAgo);

    // Get competitions created over time
    const competitionTrends = await Competition.aggregate([
      {
        $match: {
          organizerId,
          createdAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
          },
          count: { $sum: 1 },
          totalParticipants: {
            $sum: { $size: { $ifNull: ['$participants', []] } },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Get WPM trends over time
    const wpmTrends = await Competition.aggregate([
      {
        $match: {
          organizerId,
          createdAt: { $gte: startDate },
        },
      },
      { $unwind: { path: '$rounds', preserveNullAndEmptyArrays: true } },
      { $unwind: { path: '$rounds.results', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: '%Y-%m-%d',
              date: { $ifNull: ['$rounds.completedAt', '$createdAt'] },
            },
          },
          avgWPM: { $avg: '$rounds.results.wpm' },
          avgAccuracy: { $avg: '$rounds.results.accuracy' },
          totalTypists: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    res.json({
      success: true,
      data: {
        competitions: competitionTrends.map((trend) => ({
          date: trend._id,
          competitions: trend.count,
          participants: trend.totalParticipants,
        })),
        performance: wpmTrends.map((trend) => ({
          date: trend._id,
          avgWPM: Math.round(trend.avgWPM),
          avgAccuracy: Math.round(trend.avgAccuracy || 0),
          totalTypists: trend.totalTypists,
        })),
      },
    });
  } catch (error) {
    console.error('Analytics trends error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch trend analytics',
      error: error.message,
    });
  }
});

module.exports = router;
