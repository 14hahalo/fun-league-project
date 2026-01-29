import { useState, useCallback } from 'react';
import { gameApi, teamApi, playerStatsApi, teamStatsApi } from '../api/basketballApi';
import { playerApi } from '../api/playerApi';
import type { Game, Team, PlayerStats, TeamStats } from '../types/basketball.types';
import type { Player } from '../types/player.types';

export interface PlayerStatsWithInfo extends PlayerStats {
  player?: Player;
}

export interface MatchDetails {
  game: Game;
  teamA?: Team;
  teamB?: Team;
  teamAStats?: TeamStats;
  teamBStats?: TeamStats;
  playerStats: PlayerStatsWithInfo[];
}

export const useMatchDetails = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matchDetails, setMatchDetails] = useState<MatchDetails | null>(null);

  const fetchMatchDetails = useCallback(async (gameId: string) => {
    setLoading(true);
    setError(null);

    try {
      const game = await gameApi.getGameById(gameId);

      let teamA: Team | undefined;
      let teamB: Team | undefined;
      if (game.teamAId && game.teamBId) {
        [teamA, teamB] = await Promise.all([
          teamApi.getTeamById(game.teamAId),
          teamApi.getTeamById(game.teamBId),
        ]);
      }

      let teamAStats: TeamStats | undefined;
      let teamBStats: TeamStats | undefined;
      if (game.teamAStatsId && game.teamBStatsId) {
        [teamAStats, teamBStats] = await Promise.all([
          teamStatsApi.getTeamStatsById(game.teamAStatsId),
          teamStatsApi.getTeamStatsById(game.teamBStatsId),
        ]);
      }

      const playerStats = await playerStatsApi.getPlayerStatsByGameId(gameId);

      const uniquePlayerIds = [...new Set(playerStats.map(stat => stat.playerId))];

      const playersPromises = uniquePlayerIds.map(playerId =>
        playerApi.getPlayerById(playerId).catch(err => {
          console.error(`Failed to fetch player ${playerId}:`, err);
          return null;
        })
      );
      const players = await Promise.all(playersPromises);

      const playerMap = new Map(
        players
          .filter((p): p is NonNullable<typeof p> => p !== null)
          .map(p => [p.id, p])
      );

      const playerStatsWithInfo: PlayerStatsWithInfo[] = playerStats.map(stat => ({
        ...stat,
        player: playerMap.get(stat.playerId)
      }));

      const details: MatchDetails = {
        game,
        teamA,
        teamB,
        teamAStats,
        teamBStats,
        playerStats: playerStatsWithInfo,
      };

      setMatchDetails(details);
      return details;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch match details';
      setError(errorMessage);
      console.error('Error fetching match details:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    matchDetails,
    loading,
    error,
    fetchMatchDetails,
  };
};
