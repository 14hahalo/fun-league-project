import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useSeasons } from '../hooks/useSeasons';
import { Loading } from '../components/shared/Loading';
import { playerStatsApi, gameApi } from '../api/basketballApi';
import { cache, CacheKeys } from '../utils/cache';
import type { Player } from '../types/player.types';
import type { PlayerStats, Game } from '../types/basketball.types';
import type { Season } from '../types/season.types';
import { PlayerRole } from '../types/player.types';
import { PlayerDetailsModal } from '../components/visitor/PlayerDetailsModal';

type SortColumn =
  | 'gamesPlayed' | 'wins' | 'losses' | 'winPercentage' | 'winStreak' | 'last5Wins'
  | 'avgPoints'
  | 'avg2PAttempts' | 'avg2PMade' | 'twoPointPercentage'
  | 'avg3PAttempts' | 'avg3PMade' | 'threePointPercentage'
  | 'avgRebounds' | 'avgOffRebounds' | 'avgDefRebounds'
  | 'avgAssists' | 'avgEfficiency';

type SortDirection = 'asc' | 'desc';

interface AggregatedPlayerStats {
  playerId: string;
  player: Player;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  winStreak: number;
  last5Wins: number;
  last5Losses: number;
  avgPoints: number;
  avg2PAttempts: number;
  avg2PMade: number;
  twoPointPercentage: number;
  avg3PAttempts: number;
  avg3PMade: number;
  threePointPercentage: number;
  avgRebounds: number;
  avgOffRebounds: number;
  avgDefRebounds: number;
  avgAssists: number;
  avgEfficiency: number;
}

interface ColumnConfig {
  key: SortColumn;
  label: string;
  shortLabel: string;
  format: (stat: AggregatedPlayerStats) => string | React.ReactNode;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'gamesPlayed', label: 'Maç', shortLabel: 'G', format: (s) => s.gamesPlayed.toString() },
  { key: 'wins', label: 'Win', shortLabel: 'W', format: (s) => s.wins.toString() },
  { key: 'losses', label: 'Lose', shortLabel: 'L', format: (s) => s.losses.toString() },
  { key: 'winPercentage', label: 'Win %', shortLabel: 'W%', format: (s) => `${s.winPercentage.toFixed(1)}%` },
  { key: 'winStreak', label: 'WS', shortLabel: 'WS', format: (s) => s.winStreak > 0 ? `🔥${s.winStreak}` : '-' },
  {
    key: 'last5Wins',
    label: 'Son 5 Maç',
    shortLabel: 'S5',
    format: (s) => (
      <span>
        <span className="text-green-400">{s.last5Wins}W</span>
        <span className="text-gray-500">-</span>
        <span className="text-red-400">{s.last5Losses}L</span>
      </span>
    )
  },
  { key: 'avgPoints', label: 'Ort. Sayı', shortLabel: 'PTS', format: (s) => s.avgPoints.toFixed(1) },
  { key: 'avg2PAttempts', label: 'Ort. 2PA', shortLabel: '2PA', format: (s) => s.avg2PAttempts.toFixed(1) },
  { key: 'avg2PMade', label: 'Ort. 2PM', shortLabel: '2PM', format: (s) => s.avg2PMade.toFixed(1) },
  { key: 'twoPointPercentage', label: '2P %', shortLabel: '2P%', format: (s) => `${s.twoPointPercentage.toFixed(1)}%` },
  { key: 'avg3PAttempts', label: 'Ort. 3PA', shortLabel: '3PA', format: (s) => s.avg3PAttempts.toFixed(1) },
  { key: 'avg3PMade', label: 'Ort. 3PM', shortLabel: '3PM', format: (s) => s.avg3PMade.toFixed(1) },
  { key: 'threePointPercentage', label: '3P %', shortLabel: '3P%', format: (s) => `${s.threePointPercentage.toFixed(1)}%` },
  { key: 'avgRebounds', label: 'Ort. Reb', shortLabel: 'REB', format: (s) => s.avgRebounds.toFixed(1) },
  { key: 'avgOffRebounds', label: 'Ort. OReb.', shortLabel: 'OREB', format: (s) => s.avgOffRebounds.toFixed(1) },
  { key: 'avgDefRebounds', label: 'Ort. DReb.', shortLabel: 'DREB', format: (s) => s.avgDefRebounds.toFixed(1) },
  { key: 'avgAssists', label: 'Ort. Ast', shortLabel: 'AST', format: (s) => s.avgAssists.toFixed(1) },
  { key: 'avgEfficiency', label: 'Ort. Eff', shortLabel: 'EFF', format: (s) => s.avgEfficiency.toFixed(1) },
];

