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
      const game = await gameApi.createGame({
        gameNumber: matchData.metadata.gameNumber,
        date: matchData.metadata.date,
        status: 'COMPLETED',
        teamSize: matchData.metadata.teamSize,
        notes: matchData.metadata.notes,
        seasonId: matchData.metadata.seasonId,
      });

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

      const teamAStats = await teamStatsApi.generateTeamStats(game.id, 'TEAM_A');
      const teamBStats = await teamStatsApi.generateTeamStats(game.id, 'TEAM_B');

      await gameApi.updateGame(game.id, {
        teamAId: teamA.id,
        teamBId: teamB.id,
        teamAStatsId: teamAStats.id,
        teamBStatsId: teamBStats.id,
        teamAScore: teamAStats.totalPoints,
        teamBScore: teamBStats.totalPoints,
      });

      try {
        await gameApi.generateAnalysis(game.id);
      } catch (err) {
      }

      if (matchData.videos && matchData.videos.length > 0) {
        const videoPromises = matchData.videos.map((video) =>
          videoApi.createVideo({
            ...video,
            gameId: game.id,
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
      await gameApi.updateGame(gameId, {
        gameNumber: matchData.metadata.gameNumber,
        date: matchData.metadata.date,
        teamSize: matchData.metadata.teamSize,
        notes: matchData.metadata.notes,
      });

      const existingTeams = await teamApi.getTeamsByGameId(gameId);
      const teamA = existingTeams.find(t => t.teamType === 'TEAM_A');
      const teamB = existingTeams.find(t => t.teamType === 'TEAM_B');

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

      const existingPlayerStats = await playerStatsApi.getPlayerStatsByGameId(gameId);

      await Promise.all(existingPlayerStats.map(async (stat) => {
        try {
          await playerStatsApi.deletePlayerStats(stat.id);
        } catch (err: any) {
          if (err?.response?.status !== 404) {
            throw err;
          }
        }
      }));

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

      const teamAStats = await teamStatsApi.recalculateTeamStats(gameId, 'TEAM_A');
      const teamBStats = await teamStatsApi.recalculateTeamStats(gameId, 'TEAM_B');

      await gameApi.updateGame(gameId, {
        teamAScore: teamAStats.totalPoints,
        teamBScore: teamBStats.totalPoints,
      });

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
