import { useState } from 'react';
import { gameApi, teamApi, playerStatsApi, teamStatsApi, videoApi } from '../api/basketballApi';
import type { MatchStatsData } from '../components/admin/AddMatchStatsModal';
import type { EditMatchStatsData } from '../components/admin/EditMatchStatsModal';

export const useMatchStats = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createMatchStats = async (matchData: MatchStatsData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Create the game
      const game = await gameApi.createGame({
        gameNumber: matchData.metadata.gameNumber,
        date: matchData.metadata.date,
        status: 'COMPLETED',
        teamSize: matchData.metadata.teamSize,
        notes: matchData.metadata.notes,
      });

      // Step 2: Create teams
      const teamA = await teamApi.createTeam({
        gameId: game.id,
        teamType: 'TEAM_A',
        playerIds: matchData.teamPlayers.teamA.map((p) => p.id),
        teamName: 'Team A',
      });

      const teamB = await teamApi.createTeam({
        gameId: game.id,
        teamType: 'TEAM_B',
        playerIds: matchData.teamPlayers.teamB.map((p) => p.id),
        teamName: 'Team B',
      });

      // Step 3: Create player stats for all players
      const playerStatsPromises = matchData.playerStats.map((playerStat) =>
        playerStatsApi.createPlayerStats({
          gameId: game.id,
          playerId: playerStat.playerId,
          teamType: playerStat.teamType,
          twoPointAttempts: playerStat.twoPointAttempts,
          twoPointMade: playerStat.twoPointMade,
          threePointAttempts: playerStat.threePointAttempts,
          threePointMade: playerStat.threePointMade,
          defensiveRebounds: playerStat.defensiveRebounds,
          offensiveRebounds: playerStat.offensiveRebounds,
          assists: playerStat.assists,
        })
      );

      await Promise.all(playerStatsPromises);

      // Step 4: Generate team stats
      const teamAStats = await teamStatsApi.generateTeamStats(game.id, 'TEAM_A');
      const teamBStats = await teamStatsApi.generateTeamStats(game.id, 'TEAM_B');

      // Step 5: Update game with team references
      await gameApi.updateGame(game.id, {
        teamAId: teamA.id,
        teamBId: teamB.id,
        teamAStatsId: teamAStats.id,
        teamBStatsId: teamBStats.id,
        teamAScore: teamAStats.totalPoints,
        teamBScore: teamBStats.totalPoints,
      });

      // Step 5.5: Generate AI analysis (after all stats are in place)
      try {
        await gameApi.generateAnalysis(game.id);
      } catch (err) {
        // Don't throw - match creation should succeed even if AI fails
      }

      // Step 6: Create videos if any
      if (matchData.videos && matchData.videos.length > 0) {
        const videoPromises = matchData.videos.map((video) =>
          videoApi.createVideo({
            ...video,
            gameId: game.id, // Replace temp ID with actual game ID
          })
        );
        await Promise.all(videoPromises);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create match stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMatchStats = async (gameId: string, matchData: EditMatchStatsData): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Update the game metadata
      await gameApi.updateGame(gameId, {
        gameNumber: matchData.metadata.gameNumber,
        date: matchData.metadata.date,
        teamSize: matchData.metadata.teamSize,
        notes: matchData.metadata.notes,
      });

      // Step 2: Get existing teams
      const existingTeams = await teamApi.getTeamsByGameId(gameId);
      const teamA = existingTeams.find(t => t.teamType === 'TEAM_A');
      const teamB = existingTeams.find(t => t.teamType === 'TEAM_B');

      // Step 3: Update teams with new player lists
      if (teamA) {
        await teamApi.updateTeam(teamA.id, {
          playerIds: matchData.teamPlayers.teamA.map(p => p.id),
        });
      }

      if (teamB) {
        await teamApi.updateTeam(teamB.id, {
          playerIds: matchData.teamPlayers.teamB.map(p => p.id),
        });
      }

      // Step 4: Get existing player stats for this game
      const existingPlayerStats = await playerStatsApi.getPlayerStatsByGameId(gameId);

      // Step 5: Delete all existing player stats (ignore 404 errors)
      await Promise.all(existingPlayerStats.map(async (stat) => {
        try {
          await playerStatsApi.deletePlayerStats(stat.id);
        } catch (err: any) {
          // Ignore 404 errors (stat already deleted), but throw other errors
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }));

      // Step 6: Create new player stats
      const playerStatsPromises = matchData.playerStats.map((playerStat) =>
        playerStatsApi.createPlayerStats({
          gameId: gameId,
          playerId: playerStat.playerId,
          teamType: playerStat.teamType,
          twoPointAttempts: playerStat.twoPointAttempts,
          twoPointMade: playerStat.twoPointMade,
          threePointAttempts: playerStat.threePointAttempts,
          threePointMade: playerStat.threePointMade,
          defensiveRebounds: playerStat.defensiveRebounds,
          offensiveRebounds: playerStat.offensiveRebounds,
          assists: playerStat.assists,
        })
      );

      await Promise.all(playerStatsPromises);

      // Step 7: Recalculate team stats
      const teamAStats = await teamStatsApi.recalculateTeamStats(gameId, 'TEAM_A');
      const teamBStats = await teamStatsApi.recalculateTeamStats(gameId, 'TEAM_B');

      // Step 8: Update game scores
      await gameApi.updateGame(gameId, {
        teamAScore: teamAStats.totalPoints,
        teamBScore: teamBStats.totalPoints,
      });

      // Step 9: Handle video updates (only if there are new videos)
      if (matchData.videos && matchData.videos.length > 0) {
        const videoPromises = matchData.videos.map((video) => {
          const videoData = {
            ...video,
            gameId: gameId,
          };
          return videoApi.createVideo(videoData);
        });
        await Promise.all(videoPromises);
      }
      // Note: Video deletions are handled directly in the EditMatchStatsModal
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update match stats';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createMatchStats,
    updateMatchStats,
    loading,
    error,
  };
};
