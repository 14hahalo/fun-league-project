import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePlayers } from '../hooks/usePlayers';
import { useSeasons } from '../hooks/useSeasons';
import { useGames } from '../hooks/useGames';
import { useMatchStats } from '../hooks/useMatchStats';
import { PlayerFormModal } from '../components/admin/PlayerFormModal';
import { PlayerList } from '../components/admin/PlayerList';
import { SeasonFormModal } from '../components/admin/SeasonFormModal';
import { SeasonList } from '../components/admin/SeasonList';
import { AddMatchStatsModal } from '../components/admin/AddMatchStatsModal';
import { EditMatchStatsModal } from '../components/admin/EditMatchStatsModal';
import { SetPasswordModal } from '../components/admin/SetPasswordModal';
import { BuildTeamsModal } from '../components/admin/BuildTeamsModal';
import { Loading } from '../components/shared/Loading';
import { playerApi } from '../api/playerApi';
import type { CreatePlayerDto, UpdatePlayerDto, Player } from '../types/player.types';
import type { CreateSeasonDto, UpdateSeasonDto, Season } from '../types/season.types';
import type { MatchStatsData } from '../components/admin/AddMatchStatsModal';
import type { EditMatchStatsData } from '../components/admin/EditMatchStatsModal';

export const AdminPage = () => {
  const navigate = useNavigate();
  const { players, loading, error, createPlayer, updatePlayer, deletePlayer, togglePlayerStatus } = usePlayers();
  const { seasons, loading: seasonsLoading, createSeason, updateSeason, deleteSeason } = useSeasons();
  const { games, loading: gamesLoading, refetch: refetchGames, deleteGame } = useGames();
  const { createMatchStats, updateMatchStats, loading: matchStatsLoading, error: matchStatsError } = useMatchStats();
  const [showPlayerModal, setShowPlayerModal] = useState(false);
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [showSeasonModal, setShowSeasonModal] = useState(false);
  const [editingSeason, setEditingSeason] = useState<Season | null>(null);
  const [showMatchStatsModal, setShowMatchStatsModal] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);
  const [settingPasswordFor, setSettingPasswordFor] = useState<Player | null>(null);
  const [showBuildTeamsModal, setShowBuildTeamsModal] = useState(false);

  const handleCreatePlayer = async (data: CreatePlayerDto | UpdatePlayerDto) => {
    await createPlayer(data as CreatePlayerDto);
    setShowPlayerModal(false);
  };

  const handleEditPlayer = (player: Player) => {
    setEditingPlayer(player);
    setShowPlayerModal(true);
  };

  const handleUpdatePlayer = async (data: UpdatePlayerDto) => {
    if (editingPlayer) {
      await updatePlayer(editingPlayer.id, data);
      setEditingPlayer(null);
      setShowPlayerModal(false);
    }
  };

  const handleDeletePlayer = async (id: string) => {
    if (window.confirm('Bu oyuncuyu kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) {
      await deletePlayer(id);
    }
  };

  const handleTogglePlayerStatus = async (id: string) => {
    await togglePlayerStatus(id);
  };

  const handleClosePlayerModal = () => {
    setEditingPlayer(null);
    setShowPlayerModal(false);
  };

  const handleCreateSeason = async (data: CreateSeasonDto | UpdateSeasonDto) => {
    await createSeason(data as CreateSeasonDto);
    setShowSeasonModal(false);
  };

  const handleEditSeason = (season: Season) => {
    setEditingSeason(season);
    setShowSeasonModal(true);
  };

  const handleUpdateSeason = async (data: UpdateSeasonDto) => {
    if (editingSeason) {
      await updateSeason(editingSeason.id, data);
      setEditingSeason(null);
      setShowSeasonModal(false);
    }
  };

  const handleDeleteSeason = async (id: string) => {
    await deleteSeason(id);
  };

  const handleCloseSeasonModal = () => {
    setEditingSeason(null);
    setShowSeasonModal(false);
  };

  const handleCreateMatchStats = async (matchData: MatchStatsData) => {
    try {
      await createMatchStats(matchData);
      setShowMatchStatsModal(false);
      refetchGames();
      alert('Maç istatistikleri başarıyla oluşturuldu!');
    } catch (err) {
      console.error('Failed to create match stats:', err);
      alert('Maç istatistikleri oluşturulurken bir hata oluştu.');
    }
  };

  const handleEditMatch = (gameId: string) => {
    setEditingGameId(gameId);
  };

  const handleUpdateMatchStats = async (gameId: string, matchData: EditMatchStatsData) => {
    try {
      await updateMatchStats(gameId, matchData);
      setEditingGameId(null);
      refetchGames();
      alert('Maç detayları başarıyla güncellendi!');
    } catch (err) {
      console.error('Failed to update match stats:', err);
      alert('Maç detayları güncellenirken bir hata oluştu.');
    }
  };

  const handleDeleteMatch = async (gameId: string, gameNumber: string) => {
    if (window.confirm(`Maç #${gameNumber} kalıcı olarak silinecektir. Bu işlem geri alınamaz ve maça ait tüm istatistikler silinecektir. Emin misiniz?`)) {
      try {
        await deleteGame(gameId);
        alert('Maç başarıyla silindi!');
      } catch (err) {
        console.error('Failed to delete game:', err);
        alert('Maç silinirken bir hata oluştu.');
      }
    }
  };

  const handleSetPassword = async (playerId: string, newPassword: string) => {
    try {
      await playerApi.setPlayerPassword(playerId, newPassword);
      alert('Şifre başarıyla ayarlandı!');
    } catch (err) {
      console.error('Failed to set password:', err);
      throw err;
    }
  };

  if (loading || gamesLoading || seasonsLoading) return <Loading />;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-bold text-gray-800">Admin Panel</h1>
        <div className="flex gap-4">
          <button
            onClick={() => setShowBuildTeamsModal(true)}
            className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white px-6 py-3 rounded-lg font-medium transition-colors shadow-lg"
          >
            🤖 AI Takım Oluştur
          </button>
          <button
            onClick={() => setShowMatchStatsModal(true)}
            className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Maç İstatistikleri Ekle
          </button>
          <button
            onClick={() => {
              setEditingPlayer(null);
              setShowPlayerModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg font-medium transition-colors"
          >
            + Yeni Oyuncu Ekle
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {matchStatsError && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          {matchStatsError}
        </div>
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Sezonlar</h2>
          <button
            onClick={() => {
              setEditingSeason(null);
              setShowSeasonModal(true);
            }}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            + Yeni Sezon Ekle
          </button>
        </div>
        <SeasonList
          seasons={seasons}
          onEdit={handleEditSeason}
          onDelete={handleDeleteSeason}
        />
      </section>

      <SeasonFormModal
        isOpen={showSeasonModal}
        onClose={handleCloseSeasonModal}
        season={editingSeason || undefined}
        onSubmit={editingSeason ? handleUpdateSeason : handleCreateSeason}
      />

      <PlayerFormModal
        isOpen={showPlayerModal}
        onClose={handleClosePlayerModal}
        player={editingPlayer || undefined}
        onSubmit={editingPlayer ? handleUpdatePlayer : handleCreatePlayer}
      />

      {showMatchStatsModal && (
        <AddMatchStatsModal
          onClose={() => setShowMatchStatsModal(false)}
          players={players}
          onSubmit={handleCreateMatchStats}
        />
      )}

      {editingGameId && (
        <EditMatchStatsModal
          gameId={editingGameId}
          onClose={() => setEditingGameId(null)}
          players={players}
          onSubmit={handleUpdateMatchStats}
        />
      )}

      {settingPasswordFor && (
        <SetPasswordModal
          player={settingPasswordFor}
          onClose={() => setSettingPasswordFor(null)}
          onSubmit={handleSetPassword}
        />
      )}

      <BuildTeamsModal
        isOpen={showBuildTeamsModal}
        onClose={() => setShowBuildTeamsModal(false)}
      />

      {matchStatsLoading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loading />
        </div>
      )}

      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-gray-800">Maçlar</h2>
        </div>
        {games.length === 0 ? (
          <div className="text-center py-8 bg-gray-50 rounded-lg">
            <p className="text-gray-500">Henüz maç kaydı bulunmuyor</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game) => (
              <div
                key={game.id}
                className="relative bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden"
              >
                <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-4 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">
                      Maç #{game.gameNumber}
                    </span>
                    <span className="text-xs font-medium text-white opacity-90">
                      {new Date(game.date).toLocaleDateString('tr-TR')}
                    </span>
                  </div>
                </div>

                <div className="p-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 text-center">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Team A</div>
                      <div className="text-3xl font-black text-orange-600">{game.teamAScore}</div>
                    </div>
                    <div className="text-xl font-bold text-gray-300">VS</div>
                    <div className="flex-1 text-center">
                      <div className="text-xs font-semibold text-gray-600 mb-1">Team B</div>
                      <div className="text-3xl font-black text-orange-600">{game.teamBScore}</div>
                    </div>
                  </div>
                  {game.teamSize && (
                    <div className="text-center mt-2 text-xs text-gray-500">
                      {game.teamSize}v{game.teamSize} Format
                    </div>
                  )}
                </div>

                <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleEditMatch(game.id)}
                      className="flex-1 text-center text-orange-600 text-sm font-semibold hover:text-orange-700 transition-colors py-2 rounded hover:bg-orange-50"
                    >
                      ✏️ Düzenle
                    </button>
                    <button
                      onClick={() => handleDeleteMatch(game.id, game.gameNumber)}
                      className="flex-1 text-center text-red-600 text-sm font-semibold hover:text-red-700 transition-colors py-2 rounded hover:bg-red-50"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <div className="border-t-2 border-gray-200"></div>

      <section>
        <div
          onClick={() => navigate('/admin/player-stats')}
          className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-8 border-2 border-purple-200 cursor-pointer hover:shadow-lg transition-all hover:scale-[1.02]"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-purple-800 mb-2">Oyuncu İstatistikleri Yönetimi</h2>
              <p className="text-purple-600">Bireysel oyuncu istatistiklerini görüntüle, düzenle ve yönet</p>
            </div>
            <div className="text-4xl">📊</div>
          </div>
          <div className="mt-4 inline-flex items-center gap-2 text-purple-600 font-semibold">
            <span>Yönetim Sayfasına Git</span>
            <span>→</span>
          </div>
        </div>
      </section>

      <div className="border-t-2 border-gray-200"></div>

      <section>
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Oyuncular</h2>
        <PlayerList
          players={players}
          onEdit={handleEditPlayer}
          onDelete={handleDeletePlayer}
          onToggleStatus={handleTogglePlayerStatus}
          onSetPassword={(player) => setSettingPasswordFor(player)}
        />
      </section>
    </div>
  );
};