export const StatisticsPage = () => {
  const { players: allPlayers, loading: playersLoading } = usePlayers(false);
  const { seasons, loading: seasonsLoading } = useSeasons();
  const [selectedSeasonId, setSelectedSeasonId] = useState<string | 'all'>('all');
  const [sortColumn, setSortColumn] = useState<SortColumn>('avgEfficiency');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [aggregatedStats, setAggregatedStats] = useState<AggregatedPlayerStats[]>([]);
  const [allGames, setAllGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);

  const players = useMemo(() =>
    allPlayers.filter(player =>
      player.isActive && (player.role === PlayerRole.PLAYER || !player.role)
    ),
    [allPlayers]
  );

  const initialSeasonSet = useRef(false);

  useEffect(() => {
    if (seasons.length > 0 && !initialSeasonSet.current) {
      const activeSeason = seasons.find(s => s.isActive);
      if (activeSeason) {
        setSelectedSeasonId(activeSeason.id);
      }
      initialSeasonSet.current = true;
    }
  }, [seasons]);

  const selectedSeason = useMemo(() => {
    if (selectedSeasonId === 'all') return null;
    return seasons.find(s => s.id === selectedSeasonId) || null;
  }, [seasons, selectedSeasonId]);

  const getGameResult = (stat: PlayerStats, game: Game): 'win' | 'loss' => {
    const { teamAScore, teamBScore } = game;
    const playerTeam = stat.teamType;

    if (playerTeam === 'TEAM_A') {
      return teamAScore > teamBScore ? 'win' : 'loss';
    } else {
      return teamBScore > teamAScore ? 'win' : 'loss';
    }
  };

  useEffect(() => {
    const fetchGames = async () => {
      try {
        cache.invalidate(CacheKeys.allGames());
        const games = await gameApi.getAllGames();
        setAllGames(games);
      } catch (err) {
        console.error('Maç detayları çekilirken bir hata oluştu:', err);
      }
    };
    fetchGames();
  }, []);

  useEffect(() => {
    const calculateStats = async () => {
      if (players.length === 0 || allGames.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        let filteredGames: Game[];
        if (selectedSeasonId === 'all') {
          filteredGames = allGames;
        } else {
          filteredGames = allGames.filter((game: Game) => game.seasonId === selectedSeasonId);
        }

        const gameMap = new Map<string, Game>(filteredGames.map((g: Game) => [g.id, g]));
        const filteredGameIds = new Set(filteredGames.map((g: Game) => g.id));

        const playerIds = players.map(p => p.id);
        const bulkStats = await playerStatsApi.getBulkPlayerStats(playerIds);

        const aggregated: AggregatedPlayerStats[] = [];

        for (const player of players) {
          const playerStats = bulkStats[player.id] || [];

          const seasonStats = playerStats.filter((stat: PlayerStats) => filteredGameIds.has(stat.gameId));

          if (seasonStats.length === 0) continue;

          const statsWithGames = seasonStats
            .map((stat: PlayerStats) => ({ stat, game: gameMap.get(stat.gameId)! }))
            .filter((item: { stat: PlayerStats; game: Game }) => item.game)
            .sort((a: { stat: PlayerStats; game: Game }, b: { stat: PlayerStats; game: Game }) =>
              new Date(b.game.date).getTime() - new Date(a.game.date).getTime()
            );

          let wins = 0;
          let losses = 0;
          let winStreak = 0;
          let streakBroken = false;

          for (const { stat, game } of statsWithGames) {
            const result = getGameResult(stat, game);
            if (result === 'win') {
              wins++;
              if (!streakBroken) winStreak++;
            } else {
              losses++;
              if (!streakBroken) streakBroken = true;
            }
          }

          const last5 = statsWithGames.slice(0, 5);
          const last5Wins = last5.filter(({ stat, game }: { stat: PlayerStats; game: Game }) => getGameResult(stat, game) === 'win').length;
          const last5Losses = last5.length - last5Wins;

          const totals = seasonStats.reduce(
            (acc: {
              points: number;
              twoPointAttempts: number;
              twoPointMade: number;
              threePointAttempts: number;
              threePointMade: number;
              rebounds: number;
              offRebounds: number;
              defRebounds: number;
              assists: number;
            }, stat: PlayerStats) => ({
              points: acc.points + stat.totalPoints,
              twoPointAttempts: acc.twoPointAttempts + stat.twoPointAttempts,
              twoPointMade: acc.twoPointMade + stat.twoPointMade,
              threePointAttempts: acc.threePointAttempts + stat.threePointAttempts,
              threePointMade: acc.threePointMade + stat.threePointMade,
              rebounds: acc.rebounds + stat.totalRebounds,
              offRebounds: acc.offRebounds + stat.offensiveRebounds,
              defRebounds: acc.defRebounds + stat.defensiveRebounds,
              assists: acc.assists + stat.assists,
            }),
            {
              points: 0,
              twoPointAttempts: 0,
              twoPointMade: 0,
              threePointAttempts: 0,
              threePointMade: 0,
              rebounds: 0,
              offRebounds: 0,
              defRebounds: 0,
              assists: 0,
            }
          );

          const gamesPlayed = seasonStats.length;

          aggregated.push({
            playerId: player.id,
            player,
            gamesPlayed,
            wins,
            losses,
            winPercentage: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
            winStreak,
            last5Wins,
            last5Losses,
            avgPoints: totals.points / gamesPlayed,
            avg2PAttempts: totals.twoPointAttempts / gamesPlayed,
            avg2PMade: totals.twoPointMade / gamesPlayed,
            twoPointPercentage: totals.twoPointAttempts > 0 ? (totals.twoPointMade / totals.twoPointAttempts) * 100 : 0,
            avg3PAttempts: totals.threePointAttempts / gamesPlayed,
            avg3PMade: totals.threePointMade / gamesPlayed,
            threePointPercentage: totals.threePointAttempts > 0 ? (totals.threePointMade / totals.threePointAttempts) * 100 : 0,
            avgRebounds: totals.rebounds / gamesPlayed,
            avgOffRebounds: totals.offRebounds / gamesPlayed,
            avgDefRebounds: totals.defRebounds / gamesPlayed,
            avgAssists: totals.assists / gamesPlayed,
            avgEfficiency: (totals.points + totals.rebounds + totals.assists -
              ((totals.twoPointAttempts - totals.twoPointMade) + (totals.threePointAttempts - totals.threePointMade))) / gamesPlayed,
          });
        }

        setAggregatedStats(aggregated);
      } catch (err) {
        console.error('Sezon istatistikleri görüntülenirken bir hata oluştu:', err);
      } finally {
        setLoading(false);
      }
    };

    calculateStats();
  }, [selectedSeasonId, players, allGames]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedStats = useMemo(() => {
    const sorted = [...aggregatedStats];
    const multiplier = sortDirection === 'asc' ? -1 : 1;

    return sorted.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      return multiplier * (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    });
  }, [aggregatedStats, sortColumn, sortDirection]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <span className="text-gray-600 ml-0.5 text-[10px]">⇅</span>;
    }
    return sortDirection === 'desc'
      ? <span className="text-orange-400 ml-0.5 text-[10px]">↓</span>
      : <span className="text-orange-400 ml-0.5 text-[10px]">↑</span>;
  };

  if (playersLoading || seasonsLoading) return <Loading />;

  return (
    <div className="min-h-screen py-6 md:py-10 px-2 md:px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-6 md:mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-cyan-400 mb-3 tracking-tight">
            İstatistikler
          </h1>
        </div>

        <div className="mb-6 flex justify-center">
          <div className="relative p-[1px] rounded-xl bg-gradient-to-r from-orange-500 to-amber-500">
            <div className="bg-gray-900 rounded-xl px-4 py-3 flex items-center gap-3">
              <label className="text-sm font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                Sezon:
              </label>
              <select
                value={selectedSeasonId}
                onChange={(e) => setSelectedSeasonId(e.target.value)}
                className="bg-gray-800 text-white border border-gray-700 rounded-lg px-4 py-2 text-sm font-semibold focus:outline-none focus:border-orange-500 cursor-pointer min-w-[180px]"
              >
                <option key="all" value="all">Tüm Zamanlar</option>
                {[...seasons]
                  .sort((a, b) => new Date(b.beginDate).getTime() - new Date(a.beginDate).getTime())
                  .map((season: Season) => (
                    <option key={season.id} value={season.id}>
                      {season.name} {season.isActive ? '(Aktif)' : ''}
                    </option>
                  ))}
              </select>
            </div>
          </div>
        </div>

        <div className="text-center mb-6">
          <span className="text-xs uppercase tracking-widest font-bold text-orange-300">
            {selectedSeason ? `Sezon ${selectedSeason.name}` : 'Tüm Zamanlar'}
          </span>
        </div>

        {loading ? (
          <Loading />
        ) : sortedStats.length === 0 ? (
          <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
            <div className="text-6xl mb-4">📊</div>
            <p className="text-xl text-gray-400">
              {selectedSeason
                ? `"${selectedSeason.name}" sezonu için istatistik bulunmuyor`
                : 'İstatistik bulunmuyor'}
            </p>
            <p className="text-sm text-gray-500 mt-2">
              Maçların sezon bilgisi atanmamış olabilir veya henüz maç oynanmamış.
            </p>
          </div>
        ) : (
          <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-cyan-500">
            <div className="bg-gray-900 rounded-xl overflow-hidden">
              <div className="overflow-x-auto custom-scrollbar">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-gray-800/80 border-b border-gray-700">
                      <th className="sticky left-0 z-10 bg-gray-800 px-2 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider w-8">
                        #
                      </th>
                      <th className="sticky left-8 z-10 bg-gray-800 px-2 py-3 text-left text-[10px] font-bold text-gray-400 uppercase tracking-wider min-w-[120px]">
                        Oyuncu
                      </th>
                      {COLUMNS.map((col) => (
                        <th
                          key={col.key}
                          onClick={() => handleSort(col.key)}
                          className={`px-2 py-3 text-center text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-orange-500/10 select-none whitespace-nowrap ${
                            sortColumn === col.key ? 'text-orange-400 bg-orange-500/10' : 'text-gray-400'
                          }`}
                        >
                          <div className="flex items-center justify-center">
                            <span className="hidden lg:inline">{col.label}</span>
                            <span className="lg:hidden">{col.shortLabel}</span>
                            {getSortIcon(col.key)}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-800/50">
                    {sortedStats.map((stat, index) => {
                      const rank = index + 1;
                      return (
                        <tr
                          key={stat.playerId}
                          onClick={() => setSelectedPlayer(stat.player)}
                          className={`cursor-pointer transition-all hover:bg-orange-500/10 ${
                            rank <= 3 ? 'bg-orange-500/5' : ''
                          }`}
                        >
                          <td className="sticky left-0 z-10 bg-gray-900 px-2 py-2.5 text-center">
                            <span className={`text-sm font-black ${
                              rank === 1 ? 'text-yellow-400' :
                              rank === 2 ? 'text-gray-300' :
                              rank === 3 ? 'text-orange-400' :
                              'text-gray-600'
                            }`}>
                              {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : rank}
                            </span>
                          </td>

                          <td className="sticky left-8 z-10 bg-gray-900 px-2 py-2.5">
                            <div className="flex items-center gap-2">
                              <div className={`w-8 h-8 rounded-md bg-gradient-to-br ${
                                rank === 1 ? 'from-yellow-400 to-amber-600' :
                                rank === 2 ? 'from-gray-300 to-gray-500' :
                                rank === 3 ? 'from-orange-400 to-orange-700' :
                                'from-gray-700 to-gray-800'
                              } p-0.5 flex-shrink-0`}>
                                <div className="w-full h-full rounded bg-gray-800 flex items-center justify-center overflow-hidden">
                                  {stat.player.photoUrl ? (
                                    <img src={stat.player.photoUrl} alt={stat.player.nickname} className="w-full h-full object-cover" />
                                  ) : (
                                    <span className="text-xs font-bold text-gray-400">{stat.player.nickname.charAt(0)}</span>
                                  )}
                                </div>
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-white truncate max-w-[80px]">{stat.player.nickname}</div>
                                <div className="text-[9px] text-gray-500">{stat.player.position || '-'}</div>
                              </div>
                            </div>
                          </td>

                          {COLUMNS.map((col) => (
                            <td
                              key={col.key}
                              className={`px-2 py-2.5 text-center text-xs font-medium whitespace-nowrap ${
                                sortColumn === col.key ? 'text-orange-400 bg-orange-500/5' : 'text-gray-300'
                              }`}
                            >
                              {col.format(stat)}
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {!loading && sortedStats.length > 0 && (
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-500">
              {sortedStats.length} oyuncu | Sıralama: <span className="text-orange-400">{COLUMNS.find(c => c.key === sortColumn)?.label}</span>
              {sortDirection === 'desc' ? ' ↓' : ' ↑'}
            </p>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <PlayerDetailsModal player={selectedPlayer} onClose={() => setSelectedPlayer(null)} />
      )}
    </div>
  );
};
