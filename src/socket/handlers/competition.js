const Competition = require('../../models/Competition');
const Participant = require('../../models/Participant');
const { updateAndBroadcastLeaderboard } = require('../utils/leaderboard');

async function handleStartCompetition(socket, io, data, activeCompetitions) {
  const { competitionId } = data;

  try {
    const competition = await Competition.findById(competitionId);
    if (!competition) {
      socket.emit('error', { message: 'Competition not found' });
      return;
    }

    const compData = activeCompetitions.get(competitionId);
    if (!compData) return;

    // RACE CONDITION FIX: Prevent multiple starts
    if (compData.competitionInProgress) {
      console.warn(`[RACE_CONDITION] Blocked duplicate startCompetition for ${competitionId}`);
      return;
    }

    compData.competitionInProgress = true;
    const startTime = new Date();
    competition.startedAt = startTime;
    competition.status = 'ongoing';

    // Prepare competition data based on mode
    let competitionConfig = {};

    if (competition.mode === 'timed') {
      competitionConfig = {
        mode: 'timed',
        timeLimit: competition.modeConfig.timeLimit,
        text: competition.modeConfig.textPool[0], // Use first text from pool
      };
    } else if (competition.mode === 'word-count') {
      // Randomly select text from pool
      const randomText = competition.modeConfig.textPool[
        Math.floor(Math.random() * competition.modeConfig.textPool.length)
      ];
      competitionConfig = {
        mode: 'word-count',
        targetWords: competition.modeConfig.targetWords,
        text: randomText,
      };
    }

    // Reset participant data
    compData.participants.forEach((p) => {
      p.competitionData = {
        correctChars: 0,
        totalChars: 0,
        wpm: 0,
        accuracy: 0,
        errors: 0,
        backspaces: 0,
        testStartTime: Date.now(),
        wordsTyped: 0,
        completed: false,
      };
    });

    // Update DB
    await Competition.findByIdAndUpdate(competitionId, {
      status: 'ongoing',
      startedAt: startTime,
    });

    // Broadcast competition start
    io.to(`competition_${competitionId}`).emit('competitionStarted', {
      ...competitionConfig,
      startTime: Date.now(),
    });

    // For timed mode, auto-end after time limit
    if (competition.mode === 'timed') {
      setTimeout(async () => {
        await handleEndCompetition(competitionId, competition, compData, io, activeCompetitions);
      }, competition.modeConfig.timeLimit * 1000);
    }

  } catch (error) {
    console.error('Start competition error:', error);
    socket.emit('error', { message: 'Failed to start competition' });
  }
}

async function handleEndCompetition(competitionId, competition, compData, io, activeCompetitions) {
  try {
    if (!compData || !compData.competitionInProgress) return;
    compData.competitionInProgress = false;

    const endTime = new Date();
    const participantsArray = Array.from(compData.participants.values());

    // Calculate final results
    const finalResults = participantsArray.map((p) => {
      const data = p.competitionData || {};
      return {
        participantName: p.name,
        participantId: p.socketId,
        wpm: data.wpm || 0,
        accuracy: data.accuracy || 0,
        correctChars: data.correctChars || 0,
        totalChars: data.totalChars || 0,
        incorrectChars: data.errors || 0,
        errors: data.errors || 0,
        backspaces: data.backspaces || 0,
        rank: 0, // Will be calculated below
        typingTime: data.typingTime || 0,
        wordsTyped: data.wordsTyped || 0,
        completed: data.completed || false,
      };
    });

    // Sort by WPM (descending) for ranking
    finalResults.sort((a, b) => b.wpm - a.wpm);

    // Assign ranks
    finalResults.forEach((result, index) => {
      result.rank = index + 1;
    });

    // Update competition with final results
    competition.status = 'completed';
    competition.completedAt = endTime;
    competition.finalRankings = finalResults.map(result => ({
      rank: result.rank,
      participantName: result.participantName,
      averageWpm: result.wpm,
      averageAccuracy: result.accuracy,
      totalRoundsCompleted: 1,
      highestWpm: result.wpm,
      lowestWpm: result.wpm,
    }));

    await competition.save();

    // Save individual participant results
    for (const result of finalResults) {
      const participant = participantsArray.find(p => p.socketId === result.participantId);
      if (participant) {
        await Participant.findOneAndUpdate(
          { socketId: result.participantId, competitionId },
          {
            $push: {
              results: {
                wpm: result.wpm,
                accuracy: result.accuracy,
                correctChars: result.correctChars,
                totalChars: result.totalChars,
                errors: result.errors,
                backspaces: result.backspaces,
                typingTime: result.typingTime,
                wordsTyped: result.wordsTyped,
                completed: result.completed,
                createdAt: new Date(),
              }
            }
          },
          { upsert: true }
        );
      }
    }

    // Broadcast final results
    io.to(`competition_${competitionId}`).emit('competitionEnded', {
      finalResults,
      competitionMode: competition.mode,
    });

    // Update leaderboard
    await updateAndBroadcastLeaderboard(competitionId, io, activeCompetitions);

  } catch (error) {
    console.error('End competition error:', error);
  }
}

module.exports = {
  handleStartCompetition,
  handleEndCompetition,
};