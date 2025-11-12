import { useState } from 'react';
import type { MatchMetadata, TeamPlayers, PlayerStatsInput } from './AddMatchStatsModal';

interface StatsEntryFormProps {
  teamPlayers: TeamPlayers;
  metadata: MatchMetadata;
  initialStats?: PlayerStatsInput[];
  onComplete: (playerStats: PlayerStatsInput[]) => void;
  onBack: () => void;
}

interface StatsRow {
  playerId: string;
  playerNickname: string;
  teamType: 'TEAM_A' | 'TEAM_B';
  twoPointAttempts: string;
  twoPointMade: string;
  threePointAttempts: string;
  threePointMade: string;
  offensiveRebounds: string;
  defensiveRebounds: string;
  assists: string;
}

export const StatsEntryForm = ({
  teamPlayers,
  metadata,
  initialStats,
  onComplete,
  onBack,
}: StatsEntryFormProps) => {
  const [expandedTeam, setExpandedTeam] = useState<'A' | 'B' | 'both'>('both');

  // Initialize stats for all players
  const initializeStats = (): StatsRow[] => {
    // If we have initial stats (edit mode), use them
    if (initialStats && initialStats.length > 0) {
      return initialStats.map((stat) => ({
        playerId: stat.playerId,
        playerNickname: stat.playerNickname,
        teamType: stat.teamType,
        twoPointAttempts: String(stat.twoPointAttempts),
        twoPointMade: String(stat.twoPointMade),
        threePointAttempts: String(stat.threePointAttempts),
        threePointMade: String(stat.threePointMade),
        offensiveRebounds: String(stat.offensiveRebounds),
        defensiveRebounds: String(stat.defensiveRebounds),
        assists: String(stat.assists),
      }));
    }

    // Otherwise initialize with zeros (create mode)
    const teamAStats: StatsRow[] = teamPlayers.teamA.map((player) => ({
      playerId: player.id,
      playerNickname: player.nickname,
      teamType: 'TEAM_A',
      twoPointAttempts: '0',
      twoPointMade: '0',
      threePointAttempts: '0',
      threePointMade: '0',
      offensiveRebounds: '0',
      defensiveRebounds: '0',
      assists: '0',
    }));

    const teamBStats: StatsRow[] = teamPlayers.teamB.map((player) => ({
      playerId: player.id,
      playerNickname: player.nickname,
      teamType: 'TEAM_B',
      twoPointAttempts: '0',
      twoPointMade: '0',
      threePointAttempts: '0',
      threePointMade: '0',
      offensiveRebounds: '0',
      defensiveRebounds: '0',
      assists: '0',
    }));

    return [...teamAStats, ...teamBStats];
  };

  const [stats, setStats] = useState<StatsRow[]>(initializeStats());

  const updateStat = (
    playerId: string,
    field: keyof Omit<StatsRow, 'playerId' | 'playerNickname' | 'teamType'>,
    value: string
  ) => {
    setStats(
      stats.map((stat) =>
        stat.playerId === playerId ? { ...stat, [field]: value } : stat
      )
    );
  };

  const isValidNumber = (value: string): boolean => {
    return /^\d+$/.test(value) && parseInt(value) >= 0;
  };

  const isFormValid = (): boolean => {
    return stats.every((stat) => {
      return (
        isValidNumber(stat.twoPointAttempts) &&
        isValidNumber(stat.twoPointMade) &&
        isValidNumber(stat.threePointAttempts) &&
        isValidNumber(stat.threePointMade) &&
        isValidNumber(stat.offensiveRebounds) &&
        isValidNumber(stat.defensiveRebounds) &&
        isValidNumber(stat.assists)
      );
    });
  };

  const handleSubmit = () => {
    if (!isFormValid()) return;

    const playerStats: PlayerStatsInput[] = stats.map((stat) => ({
      playerId: stat.playerId,
      playerNickname: stat.playerNickname,
      teamType: stat.teamType,
      twoPointAttempts: parseInt(stat.twoPointAttempts),
      twoPointMade: parseInt(stat.twoPointMade),
      threePointAttempts: parseInt(stat.threePointAttempts),
      threePointMade: parseInt(stat.threePointMade),
      offensiveRebounds: parseInt(stat.offensiveRebounds),
      defensiveRebounds: parseInt(stat.defensiveRebounds),
      assists: parseInt(stat.assists),
    }));

    onComplete(playerStats);
  };

  const toggleTeam = (team: 'A' | 'B') => {
    if (expandedTeam === 'both') {
      setExpandedTeam(team);
    } else if (expandedTeam === team) {
      setExpandedTeam('both');
    } else {
      setExpandedTeam('both');
    }
  };

  const renderStatsInput = (stat: StatsRow) => (
    <tr key={stat.playerId} className="bg-white border-b border-gray-200 hover:bg-gray-50">
      <td className="px-4 py-3">
        <div className="pl-8 font-medium text-gray-700">{stat.playerNickname}</div>
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.twoPointAttempts}
          onChange={(e) => updateStat(stat.playerId, 'twoPointAttempts', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.twoPointMade}
          onChange={(e) => updateStat(stat.playerId, 'twoPointMade', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.threePointAttempts}
          onChange={(e) => updateStat(stat.playerId, 'threePointAttempts', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.threePointMade}
          onChange={(e) => updateStat(stat.playerId, 'threePointMade', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.offensiveRebounds}
          onChange={(e) => updateStat(stat.playerId, 'offensiveRebounds', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.defensiveRebounds}
          onChange={(e) => updateStat(stat.playerId, 'defensiveRebounds', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
      <td className="px-2 py-3">
        <input
          type="number"
          min="0"
          value={stat.assists}
          onChange={(e) => updateStat(stat.playerId, 'assists', e.target.value)}
          className="w-16 px-2 py-1 border border-gray-300 rounded text-center focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </td>
    </tr>
  );

  const teamAStats = stats.filter((s) => s.teamType === 'TEAM_A');
  const teamBStats = stats.filter((s) => s.teamType === 'TEAM_B');

  return (
    <div className="space-y-6">
      {/* Match Info Summary */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <h3 className="text-lg font-semibold mb-2 text-gray-800">Maç Bilgileri</h3>
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <span className="text-gray-600">Maç No:</span>{' '}
            <span className="font-medium">{metadata.gameNumber}</span>
          </div>
          <div>
            <span className="text-gray-600">Tarih:</span>{' '}
            <span className="font-medium">{metadata.date}</span>
          </div>
          {metadata.notes && (
            <div>
              <span className="text-gray-600">Not:</span>{' '}
              <span className="font-medium">{metadata.notes}</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Entry Table */}
      <div className="overflow-x-auto border border-gray-300 rounded-lg">
        <table className="w-full">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                Oyuncu
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                2PA
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                2PM
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                3PA
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                3PM
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                OFFREB
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                DEFREB
              </th>
              <th className="px-2 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider">
                AST
              </th>
            </tr>
          </thead>
          <tbody>
            {/* Team A */}
            <tr
              onClick={() => toggleTeam('A')}
              className="bg-orange-500 text-white cursor-pointer hover:bg-orange-600"
            >
              <td colSpan={8} className="px-4 py-3 font-bold flex items-center">
                <span className="mr-2">
                  {expandedTeam === 'A' || expandedTeam === 'both' ? '▼' : '▶'}
                </span>
                Takım A
              </td>
            </tr>
            {(expandedTeam === 'A' || expandedTeam === 'both') &&
              teamAStats.map((stat) => renderStatsInput(stat))}

            {/* Team B */}
            <tr
              onClick={() => toggleTeam('B')}
              className="bg-blue-500 text-white cursor-pointer hover:bg-blue-600"
            >
              <td colSpan={8} className="px-4 py-3 font-bold flex items-center">
                <span className="mr-2">
                  {expandedTeam === 'B' || expandedTeam === 'both' ? '▼' : '▶'}
                </span>
                Takım B
              </td>
            </tr>
            {(expandedTeam === 'B' || expandedTeam === 'both') &&
              teamBStats.map((stat) => renderStatsInput(stat))}
          </tbody>
        </table>
      </div>

      {/* Legend */}
      <div className="bg-blue-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-2 text-gray-800">Kısaltmalar:</h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700">
          <div>
            <span className="font-medium">2PA:</span> 2 Sayılık Atış Denemesi
          </div>
          <div>
            <span className="font-medium">2PM:</span> 2 Sayılık Basket
          </div>
          <div>
            <span className="font-medium">3PA:</span> 3 Sayılık Atış Denemesi
          </div>
          <div>
            <span className="font-medium">3PM:</span> 3 Sayılık Basket
          </div>
          <div>
            <span className="font-medium">OFFREB:</span> Hücum Ribaundu
          </div>
          <div>
            <span className="font-medium">DEFREB:</span> Savunma Ribaundu
          </div>
          <div>
            <span className="font-medium">AST:</span> Asist
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          ← Geri
        </button>
        <button
          onClick={handleSubmit}
          disabled={!isFormValid()}
          className={`px-6 py-2 rounded-md transition-colors ${
            isFormValid()
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          Kaydet ve Tamamla
        </button>
      </div>
    </div>
  );
};
