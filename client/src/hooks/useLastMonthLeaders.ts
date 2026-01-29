import { useState, useEffect } from 'react';
import { playerStatsApi } from '../api/playerStatsApi';
import { playerApi } from '../api/playerApi';

export interface StatLeader {
  playerId: string;
  playerNickname?: string;
  playerPhotoUrl?: string;
  playerPosition?: string;
  playerJerseyNumber?: number;
  totalPoints?: number;
  totalRebounds?: number;
  totalAssists?: number;
  twoPointMade?: number;
  twoPointAttempts?: number;
  threePointMade?: number;
  threePointAttempts?: number;
  shootingPercentage?: number;
  twoPointPercentage?: number;
  threePointPercentage?: number;
  efficiency?: number;
  gamesPlayed?: number;
}

export interface MonthlyLeaders {
  firstEfficient: StatLeader | null;
  secondEfficient: StatLeader | null;
  thirdEfficient: StatLeader | null;
  mostPoints: StatLeader | null;
  mostRebounds: StatLeader | null;
  mostAssists: StatLeader | null;
  dominant2PP: StatLeader | null;
  dominant3PP: StatLeader | null;
}

const getLastMonthDays = (): number => {
  const now = new Date();
  const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const daysBack = Math.ceil((now.getTime() - firstDayLastMonth.getTime()) / (1000 * 60 * 60 * 24));
  return daysBack;
};

export const useLastMonthLeaders = () => {
  const [leaders, setLeaders] = useState<MonthlyLeaders>({
    firstEfficient: null,
    secondEfficient: null,
    thirdEfficient: null,
    mostPoints: null,
    mostRebounds: null,
    mostAssists: null,
    dominant2PP: null,
    dominant3PP: null,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [monthName, setMonthName] = useState('');

  useEffect(() => {
    const fetchLeaders = async () => {
      try {
        setLoading(true);
        setError(null);

        const now = new Date();
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const monthNames = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
                           'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
        setMonthName(monthNames[lastMonth.getMonth()]);

        const firstDayThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const lastDayLastMonth = new Date(firstDayThisMonth.getTime() - 1);
        lastDayLastMonth.setHours(23, 59, 59, 999);

        const daysBack = getLastMonthDays();
        const data = await playerStatsApi.getTopPlayers(daysBack, lastDayLastMonth);

        const players = await playerApi.getAllPlayers();

        const enrichPlayerData = (statsData: any): StatLeader | null => {
          if (!statsData) return null;

          const player = players.find(p => p.id === statsData.playerId);

          const twoPointPct = statsData.twoPointAttempts > 0
            ? (statsData.twoPointMade / statsData.twoPointAttempts) * 100
            : 0;

          const threePointPct = statsData.threePointAttempts > 0
            ? (statsData.threePointMade / statsData.threePointAttempts) * 100
            : 0;

          const totalShots = statsData.twoPointAttempts + statsData.threePointAttempts;
          const shootingPct = totalShots > 0
            ? ((statsData.twoPointMade + statsData.threePointMade) / totalShots) * 100
            : 0;

          const gamesPlayed = statsData.gamesPlayed || 1;
          const avgDefReb = (statsData.totalRebounds * 0.6) / gamesPlayed;
          const avgOffReb = (statsData.totalRebounds * 0.4) / gamesPlayed;
          const avg2PMade = statsData.twoPointMade / gamesPlayed;
          const avg3PMade = statsData.threePointMade / gamesPlayed;
          const avgAssists = statsData.totalAssists / gamesPlayed;
          const avg2PMissed = (statsData.twoPointAttempts - statsData.twoPointMade) / gamesPlayed;
          const avg3PMissed = (statsData.threePointAttempts - statsData.threePointMade) / gamesPlayed;

          const avgEfficiency =
            2 * avg2PMade +
            3 * avg3PMade +
            1.5 * avgAssists +
            0.8 * avgDefReb +
            1.2 * avgOffReb -
            (0.8 * avg2PMissed + 1.2 * avg3PMissed);

          return {
            playerId: statsData.playerId,
            playerNickname: player?.nickname,
            playerPhotoUrl: player?.photoUrl,
            playerPosition: player?.position,
            playerJerseyNumber: player?.jerseyNumber,
            totalPoints: statsData.totalPoints,
            totalRebounds: statsData.totalRebounds,
            totalAssists: statsData.totalAssists,
            twoPointMade: statsData.twoPointMade,
            twoPointAttempts: statsData.twoPointAttempts,
            threePointMade: statsData.threePointMade,
            threePointAttempts: statsData.threePointAttempts,
            shootingPercentage: shootingPct,
            twoPointPercentage: twoPointPct,
            threePointPercentage: threePointPct,
            efficiency: Math.round(avgEfficiency * 10) / 10,
            gamesPlayed: statsData.gamesPlayed,
          };
        };

        const enrichedData = {
          topScorer: enrichPlayerData(data.topScorer),
          bestShooter: enrichPlayerData(data.bestShooter),
          mostRebounds: enrichPlayerData(data.mostRebounds),
          mostAssists: enrichPlayerData(data.mostAssists),
        };

        const allPlayersEnriched = (data.allPlayerAggregates || [])
          .map((aggregate: any) => enrichPlayerData(aggregate))
          .filter(Boolean) as StatLeader[];

        const sortedByEfficiency = [...allPlayersEnriched].sort((a, b) =>
          (b.efficiency || 0) - (a.efficiency || 0)
        );

        const sortedBy2P = [...allPlayersEnriched]
          .filter(p => (p.twoPointAttempts || 0) >= 5)
          .sort((a, b) => (b.twoPointPercentage || 0) - (a.twoPointPercentage || 0));

        const sortedBy3P = [...allPlayersEnriched]
          .filter(p => (p.threePointAttempts || 0) >= 5)
          .sort((a, b) => (b.threePointPercentage || 0) - (a.threePointPercentage || 0));

        setLeaders({
          firstEfficient: sortedByEfficiency[0] || null,
          secondEfficient: sortedByEfficiency[1] || null,
          thirdEfficient: sortedByEfficiency[2] || null,
          mostPoints: enrichedData.topScorer,
          mostRebounds: enrichedData.mostRebounds,
          mostAssists: enrichedData.mostAssists,
          dominant2PP: sortedBy2P[0] || null,
          dominant3PP: sortedBy3P[0] || null,
        });
      } catch (err: any) {
        setError(err.message || 'Liderler yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, []);

  return { leaders, loading, error, monthName };
};
