import { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { playerStatsApi } from '../api/playerStatsApi';
import { playerApi } from '../api/playerApi';
import type { MonthlyLeaders, StatLeader } from './useLastMonthLeaders';
import type { PlayerStats, Game } from '../types/basketball.types';
import { PlayerRole } from '../types/player.types';

export const useSeasonAwards = (seasonId: string | null) => {
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

  useEffect(() => {
    if (!seasonId) {
      setLoading(false);
      return;
    }

    const fetchAwards = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allGames, players] = await Promise.all([
          gameApi.getAllGames(),
          playerApi.getAllPlayers(),
        ]);

        const seasonGames = allGames.filter((g: Game) => g.seasonId === seasonId && g.countInStats !== false);
        const seasonGameIds = new Set(seasonGames.map((g: Game) => g.id));

        const activePlayers = players.filter(
          (p) => p.isActive && (p.role === PlayerRole.PLAYER || !p.role)
        );
        const playerIds = activePlayers.map((p) => p.id);
        const bulkStats = await playerStatsApi.getBulkPlayerStats(playerIds);

        interface PlayerAggregate {
          playerId: string;
          playerNickname?: string;
          playerPhotoUrl?: string;
          playerPosition?: string;
          playerJerseyNumber?: number;
          gamesPlayed: number;
          totalPoints: number;
          totalRebounds: number;
          totalAssists: number;
          twoPointMade: number;
          twoPointAttempts: number;
          threePointMade: number;
          threePointAttempts: number;
        }

        const aggregates: PlayerAggregate[] = [];

        for (const player of activePlayers) {
          const seasonStats = (bulkStats[player.id] || []).filter((s: PlayerStats) =>
            seasonGameIds.has(s.gameId)
          );
          if (seasonStats.length === 0) continue;

          const totals = seasonStats.reduce(
            (acc, stat: PlayerStats) => ({
              totalPoints: acc.totalPoints + stat.totalPoints,
              totalRebounds: acc.totalRebounds + stat.totalRebounds,
              totalAssists: acc.totalAssists + stat.assists,
              twoPointMade: acc.twoPointMade + stat.twoPointMade,
              twoPointAttempts: acc.twoPointAttempts + stat.twoPointAttempts,
              threePointMade: acc.threePointMade + stat.threePointMade,
              threePointAttempts: acc.threePointAttempts + stat.threePointAttempts,
            }),
            {
              totalPoints: 0,
              totalRebounds: 0,
              totalAssists: 0,
              twoPointMade: 0,
              twoPointAttempts: 0,
              threePointMade: 0,
              threePointAttempts: 0,
            }
          );

          aggregates.push({
            playerId: player.id,
            playerNickname: player.nickname,
            playerPhotoUrl: player.photoUrl,
            playerPosition: player.position,
            playerJerseyNumber: player.jerseyNumber,
            gamesPlayed: seasonStats.length,
            ...totals,
          });
        }

        const toStatLeader = (agg: PlayerAggregate): StatLeader => {
          const gp = agg.gamesPlayed || 1;
          const twoPointPct =
            agg.twoPointAttempts > 0 ? (agg.twoPointMade / agg.twoPointAttempts) * 100 : 0;
          const threePointPct =
            agg.threePointAttempts > 0 ? (agg.threePointMade / agg.threePointAttempts) * 100 : 0;

          const avg2PMade = agg.twoPointMade / gp;
          const avg3PMade = agg.threePointMade / gp;
          const avgAssists = agg.totalAssists / gp;
          const avgDefReb = (agg.totalRebounds * 0.6) / gp;
          const avgOffReb = (agg.totalRebounds * 0.4) / gp;
          const avg2PMissed = (agg.twoPointAttempts - agg.twoPointMade) / gp;
          const avg3PMissed = (agg.threePointAttempts - agg.threePointMade) / gp;

          const efficiency =
            2 * avg2PMade +
            3 * avg3PMade +
            1.5 * avgAssists +
            0.8 * avgDefReb +
            1.2 * avgOffReb -
            (0.8 * avg2PMissed + 1.2 * avg3PMissed);

          return {
            playerId: agg.playerId,
            playerNickname: agg.playerNickname,
            playerPhotoUrl: agg.playerPhotoUrl,
            playerPosition: agg.playerPosition,
            playerJerseyNumber: agg.playerJerseyNumber,
            totalPoints: agg.totalPoints,
            totalRebounds: agg.totalRebounds,
            totalAssists: agg.totalAssists,
            twoPointMade: agg.twoPointMade,
            twoPointAttempts: agg.twoPointAttempts,
            threePointMade: agg.threePointMade,
            threePointAttempts: agg.threePointAttempts,
            twoPointPercentage: twoPointPct,
            threePointPercentage: threePointPct,
            efficiency: Math.round(efficiency * 10) / 10,
            gamesPlayed: agg.gamesPlayed,
          };
        };

        const statLeaders = aggregates.map(toStatLeader);

        const byEfficiency = [...statLeaders].sort((a, b) => (b.efficiency || 0) - (a.efficiency || 0));
        const byPoints = [...statLeaders].sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0));
        const byRebounds = [...statLeaders].sort((a, b) => (b.totalRebounds || 0) - (a.totalRebounds || 0));
        const byAssists = [...statLeaders].sort((a, b) => (b.totalAssists || 0) - (a.totalAssists || 0));
        const by2P = [...statLeaders]
          .filter((p) => (p.twoPointAttempts || 0) >= 5)
          .sort((a, b) => (b.twoPointPercentage || 0) - (a.twoPointPercentage || 0));
        const by3P = [...statLeaders]
          .filter((p) => (p.threePointAttempts || 0) >= 5)
          .sort((a, b) => (b.threePointPercentage || 0) - (a.threePointPercentage || 0));

        setLeaders({
          firstEfficient: byEfficiency[0] || null,
          secondEfficient: byEfficiency[1] || null,
          thirdEfficient: byEfficiency[2] || null,
          mostPoints: byPoints[0] || null,
          mostRebounds: byRebounds[0] || null,
          mostAssists: byAssists[0] || null,
          dominant2PP: by2P[0] || null,
          dominant3PP: by3P[0] || null,
        });
      } catch (err: any) {
        setError(err.message || 'Sezon ödülleri yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchAwards();
  }, [seasonId]);

  return { leaders, loading, error };
};
