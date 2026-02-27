import React, { useState, useEffect, useMemo } from 'react';
import { playerStatsApi } from '../../api/basketballApi';
import { Loading } from '../shared/Loading';
import type { Player } from '../../types/player.types';
import type { PlayerStats, Game } from '../../types/basketball.types';

interface PlayerTotalStatsTableProps {
  players: Player[];
  games: Game[];
}

type SortColumn =
  | 'gamesPlayed' | 'wins' | 'losses' | 'winPercentage'
  | 'totalPoints'
  | 'twoPointAttempts' | 'twoPointMade' | 'twoPointPercentage'
  | 'threePointAttempts' | 'threePointMade' | 'threePointPercentage'
  | 'totalRebounds' | 'offensiveRebounds' | 'defensiveRebounds'
  | 'assists';

type SortDirection = 'asc' | 'desc';

interface TotalPlayerStats {
  playerId: string;
  nickname: string;
  gamesPlayed: number;
  wins: number;
  losses: number;
  winPercentage: number;
  totalPoints: number;
  twoPointAttempts: number;
  twoPointMade: number;
  twoPointPercentage: number;
  threePointAttempts: number;
  threePointMade: number;
  threePointPercentage: number;
  totalRebounds: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
}

interface ColumnConfig {
  key: SortColumn;
  label: string;
  format: (s: TotalPlayerStats) => string;
}

const COLUMNS: ColumnConfig[] = [
  { key: 'gamesPlayed', label: 'Mac', format: (s) => s.gamesPlayed.toString() },
  { key: 'wins', label: 'W', format: (s) => s.wins.toString() },
  { key: 'losses', label: 'L', format: (s) => s.losses.toString() },
  { key: 'winPercentage', label: 'W%', format: (s) => `${s.winPercentage.toFixed(1)}%` },
  { key: 'totalPoints', label: 'Top. Sayi', format: (s) => s.totalPoints.toString() },
  { key: 'twoPointAttempts', label: '2PA', format: (s) => s.twoPointAttempts.toString() },
  { key: 'twoPointMade', label: '2PM', format: (s) => s.twoPointMade.toString() },
  { key: 'twoPointPercentage', label: '2P%', format: (s) => `${s.twoPointPercentage.toFixed(1)}%` },
  { key: 'threePointAttempts', label: '3PA', format: (s) => s.threePointAttempts.toString() },
  { key: 'threePointMade', label: '3PM', format: (s) => s.threePointMade.toString() },
  { key: 'threePointPercentage', label: '3P%', format: (s) => `${s.threePointPercentage.toFixed(1)}%` },
  { key: 'totalRebounds', label: 'REB', format: (s) => s.totalRebounds.toString() },
  { key: 'offensiveRebounds', label: 'OREB', format: (s) => s.offensiveRebounds.toString() },
  { key: 'defensiveRebounds', label: 'DREB', format: (s) => s.defensiveRebounds.toString() },
  { key: 'assists', label: 'AST', format: (s) => s.assists.toString() },
];

const getGameResult = (stat: PlayerStats, game: Game): 'win' | 'loss' => {
  const { teamAScore, teamBScore } = game;
  const playerTeam = stat.teamType;
  if (playerTeam === 'TEAM_A') {
    return teamAScore > teamBScore ? 'win' : 'loss';
  } else {
    return teamBScore > teamAScore ? 'win' : 'loss';
  }
};

