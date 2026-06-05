import { useState, useEffect } from 'react';
import { gameApi } from '../api/gameApi';
import { playerStatsApi } from '../api/playerStatsApi';
import { playerApi } from '../api/playerApi';
import type { PlayerStats, Game } from '../types/basketball.types';
import { PlayerRole } from '../types/player.types';

export interface SingleGameRecord {
  playerName: string;
  value: number;
  matchWeek: string;
}

export interface DoubleDoubleRecord {
  playerName: string;
  count: number;
}

export interface SeasonGameLeaders {
  topPoints: SingleGameRecord[];
  topRebounds: SingleGameRecord[];
  topAssists: SingleGameRecord[];
  topThreePointMade: SingleGameRecord[];
  topEfficiency: SingleGameRecord[];
  doubleDoubles: DoubleDoubleRecord[];
}

const formatMatchWeek = (gameNumber: string) => gameNumber.replace('#', '');

export const useSeasonGameLeaders = (seasonId: string | null) => {
  const [leaders, setLeaders] = useState<SeasonGameLeaders>({
    topPoints: [],
    topRebounds: [],
    topAssists: [],
    topThreePointMade: [],
    topEfficiency: [],
    doubleDoubles: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!seasonId) {
      setLoading(false);
      return;
    }

    const fetchLeaders = async () => {
      try {
        setLoading(true);
        setError(null);

        const [allGames, players] = await Promise.all([
          gameApi.getAllGames(),
          playerApi.getAllPlayers(),
        ]);

        const seasonGames = allGames.filter((g: Game) => g.seasonId === seasonId && g.countInStats !== false);
        const gameMap = new Map<string, string>(
          seasonGames.map((g: Game) => [g.id, formatMatchWeek(g.gameNumber)])
        );

        const activePlayers = players.filter(
          (p) => p.isActive && (p.role === PlayerRole.PLAYER || !p.role)
        );
        const playerNameMap = new Map<string, string>(
          activePlayers.map((p) => [p.id, p.nickname])
        );

        const bulkStats = await playerStatsApi.getBulkPlayerStats(
          activePlayers.map((p) => p.id)
        );

        interface StatEntry {
          playerName: string;
          value: number;
          matchWeek: string;
        }

        const points: StatEntry[] = [];
        const rebounds: StatEntry[] = [];
        const assists: StatEntry[] = [];
        const threePointMade: StatEntry[] = [];
        const efficiency: StatEntry[] = [];
        const ddMap = new Map<string, { playerName: string; count: number }>();

        for (const player of activePlayers) {
          const name = playerNameMap.get(player.id) ?? player.id;
          const seasonStats = (bulkStats[player.id] ?? []).filter((s: PlayerStats) =>
            gameMap.has(s.gameId)
          );

          for (const stat of seasonStats) {
            const matchWeek = gameMap.get(stat.gameId) ?? '';
            points.push({ playerName: name, value: stat.totalPoints, matchWeek });
            rebounds.push({ playerName: name, value: stat.totalRebounds, matchWeek });
            assists.push({ playerName: name, value: stat.assists, matchWeek });
            threePointMade.push({ playerName: name, value: stat.threePointMade, matchWeek });

            const eff =
              2 * stat.twoPointMade +
              3 * stat.threePointMade +
              1.5 * stat.assists +
              0.8 * stat.defensiveRebounds +
              1.2 * stat.offensiveRebounds -
              0.8 * (stat.twoPointAttempts - stat.twoPointMade) -
              1.2 * (stat.threePointAttempts - stat.threePointMade);
            efficiency.push({ playerName: name, value: Math.round(eff * 10) / 10, matchWeek });

            const ddCats = [stat.totalPoints >= 10, stat.totalRebounds >= 10, stat.assists >= 10];
            if (ddCats.filter(Boolean).length >= 2) {
              const entry = ddMap.get(player.id) ?? { playerName: name, count: 0 };
              entry.count += 1;
              ddMap.set(player.id, entry);
            }
          }
        }

        const sortAndSlice = (arr: StatEntry[], n = 5) =>
          [...arr].sort((a, b) => b.value - a.value).slice(0, n);

        const doubleDoubles = [...ddMap.values()]
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setLeaders({
          topPoints: sortAndSlice(points),
          topRebounds: sortAndSlice(rebounds),
          topAssists: sortAndSlice(assists),
          topThreePointMade: sortAndSlice(threePointMade),
          topEfficiency: sortAndSlice(efficiency),
          doubleDoubles,
        });
      } catch (err: any) {
        setError(err.message ?? 'Sezon lider tabloları yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchLeaders();
  }, [seasonId]);

  return { leaders, loading, error };
};
