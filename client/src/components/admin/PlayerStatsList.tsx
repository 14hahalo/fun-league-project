import type { PlayerStats } from '../../types/basketball.types';
import type { Player } from '../../types/player.types';
import type { Game } from '../../types/basketball.types';

interface PlayerStatsListProps {
  playerStats: PlayerStats[];
  players: Player[];
  games: Game[];
  onEdit: (stats: PlayerStats) => void;
  onDelete: (id: string) => void;
}

export const PlayerStatsList = ({ playerStats, players, games, onEdit, onDelete }: PlayerStatsListProps) => {
  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    return player ? `#${player.jerseyNumber} ${player.firstName} ${player.lastName}` : 'Bilinmiyor Player';
  };

  const getGameInfo = (gameId: string) => {
    const game = games.find((g) => g.id === gameId);
    return game ? `Maç #${game.gameNumber} - ${new Date(game.date).toLocaleDateString('tr-TR')}` : 'Bilinmiyor Game';
  };

  return (
    <div className="overflow-x-auto">
      {playerStats.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Henüz oyuncu istatistiği bulunmuyor</p>
        </div>
      ) : (
        <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">Oyuncu</th>
              <th className="px-4 py-3 text-left text-sm font-semibold">Maç</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Takım</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">Puan</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">2P</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">3P</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">REB</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">AST</th>
              <th className="px-4 py-3 text-center text-sm font-semibold">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {playerStats.map((stats) => (
              <tr key={stats.id} className="hover:bg-orange-50 transition-colors">
                <td className="px-4 py-3 text-sm font-medium text-gray-900">
                  {getPlayerName(stats.playerId)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-600">{getGameInfo(stats.gameId)}</td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      stats.teamType === 'TEAM_A'
                        ? 'bg-blue-100 text-blue-800'
                        : 'bg-green-100 text-green-800'
                    }`}
                  >
                    {stats.teamType === 'TEAM_A' ? 'Team A' : 'Team B'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-sm font-bold text-orange-600">
                  {stats.totalPoints}
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {stats.twoPointMade}/{stats.twoPointAttempts}
                  <div className="text-xs text-gray-400">{stats.twoPointPercentage.toFixed(1)}%</div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">
                  {stats.threePointMade}/{stats.threePointAttempts}
                  <div className="text-xs text-gray-400">{stats.threePointPercentage.toFixed(1)}%</div>
                </td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">{stats.totalRebounds}</td>
                <td className="px-4 py-3 text-center text-sm text-gray-600">{stats.assists}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => onEdit(stats)}
                      className="text-orange-600 hover:text-orange-700 text-sm font-semibold px-3 py-1 rounded hover:bg-orange-50 transition-colors"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => {
                        if (window.confirm('Bu oyuncu istatistiğini silmek istediğinize emin misiniz?')) {
                          onDelete(stats.id);
                        }
                      }}
                      className="text-red-600 hover:text-red-700 text-sm font-semibold px-3 py-1 rounded hover:bg-red-50 transition-colors"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};