export const PlayerTotalStatsTable: React.FC<PlayerTotalStatsTableProps> = ({ players, games }) => {
  const [totalStats, setTotalStats] = useState<TotalPlayerStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortColumn, setSortColumn] = useState<SortColumn>('totalPoints');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');

  useEffect(() => {
    const fetchStats = async () => {
      if (players.length === 0 || games.length === 0) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const gameMap = new Map<string, Game>(games.map(g => [g.id, g]));
        const playerIds = players.map(p => p.id);
        const bulkStats = await playerStatsApi.getBulkPlayerStats(playerIds);

        const aggregated: TotalPlayerStats[] = [];

        for (const player of players) {
          const playerStats = bulkStats[player.id] || [];
          if (playerStats.length === 0) continue;

          let wins = 0;
          let losses = 0;
          let totalPoints = 0;
          let twoPointAttempts = 0;
          let twoPointMade = 0;
          let threePointAttempts = 0;
          let threePointMade = 0;
          let totalRebounds = 0;
          let offensiveRebounds = 0;
          let defensiveRebounds = 0;
          let assists = 0;

          for (const stat of playerStats) {
            const game = gameMap.get(stat.gameId);
            if (!game) continue;

            const result = getGameResult(stat, game);
            if (result === 'win') wins++;
            else losses++;

            totalPoints += stat.totalPoints;
            twoPointAttempts += stat.twoPointAttempts;
            twoPointMade += stat.twoPointMade;
            threePointAttempts += stat.threePointAttempts;
            threePointMade += stat.threePointMade;
            totalRebounds += stat.totalRebounds;
            offensiveRebounds += stat.offensiveRebounds;
            defensiveRebounds += stat.defensiveRebounds;
            assists += stat.assists;
          }

          const gamesPlayed = wins + losses;

          aggregated.push({
            playerId: player.id,
            nickname: player.nickname,
            gamesPlayed,
            wins,
            losses,
            winPercentage: gamesPlayed > 0 ? (wins / gamesPlayed) * 100 : 0,
            totalPoints,
            twoPointAttempts,
            twoPointMade,
            twoPointPercentage: twoPointAttempts > 0 ? (twoPointMade / twoPointAttempts) * 100 : 0,
            threePointAttempts,
            threePointMade,
            threePointPercentage: threePointAttempts > 0 ? (threePointMade / threePointAttempts) * 100 : 0,
            totalRebounds,
            offensiveRebounds,
            defensiveRebounds,
            assists,
          });
        }

        setTotalStats(aggregated);
      } catch (err) {
        console.error('Toplam istatistikler yüklenirken hata:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [players, games]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'desc' ? 'asc' : 'desc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const sortedStats = useMemo(() => {
    const sorted = [...totalStats];
    const multiplier = sortDirection === 'asc' ? -1 : 1;
    return sorted.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      return multiplier * (aValue > bValue ? -1 : aValue < bValue ? 1 : 0);
    });
  }, [totalStats, sortColumn, sortDirection]);

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) return <span className="text-gray-400 ml-0.5 text-[10px]">⇅</span>;
    return sortDirection === 'desc'
      ? <span className="text-orange-500 ml-0.5 text-[10px]">↓</span>
      : <span className="text-orange-500 ml-0.5 text-[10px]">↑</span>;
  };

  const handleDownloadCSV = () => {
    const headers = ['#', 'Oyuncu', ...COLUMNS.map(c => c.label)];
    const rows = sortedStats.map((stat, index) => [
      index + 1,
      stat.nickname,
      ...COLUMNS.map(c => c.format(stat)),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'oyuncu-istatistikleri.csv';
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) return <Loading />;

  if (sortedStats.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <p className="text-gray-500">Henüz istatistik verisi bulunmuyor</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-gray-800">Toplam Oyuncu İstatistikleri</h2>
        <button
          onClick={handleDownloadCSV}
          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg font-medium transition-colors text-sm"
        >
          CSV İndir
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-200">
                <th className="sticky left-0 z-10 bg-gray-50 px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-8">
                  #
                </th>
                <th className="sticky left-8 z-10 bg-gray-50 px-3 py-3 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider min-w-[100px]">
                  Oyuncu
                </th>
                {COLUMNS.map((col) => (
                  <th
                    key={col.key}
                    onClick={() => handleSort(col.key)}
                    className={`px-3 py-3 text-center text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-all hover:bg-orange-50 select-none whitespace-nowrap ${
                      sortColumn === col.key ? 'text-orange-600 bg-orange-50' : 'text-gray-500'
                    }`}
                  >
                    <div className="flex items-center justify-center">
                      <span>{col.label}</span>
                      {getSortIcon(col.key)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sortedStats.map((stat, index) => (
                <tr
                  key={stat.playerId}
                  className="hover:bg-orange-50/50 transition-colors"
                >
                  <td className="sticky left-0 z-10 bg-white px-3 py-2.5 text-center text-sm font-semibold text-gray-400">
                    {index + 1}
                  </td>
                  <td className="sticky left-8 z-10 bg-white px-3 py-2.5">
                    <span className="text-sm font-bold text-gray-800">{stat.nickname}</span>
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`px-3 py-2.5 text-center text-xs font-medium whitespace-nowrap ${
                        sortColumn === col.key ? 'text-orange-600 bg-orange-50/30' : 'text-gray-700'
                      }`}
                    >
                      {col.format(stat)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-2 text-right">
        <span className="text-xs text-gray-400">
          {sortedStats.length} oyuncu
        </span>
      </div>
    </div>
  );
};
