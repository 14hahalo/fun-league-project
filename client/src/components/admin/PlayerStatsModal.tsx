import { useState } from 'react';
import type { Player } from '../../types/player.types';
import type { Game, TeamType, PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../../types/basketball.types';

interface PlayerStatsModalProps {
  onClose: () => void;
  onSubmit: (data: CreatePlayerStatsDto | UpdatePlayerStatsDto, id?: string) => Promise<void>;
  players: Player[];
  games: Game[];
  editingStats?: PlayerStats;
}

export const PlayerStatsModal = ({ onClose, onSubmit, players, games, editingStats }: PlayerStatsModalProps) => {
  const [gameId, setGameId] = useState(editingStats?.gameId || '');
  const [playerId, setPlayerId] = useState(editingStats?.playerId || '');
  const [teamType, setTeamType] = useState<TeamType>(editingStats?.teamType || 'TEAM_A');
  const [twoPointAttempts, setTwoPointAttempts] = useState(editingStats?.twoPointAttempts || 0);
  const [twoPointMade, setTwoPointMade] = useState(editingStats?.twoPointMade || 0);
  const [threePointAttempts, setThreePointAttempts] = useState(editingStats?.threePointAttempts || 0);
  const [threePointMade, setThreePointMade] = useState(editingStats?.threePointMade || 0);
  const [defensiveRebounds, setDefensiveRebounds] = useState(editingStats?.defensiveRebounds || 0);
  const [offensiveRebounds, setOffensiveRebounds] = useState(editingStats?.offensiveRebounds || 0);
  const [assists, setAssists] = useState(editingStats?.assists || 0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (editingStats) {
        const updateData: UpdatePlayerStatsDto = {
          twoPointAttempts,
          twoPointMade,
          threePointAttempts,
          threePointMade,
          defensiveRebounds,
          offensiveRebounds,
          assists,
        };
        await onSubmit(updateData, editingStats.id);
      } else {
        const createData: CreatePlayerStatsDto = {
          gameId,
          playerId,
          teamType,
          twoPointAttempts,
          twoPointMade,
          threePointAttempts,
          threePointMade,
          defensiveRebounds,
          offensiveRebounds,
          assists,
        };
        await onSubmit(createData);
      }
      onClose();
    } catch (err) {
      console.error('Failed to save player stats:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 rounded-t-2xl">
          <h2 className="text-2xl font-bold text-white">
            {editingStats ? 'Oyuncu İstatistiğini Düzenle' : 'Yeni Oyuncu İstatistiği Ekle'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!editingStats && (
            <>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Maç *</label>
                <select
                  value={gameId}
                  onChange={(e) => setGameId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Maç Seçin</option>
                  {games.map((game) => (
                    <option key={game.id} value={game.id}>
                      Maç #{game.gameNumber} - {new Date(game.date).toLocaleDateString('tr-TR')}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Oyuncu *</label>
                <select
                  value={playerId}
                  onChange={(e) => setPlayerId(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="">Oyuncu Seçin</option>
                  {players.filter((p) => p.isActive).map((player) => (
                    <option key={player.id} value={player.id}>
                      #{player.jerseyNumber} {player.firstName} {player.lastName} ({player.nickname})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">Takım *</label>
                <select
                  value={teamType}
                  onChange={(e) => setTeamType(e.target.value as TeamType)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                >
                  <option value="TEAM_A">Team A</option>
                  <option value="TEAM_B">Team B</option>
                </select>
              </div>
            </>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">2 Sayılık Deneme</label>
              <input
                type="number"
                min="0"
                value={twoPointAttempts}
                onChange={(e) => setTwoPointAttempts(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">2 Sayılık İsabet</label>
              <input
                type="number"
                min="0"
                max={twoPointAttempts}
                value={twoPointMade}
                onChange={(e) => setTwoPointMade(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">3 Sayılık Deneme</label>
              <input
                type="number"
                min="0"
                value={threePointAttempts}
                onChange={(e) => setThreePointAttempts(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">3 Sayılık İsabet</label>
              <input
                type="number"
                min="0"
                max={threePointAttempts}
                value={threePointMade}
                onChange={(e) => setThreePointMade(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Defansif Ribaund</label>
              <input
                type="number"
                min="0"
                value={defensiveRebounds}
                onChange={(e) => setDefensiveRebounds(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Ofansif Ribaund</label>
              <input
                type="number"
                min="0"
                value={offensiveRebounds}
                onChange={(e) => setOffensiveRebounds(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Asist</label>
              <input
                type="number"
                min="0"
                value={assists}
                onChange={(e) => setAssists(Number(e.target.value))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="flex gap-4 mt-6">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              İptal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg font-medium hover:from-orange-600 hover:to-orange-700 transition-colors disabled:opacity-50"
            >
              {isSubmitting ? 'Kaydediliyor...' : editingStats ? 'Güncelle' : 'Ekle'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
