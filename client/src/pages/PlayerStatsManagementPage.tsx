import { useState } from 'react';
import * as React from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useGames } from '../hooks/useGames';
import { PlayerStatsModal } from '../components/admin/PlayerStatsModal';
import { PlayerStatsList } from '../components/admin/PlayerStatsList';
import { Loading } from '../components/shared/Loading';
import { playerStatsApi } from '../api/playerStatsApi';
import type { PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../types/basketball.types';

export const PlayerStatsManagementPage = () => {
  const { players, loading: playersLoading } = usePlayers();
  const { games, loading: gamesLoading } = useGames();

  const [allPlayerStats, setAllPlayerStats] = useState<PlayerStats[]>([]);
  const [showPlayerStatsModal, setShowPlayerStatsModal] = useState(false);
  const [editingPlayerStats, setEditingPlayerStats] = useState<PlayerStats | null>(null);
  const [playerStatsLoading, setPlayerStatsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAllPlayerStats = async () => {
    setPlayerStatsLoading(true);
    setError(null);
    try {
      const allStats: PlayerStats[] = [];
      for (const game of games) {
        const stats = await playerStatsApi.getPlayerStatsByGameId(game.id);
        allStats.push(...stats);
      }
      setAllPlayerStats(allStats);
    } catch (err) {
      setError('Oyuncunun istatistikleri getirilirken bir hata oluştu');
    } finally {
      setPlayerStatsLoading(false);
    }
  };

  React.useEffect(() => {
    if (games.length > 0) {
      fetchAllPlayerStats();
    }
  }, [games]);

  const handleCreateOrUpdatePlayerStats = async (data: CreatePlayerStatsDto | UpdatePlayerStatsDto, id?: string) => {
    try {
      if (id) {
        await playerStatsApi.updatePlayerStats(id, data as UpdatePlayerStatsDto);
        alert('Oyuncu istatistiği başarıyla güncellendi!');
      } else {
        await playerStatsApi.createPlayerStats(data as CreatePlayerStatsDto);
        alert('Oyuncu istatistiği başarıyla eklendi!');
      }
      await fetchAllPlayerStats();
      setShowPlayerStatsModal(false);
      setEditingPlayerStats(null);
    } catch (err) {
      alert('Oyuncu istatistiği kaydedilirken bir hata oluştu.');
      throw err;
    }
  };

  const handleEditPlayerStats = (stats: PlayerStats) => {
    setEditingPlayerStats(stats);
    setShowPlayerStatsModal(true);
  };

  const handleDeletePlayerStats = async (id: string) => {
    try {
      await playerStatsApi.deletePlayerStats(id);
      alert('Oyuncu istatistiği başarıyla silindi!');
      await fetchAllPlayerStats();
    } catch (err) {
      alert('Oyuncu istatistiği silinirken bir hata oluştu.');
    }
  };

  if (playersLoading || gamesLoading) return <Loading />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-bold text-gray-800">Oyuncu İstatistikleri Yönetimi</h1>
          <p className="text-gray-600 mt-2">Bireysel oyuncu istatistiklerini yönetin</p>
        </div>
        <button
          onClick={() => {
            setEditingPlayerStats(null);
            setShowPlayerStatsModal(true);
          }}
          className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg hover:shadow-xl"
        >
          + Yeni İstatistik Ekle
        </button>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6 border border-blue-200">
          <div className="text-sm font-semibold text-blue-600 mb-1">Toplam İstatistik</div>
          <div className="text-3xl font-bold text-blue-900">{allPlayerStats.length}</div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
          <div className="text-sm font-semibold text-green-600 mb-1">Toplam Oyuncu</div>
          <div className="text-3xl font-bold text-green-900">{players.filter(p => p.isActive).length}</div>
        </div>
        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-6 border border-orange-200">
          <div className="text-sm font-semibold text-orange-600 mb-1">Toplam Maç</div>
          <div className="text-3xl font-bold text-orange-900">{games.length}</div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Tüm İstatistikler</h2>
        {playerStatsLoading ? (
          <div className="py-12">
            <Loading />
          </div>
        ) : (
          <PlayerStatsList
            playerStats={allPlayerStats}
            players={players}
            games={games}
            onEdit={handleEditPlayerStats}
            onDelete={handleDeletePlayerStats}
          />
        )}
      </div>

      {showPlayerStatsModal && (
        <PlayerStatsModal
          onClose={() => {
            setShowPlayerStatsModal(false);
            setEditingPlayerStats(null);
          }}
          onSubmit={handleCreateOrUpdatePlayerStats}
          players={players}
          games={games}
          editingStats={editingPlayerStats || undefined}
        />
      )}
    </div>
  );
};
