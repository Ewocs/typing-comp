const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Competition = require('../models/Competition');
const catchAsync = require('../utils/catchAsync');

/**
 * @route   GET /api/analytics/overview
 * @desc    Get overview statistics for organizer's competitions
 * @access  Private (Organizer only)
 */
router.get('/overview', auth, catchAsync(async (req, res, next) => {
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
}));

/**
 * @route   GET /api/analytics/competitions
 * @desc    Get detailed competition statistics
 * @access  Private (Organizer only)
 */
router.get('/competitions', auth, catchAsync(async (req, res, next) => {
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
}));

/**
 * @route   GET /api/analytics/participants
 * @desc    Get participant distribution and performance across competitions
 * @access  Private (Organizer only)
 */
router.get('/participants', auth, catchAsync(async (req, res, next) => {
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
}));

/**
 * @route   GET /api/analytics/trends
 * @desc    Get performance trends over time
 * @access  Private (Organizer only)
 */
router.get('/trends', auth, catchAsync(async (req, res, next) => {
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
}));

/**
 * @route   GET /api/analytics/accuracy-distribution
 * @desc    Get accuracy distribution across all participants
 * @access  Private (Organizer only)
 */
router.get('/accuracy-distribution', auth, catchAsync(async (req, res, next) => {
  const organizerId = req.organizer.id;

  // Get accuracy distribution in buckets
  const accuracyBuckets = await Competition.aggregate([
    { $match: { organizerId } },
    { $unwind: { path: '$rounds', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$rounds.results', preserveNullAndEmptyArrays: true } },
    {
      $bucket: {
        groupBy: '$rounds.results.accuracy',
        boundaries: [0, 50, 60, 70, 80, 85, 90, 95, 100],
        default: 'Other',
        output: {
          count: { $sum: 1 },
          avgWPM: { $avg: '$rounds.results.wpm' },
        },
      },
    },
  ]);

  res.json({
    success: true,
    data: accuracyBuckets.map(bucket => ({
      range: bucket._id === 'Other' ? '90-100%' : `${bucket._id}-${bucket._id + (bucket._id < 90 ? 10 : 5)}%`,
      count: bucket.count,
      avgWPM: Math.round(bucket.avgWPM || 0),
    })),
  });
}));

/**
 * @route   GET /api/analytics/engagement-metrics
 * @desc    Get participant engagement metrics
 * @access  Private (Organizer only)
 */
router.get('/engagement-metrics', auth, catchAsync(async (req, res, next) => {
  const organizerId = req.organizer.id;

  // Get engagement metrics
  const engagementData = await Competition.aggregate([
    { $match: { organizerId } },
    {
      $project: {
        name: 1,
        status: 1,
        participantCount: { $size: { $ifNull: ['$participants', []] } },
        roundCount: { $size: { $ifNull: ['$rounds', []] } },
        totalResults: {
          $sum: {
            $map: {
              input: '$rounds',
              as: 'round',
              in: { $size: { $ifNull: ['$$round.results', []] } },
            },
          },
        },
        createdAt: 1,
        updatedAt: 1,
      },
    },
    {
      $group: {
        _id: null,
        totalCompetitions: { $sum: 1 },
        activeCompetitions: {
          $sum: { $cond: [{ $eq: ['$status', 'active'] }, 1, 0] },
        },
        totalParticipants: { $sum: '$participantCount' },
        totalRounds: { $sum: '$roundCount' },
        totalRounds: { $sum: '$roundCount' },
        totalResults: { $sum: '$totalResults' },
        avgParticipantsPerCompetition: { $avg: '$participantCount' },
        avgRoundsPerCompetition: { $avg: '$roundCount' },
        avgResultsPerRound: { $avg: '$totalResults' },
      },
    },
  ]);

  const metrics = engagementData[0] || {};

  res.json({
    success: true,
    data: {
      overview: {
        totalCompetitions: metrics.totalCompetitions || 0,
        activeCompetitions: metrics.activeCompetitions || 0,
        totalParticipants: metrics.totalParticipants || 0,
        totalRounds: metrics.totalRounds || 0,
        totalResults: metrics.totalResults || 0,
      },
      averages: {
        participantsPerCompetition: Math.round(metrics.avgParticipantsPerCompetition || 0),
        roundsPerCompetition: Math.round(metrics.avgRoundsPerCompetition || 0),
        resultsPerRound: Math.round(metrics.avgResultsPerRound || 0),
      },
      engagement: {
        completionRate: metrics.totalRounds > 0 ?
          Math.round((metrics.totalResults / (metrics.totalRounds * metrics.avgParticipantsPerCompetition)) * 100) : 0,
        activityScore: Math.round((metrics.totalResults / Math.max(metrics.totalCompetitions, 1)) * 10),
      },
    },
  });
}));

/**
 * @route   GET /api/analytics/performance-heatmap
 * @desc    Get performance data for heatmap visualization
 * @access  Private (Organizer only)
 */
router.get('/performance-heatmap', auth, catchAsync(async (req, res, next) => {
  const organizerId = req.organizer.id;

  // Get WPM distribution by hour of day and day of week
  const heatmapData = await Competition.aggregate([
    { $match: { organizerId } },
    { $unwind: { path: '$rounds', preserveNullAndEmptyArrays: true } },
    { $unwind: { path: '$rounds.results', preserveNullAndEmptyArrays: true } },
    {
      $project: {
        wpm: '$rounds.results.wpm',
        hour: {
          $hour: { $ifNull: ['$rounds.completedAt', '$rounds.createdAt'] },
        },
        dayOfWeek: {
          $dayOfWeek: { $ifNull: ['$rounds.completedAt', '$rounds.createdAt'] },
        },
      },
    },
    {
      $group: {
        _id: { hour: '$hour', dayOfWeek: '$dayOfWeek' },
        avgWPM: { $avg: '$wpm' },
        count: { $sum: 1 },
      },
    },
    { $sort: { '_id.dayOfWeek': 1, '_id.hour': 1 } },
  ]);

  // Create 7x24 grid (days x hours)
  const grid = Array.from({ length: 7 }, () => Array(24).fill(0));
  const wpmGrid = Array.from({ length: 7 }, () => Array(24).fill(0));

  heatmapData.forEach(item => {
    const day = item._id.dayOfWeek - 1; // MongoDB dayOfWeek is 1-7 (Sun-Sat)
    const hour = item._id.hour;
    grid[day][hour] = item.count;
    wpmGrid[day][hour] = Math.round(item.avgWPM);
  });

  res.json({
    success: true,
    data: {
      activity: grid,
      performance: wpmGrid,
      days: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      hours: Array.from({ length: 24 }, (_, i) => `${i}:00`),
    },
  });
}));

/**
 * @route   GET /api/analytics/export
 * @desc    Export analytics data as CSV
 * @access  Private (Organizer only)
 */
router.get('/export', auth, catchAsync(async (req, res, next) => {
  const organizerId = req.organizer.id;
  const { type = 'overview' } = req.query;

  let data = [];
  let filename = 'analytics-export.csv';
  let headers = [];

  if (type === 'competitions') {
    const competitions = await Competition.aggregate([
      { $match: { organizerId } },
      {
        $project: {
          name: 1,
          code: 1,
          status: 1,
          participantCount: { $size: { $ifNull: ['$participants', []] } },
          roundCount: { $size: { $ifNull: ['$rounds', []] } },
          createdAt: 1,
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
    ]);

    headers = ['Competition Name', 'Code', 'Status', 'Participants', 'Rounds', 'Avg WPM', 'Created Date'];
    data = competitions.map(comp => [
      comp.name,
      comp.code,
      comp.status,
      comp.participantCount,
      comp.roundCount,
      Math.round(comp.avgWPM || 0),
      new Date(comp.createdAt).toLocaleDateString(),
    ]);
    filename = 'competitions-analytics.csv';

  } else if (type === 'participants') {
    const participants = await Competition.aggregate([
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
    ]);

    headers = ['Participant Name', 'Avg WPM', 'Max WPM', 'Total Rounds', 'Avg Accuracy'];
    data = participants.map(p => [
      p._id,
      Math.round(p.avgWPM),
      Math.round(p.maxWPM),
      p.totalRounds,
      Math.round(p.avgAccuracy || 0),
    ]);
    filename = 'participants-analytics.csv';
  }

  // Convert to CSV
  const csvContent = [
    headers.join(','),
    ...data.map(row => row.map(cell => `"${cell}"`).join(',')),
  ].join('\n');

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  res.send(csvContent);
}));

module.exports = router;
