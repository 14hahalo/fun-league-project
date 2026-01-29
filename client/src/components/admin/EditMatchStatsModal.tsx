import { useState, useEffect } from 'react';
import { TeamPlayerSelection } from './TeamPlayerSelection';
import { StatsEntryForm } from './StatsEntryForm';
import { VideoUploadForm } from './VideoUploadForm';
import { Loading } from '../shared/Loading';
import type { Player } from '../../types/player.types';
import type { MatchMetadata, TeamPlayers, PlayerStatsInput } from './AddMatchStatsModal';
import type { CreateVideoDto, Video } from '../../types/basketball.types';
import { gameApi, teamApi, playerStatsApi, videoApi } from '../../api/basketballApi';

interface EditMatchStatsModalProps {
  gameId: string;
  onClose: () => void;
  players: Player[];
  onSubmit: (gameId: string, matchData: EditMatchStatsData) => Promise<void>;
}

export interface EditMatchStatsData {
  metadata: MatchMetadata;
  teamPlayers: TeamPlayers;
  playerStats: PlayerStatsInput[];
  videos: CreateVideoDto[];
  existingVideos: Video[];
}

export const EditMatchStatsModal = ({ gameId, onClose, players, onSubmit }: EditMatchStatsModalProps) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [metadata, setMetadata] = useState<MatchMetadata>({
    gameNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
  });
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayers>({
    teamA: [],
    teamB: [],
  });
  const [playerStats, setPlayerStats] = useState<PlayerStatsInput[]>([]);
  const [existingPlayerStats, setExistingPlayerStats] = useState<PlayerStatsInput[]>([]);
  const [videos, setVideos] = useState<CreateVideoDto[]>([]);
  const [existingVideos, setExistingVideos] = useState<Video[]>([]);

  useEffect(() => {
    loadMatchData();
  }, [gameId]);

  const loadMatchData = async () => {
    try {
      setLoading(true);
      setError(null);

      const game = await gameApi.getGameById(gameId);

      const teams = await teamApi.getTeamsByGameId(gameId);
      const teamA = teams.find(t => t.teamType === 'TEAM_A');
      const teamB = teams.find(t => t.teamType === 'TEAM_B');

      const teamAPlayers = teamA?.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];
      const teamBPlayers = teamB?.playerIds.map(id => players.find(p => p.id === id)).filter(Boolean) as Player[] || [];

      const playerStats = await playerStatsApi.getPlayerStatsByGameId(gameId);
      const formattedStats: PlayerStatsInput[] = playerStats.map(stat => {
        const player = players.find(p => p.id === stat.playerId);
        return {
          playerId: stat.playerId,
          playerNickname: player?.nickname || '',
          teamType: stat.teamType,
          twoPointAttempts: stat.twoPointAttempts,
          twoPointMade: stat.twoPointMade,
          threePointAttempts: stat.threePointAttempts,
          threePointMade: stat.threePointMade,
          offensiveRebounds: stat.offensiveRebounds,
          defensiveRebounds: stat.defensiveRebounds,
          assists: stat.assists,
        };
      });

      const gameVideos = await videoApi.getVideosByGameId(gameId);

      setMetadata({
        gameNumber: game.gameNumber,
        date: new Date(game.date).toISOString().split('T')[0],
        teamSize: game.teamSize,
        notes: game.notes || '',
      });

      setTeamPlayers({
        teamA: teamAPlayers,
        teamB: teamBPlayers,
      });

      setExistingPlayerStats(formattedStats);
      setExistingVideos(gameVideos);

      setLoading(false);
    } catch (err) {
      console.error('Maç detayı getirilirken bir hata oluştu:', err);
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      setError(`Maç verileri yüklenirken bir hata oluştu: ${errorMessage}`);
      setLoading(false);
    }
  };

  const handleStep1Complete = (meta: MatchMetadata, teams: TeamPlayers) => {
    setMetadata(meta);
    setTeamPlayers(teams);
    setStep(2);
  };

  const handleStep2Complete = (stats: PlayerStatsInput[]) => {
    setPlayerStats(stats);
    setStep(3);
  };


  const handleAddVideo = (video: CreateVideoDto) => {
    setVideos((prev) => [...prev, video]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleDeleteExistingVideo = async (videoId: string) => {
    try {
      await videoApi.deleteVideo(videoId);
      setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
    } catch (error: any) {
      console.error('Failed to delete video:', error);
      if (error?.response?.status === 404) {
        setExistingVideos((prev) => prev.filter((v) => v.id !== videoId));
      } else {
        alert('Video silinirken bir hata oluştu');
      }
    }
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSave = async () => {
    try {
      const matchData: EditMatchStatsData = {
        metadata,
        teamPlayers,
        playerStats,
        videos,
        existingVideos,
      };
      await onSubmit(gameId, matchData);
      onClose();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Bilinmeyen hata';
      alert(`Maç kaydedilirken hata oluştu: ${errorMessage}`);
    }
  };

  const allMatchPlayers = [...teamPlayers.teamA, ...teamPlayers.teamB];

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8">
          <Loading />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-lg shadow-xl p-8 max-w-md">
          <h2 className="text-xl font-bold text-red-600 mb-4">Hata</h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={onClose}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md"
          >
            Kapat
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-orange-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h2 className="text-2xl font-bold">
            Maç Detaylarını Düzenle - Adım {step}/3
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
          >
            ×
          </button>
        </div>

        <div className="p-6">
          {step === 1 ? (
            <TeamPlayerSelection
              players={players}
              initialMetadata={metadata}
              initialTeamPlayers={teamPlayers}
              onComplete={handleStep1Complete}
              onCancel={onClose}
            />
          ) : step === 2 ? (
            <StatsEntryForm
              teamPlayers={teamPlayers}
              metadata={metadata}
              initialStats={playerStats.length > 0 ? playerStats : existingPlayerStats}
              onComplete={handleStep2Complete}
              onBack={handleBack}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-1">📹 Video Yönetimi (Opsiyonel)</h3>
                <p className="text-sm text-gray-600">
                  Mevcut videoları silebilir veya yeni videolar ekleyebilirsiniz.
                </p>
              </div>

              {existingVideos.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold text-gray-800 mb-4">
                    🎬 Mevcut Videolar ({existingVideos.length})
                  </h3>
                  <div className="space-y-4">
                    {existingVideos.map((video) => {
                      const taggedPlayers = allMatchPlayers.filter((p) =>
                        video.playerIds.includes(p.id)
                      );

                      return (
                        <div
                          key={video.id}
                          className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className="font-bold text-gray-900">{video.title}</h4>
                              {video.description && (
                                <p className="text-sm text-gray-600 mt-1">{video.description}</p>
                              )}
                              <p className="text-xs text-gray-400 mt-2 break-all">{video.youtubeUrl}</p>
                              {taggedPlayers.length > 0 && (
                                <div className="mt-2 flex flex-wrap gap-1">
                                  {taggedPlayers.map((player) => (
                                    <span
                                      key={player.id}
                                      className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-semibold rounded"
                                    >
                                      #{player.jerseyNumber} {player.nickname}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleDeleteExistingVideo(video.id)}
                              className="ml-4 text-red-500 hover:text-red-700 font-bold text-xl"
                              title="Videoyu Sil"
                            >
                              ×
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <VideoUploadForm
                gameId={gameId}
                availablePlayers={allMatchPlayers}
                onAddVideo={handleAddVideo}
                onRemoveVideo={handleRemoveVideo}
                videos={videos}
              />

              <div className="flex gap-4">
                <button
                  onClick={handleBack}
                  className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800 font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  ← Geri
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                >
                  ✓ Kaydet
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
