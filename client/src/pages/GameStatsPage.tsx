import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useBasketballStats } from '../hooks/useBasketballStats';
import { usePlayers } from '../hooks/usePlayers';
import { PlayerStatsForm } from '../components/basketball/PlayerStatsForm';
import { PlayerStatRow } from '../components/basketball/PlayerStatRow';
import { TeamStatsDisplay } from '../components/basketball/TeamStatsDisplay';
import { Loading } from '../components/shared/Loading';
import { Button } from '../components/shared/Button';
import { TeamType } from '../types/basketball.types';
import type { PlayerStatsWithPlayerInfo, CreatePlayerStatsDto } from '../types/basketball.types';

export const GameStatsPage: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [showForm, setShowForm] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<TeamType>(TeamType.TEAM_A);
  const [viewMode, setViewMode] = useState<'input' | 'view'>('input');

  const {
    playerStats,
    teamStats,
    teams,
    loading,
    error,
    fetchAllGameData,
    createPlayerStats,
    deletePlayerStats,
    generateTeamStats,
  } = useBasketballStats();

  const { players, fetchPlayers } = usePlayers();

  useEffect(() => {
    fetchPlayers();
    if (gameId) {
      fetchAllGameData(gameId);
    }
  }, [gameId]);

  const handleCreateStats = async (data: CreatePlayerStatsDto) => {
    try {
      await createPlayerStats(data);
      setShowForm(false);
      if (gameId) {
        await fetchAllGameData(gameId);
      }
    } catch (error) {
      console.error('Error creating stats:', error);
    }
  };

  const handleDeleteStats = async (id: string) => {
    try {
      await deletePlayerStats(id);
      if (gameId) {
        await fetchAllGameData(gameId);
      }
    } catch (error) {
      console.error('Error deleting stats:', error);
    }
  };

  const handleGenerateTeamStats = async (teamType: TeamType) => {
    if (!gameId) return;
    try {
      await generateTeamStats(gameId, teamType);
      await fetchAllGameData(gameId);
    } catch (error) {
      console.error('Error generating team stats:', error);
    }
  };

  const enrichedPlayerStats: PlayerStatsWithPlayerInfo[] = playerStats.map((stat) => {
    const player = players.find((p) => p.id === stat.playerId);
    return {
      ...stat,
      playerNickname: player?.nickname,
      playerName: player?.firstName && player?.lastName
        ? `${player.firstName} ${player.lastName}`
        : undefined,
      playerJerseyNumber: player?.jerseyNumber,
    };
  });

  const teamAStats = enrichedPlayerStats.filter((s) => s.teamType === TeamType.TEAM_A);
  const teamBStats = enrichedPlayerStats.filter((s) => s.teamType === TeamType.TEAM_B);
  const teamATeamStats = teamStats.find((s) => s.teamType === TeamType.TEAM_A);
  const teamBTeamStats = teamStats.find((s) => s.teamType === TeamType.TEAM_B);
  const teamAInfo = teams.find((t) => t.teamType === TeamType.TEAM_A);
  const teamBInfo = teams.find((t) => t.teamType === TeamType.TEAM_B);

  if (!gameId) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800">Maç ID bulunamadı</p>
        </div>
      </div>
    );
  }

  if (loading && playerStats.length === 0) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loading />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Maç İstatistikleri</h1>
            <p className="text-gray-600 mt-1">Maç #{gameId.slice(0, 8)}</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant={viewMode === 'input' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('input')}
            >
              İstatistik Gir
            </Button>
            <Button
              variant={viewMode === 'view' ? 'primary' : 'secondary'}
              onClick={() => setViewMode('view')}
            >
              Sonuçlar
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-800">{error}</p>
          </div>
        )}
      </div>

      {viewMode === 'input' && (
        <div className="space-y-6">
          {!showForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">Oyuncu İstatistiği Ekle</h2>
                <Button onClick={() => setShowForm(true)}>
                  + Yeni İstatistik
                </Button>
              </div>
              <p className="text-gray-600 text-sm">
                Oyuncuların maç performanslarını kaydedin. Her oyuncu için şut, ribaund ve asist istatistiklerini girebilirsiniz.
              </p>
            </div>
          )}

          {showForm && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Yeni Oyuncu İstatistiği
              </h2>
              <PlayerStatsForm
                gameId={gameId}
                availablePlayers={players.map((p) => ({
                  id: p.id,
                  nickname: p.nickname,
                  jerseyNumber: p.jerseyNumber,
                }))}
                teamType={selectedTeam}
                onSubmit={handleCreateStats}
                onCancel={() => setShowForm(false)}
              />
            </div>
          )}

          <div className="bg-white rounded-lg shadow">
            <div className="border-b border-gray-200">
              <div className="flex">
                <button
                  onClick={() => setSelectedTeam(TeamType.TEAM_A)}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                    selectedTeam === TeamType.TEAM_A
                      ? 'bg-blue-50 text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {teamAInfo?.teamName || 'Takım A'} ({teamAStats.length} Oyuncu)
                </button>
                <button
                  onClick={() => setSelectedTeam(TeamType.TEAM_B)}
                  className={`flex-1 px-6 py-4 text-center font-semibold transition-colors ${
                    selectedTeam === TeamType.TEAM_B
                      ? 'bg-red-50 text-red-700 border-b-2 border-red-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {teamBInfo?.teamName || 'Takım B'} ({teamBStats.length} Oyuncu)
                </button>
              </div>
            </div>

            <div className="p-6">
              {selectedTeam === TeamType.TEAM_A && teamAStats.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                        <th className="px-4 py-3">Oyuncu</th>
                        <th className="px-4 py-3 text-center">2 Sayılık</th>
                        <th className="px-4 py-3 text-center">3 Sayılık</th>
                        <th className="px-4 py-3 text-center">Ribaund</th>
                        <th className="px-4 py-3 text-center">Asist</th>
                        <th className="px-4 py-3 text-center">Puan</th>
                        <th className="px-4 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamAStats.map((stat) => (
                        <PlayerStatRow
                          key={stat.id}
                          stats={stat}
                          onDelete={handleDeleteStats}
                          showActions
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {selectedTeam === TeamType.TEAM_B && teamBStats.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-sm font-semibold text-gray-700 border-b-2 border-gray-300">
                        <th className="px-4 py-3">Oyuncu</th>
                        <th className="px-4 py-3 text-center">2 Sayılık</th>
                        <th className="px-4 py-3 text-center">3 Sayılık</th>
                        <th className="px-4 py-3 text-center">Ribaund</th>
                        <th className="px-4 py-3 text-center">Asist</th>
                        <th className="px-4 py-3 text-center">Puan</th>
                        <th className="px-4 py-3 text-right">İşlemler</th>
                      </tr>
                    </thead>
                    <tbody>
                      {teamBStats.map((stat) => (
                        <PlayerStatRow
                          key={stat.id}
                          stats={stat}
                          onDelete={handleDeleteStats}
                          showActions
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {((selectedTeam === TeamType.TEAM_A && teamAStats.length === 0) ||
                (selectedTeam === TeamType.TEAM_B && teamBStats.length === 0)) && (
                <div className="text-center py-12">
                  <p className="text-gray-500">Bu takım için henüz istatistik girilmemiş.</p>
                  <Button onClick={() => setShowForm(true)} className="mt-4">
                    İlk İstatistiği Ekle
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {viewMode === 'view' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              {teamATeamStats ? (
                <TeamStatsDisplay stats={teamATeamStats} teamName={teamAInfo?.teamName} />
              ) : (
                <div className="bg-blue-50 border-2 border-blue-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-blue-700 mb-4">
                    {teamAInfo?.teamName || 'Takım A'}
                  </h3>
                  <p className="text-gray-600 mb-4">Takım istatistikleri henüz oluşturulmamış.</p>
                  <Button onClick={() => handleGenerateTeamStats(TeamType.TEAM_A)}>
                    İstatistikleri Oluştur
                  </Button>
                </div>
              )}
            </div>

            <div>
              {teamBTeamStats ? (
                <TeamStatsDisplay stats={teamBTeamStats} teamName={teamBInfo?.teamName} />
              ) : (
                <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
                  <h3 className="text-xl font-bold text-red-700 mb-4">
                    {teamBInfo?.teamName || 'Takım B'}
                  </h3>
                  <p className="text-gray-600 mb-4">Takım istatistikleri henüz oluşturulmamış.</p>
                  <Button onClick={() => handleGenerateTeamStats(TeamType.TEAM_B)}>
                    İstatistikleri Oluştur
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-blue-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  {teamAInfo?.teamName || 'Takım A'} - Oyuncu İstatistikleri
                </h3>
              </div>
              <div className="p-6">
                {teamAStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                          <th className="px-2 py-2">Oyuncu</th>
                          <th className="px-2 py-2 text-center">2P</th>
                          <th className="px-2 py-2 text-center">3P</th>
                          <th className="px-2 py-2 text-center">RB</th>
                          <th className="px-2 py-2 text-center">AS</th>
                          <th className="px-2 py-2 text-center">PT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamAStats.map((stat) => (
                          <PlayerStatRow key={stat.id} stats={stat} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">İstatistik bulunamadı</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="bg-red-600 px-6 py-4">
                <h3 className="text-xl font-bold text-white">
                  {teamBInfo?.teamName || 'Takım B'} - Oyuncu İstatistikleri
                </h3>
              </div>
              <div className="p-6">
                {teamBStats.length > 0 ? (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-xs font-semibold text-gray-700 border-b-2 border-gray-300">
                          <th className="px-2 py-2">Oyuncu</th>
                          <th className="px-2 py-2 text-center">2P</th>
                          <th className="px-2 py-2 text-center">3P</th>
                          <th className="px-2 py-2 text-center">RB</th>
                          <th className="px-2 py-2 text-center">AS</th>
                          <th className="px-2 py-2 text-center">PT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {teamBStats.map((stat) => (
                          <PlayerStatRow key={stat.id} stats={stat} />
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">İstatistik bulunamadı</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
