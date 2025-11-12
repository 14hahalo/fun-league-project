import { useState, useEffect } from 'react';
import { playerStatsApi } from '../api/playerStatsApi';
import { playerApi } from '../api/playerApi';

export interface TopPlayerStats {
  playerId: string;
  playerNickname?: string;
  playerPhotoUrl?: string;
  playerPosition?: string;
  playerJerseyNumber?: number;
  totalPoints?: number;
  totalRebounds?: number;
  totalAssists?: number;
  shootingPercentage?: number;
  gamesPlayed?: number;
}

export interface TopPlayers {
  topScorer: TopPlayerStats | null;
  bestShooter: TopPlayerStats | null;
  mostRebounds: TopPlayerStats | null;
  mostAssists: TopPlayerStats | null;
}

export const useTopPlayers = (daysBack: number = 30) => {
  const [topPlayers, setTopPlayers] = useState<TopPlayers>({
    topScorer: null,
    bestShooter: null,
    mostRebounds: null,
    mostAssists: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopPlayers = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch top players stats
        const data = await playerStatsApi.getTopPlayers(daysBack);

        // Fetch all players to get their details
        const players = await playerApi.getAllPlayers();

        // Helper function to enrich player data
        const enrichPlayerData = (statsData: any): TopPlayerStats | null => {
          if (!statsData) return null;

          const player = players.find(p => p.id === statsData.playerId);
          return {
            playerId: statsData.playerId,
            playerNickname: player?.nickname,
            playerPhotoUrl: player?.photoUrl,
            playerPosition: player?.position,
            playerJerseyNumber: player?.jerseyNumber,
            totalPoints: statsData.totalPoints,
            totalRebounds: statsData.totalRebounds,
            totalAssists: statsData.totalAssists,
            shootingPercentage: statsData.twoPointAttempts + statsData.threePointAttempts > 0
              ? ((statsData.twoPointMade + statsData.threePointMade) / (statsData.twoPointAttempts + statsData.threePointAttempts)) * 100
              : 0,
            gamesPlayed: statsData.gamesPlayed,
          };
        };

        setTopPlayers({
          topScorer: enrichPlayerData(data.topScorer),
          bestShooter: enrichPlayerData(data.bestShooter),
          mostRebounds: enrichPlayerData(data.mostRebounds),
          mostAssists: enrichPlayerData(data.mostAssists),
        });
      } catch (err: any) {
        setError(err.message || 'En iyi oyuncular yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [daysBack]);

  return { topPlayers, loading, error };
};
