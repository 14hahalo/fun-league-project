import { useState, useEffect } from 'react';
import { TeamPlayerSelection } from './TeamPlayerSelection';
import { StatsEntryForm } from './StatsEntryForm';
import { VideoUploadForm } from './VideoUploadForm';
import { useActiveSeason } from '../../hooks/useActiveSeason';
import type { Player } from '../../types/player.types';
import type { CreateVideoDto } from '../../types/basketball.types';

interface AddMatchStatsModalProps {
  onClose: () => void;
  players: Player[];
  onSubmit: (matchData: MatchStatsData) => Promise<void>;
}

export interface MatchMetadata {
  gameNumber: string;
  date: string;
  teamSize?: number;
  notes?: string;
  seasonId?: string;
}

export interface TeamPlayers {
  teamA: Player[];
  teamB: Player[];
}

export interface PlayerStatsInput {
  playerId: string;
  playerNickname: string;
  teamType: 'TEAM_A' | 'TEAM_B';
  twoPointAttempts: number;
  twoPointMade: number;
  threePointAttempts: number;
  threePointMade: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  assists: number;
}

export interface MatchStatsData {
  metadata: MatchMetadata;
  teamPlayers: TeamPlayers;
  playerStats: PlayerStatsInput[];
  videos: CreateVideoDto[];
}

export const AddMatchStatsModal = ({ onClose, players, onSubmit }: AddMatchStatsModalProps) => {
  const { activeSeason } = useActiveSeason();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [metadata, setMetadata] = useState<MatchMetadata>({
    gameNumber: '',
    date: new Date().toISOString().split('T')[0],
    notes: '',
    seasonId: undefined,
  });

  useEffect(() => {
    if (activeSeason?.id && !metadata.seasonId) {
      setMetadata(prev => ({ ...prev, seasonId: activeSeason.id }));
    }
  }, [activeSeason, metadata.seasonId]);
  const [teamPlayers, setTeamPlayers] = useState<TeamPlayers>({
    teamA: [],
    teamB: [],
  });
  const [playerStats, setPlayerStats] = useState<PlayerStatsInput[]>([]);
  const [videos, setVideos] = useState<CreateVideoDto[]>([]);
  const [tempGameId] = useState<string>(`temp-${Date.now()}`); 

  const handleStep1Complete = (meta: MatchMetadata, teams: TeamPlayers) => {
    setMetadata(meta);
    setTeamPlayers(teams);
    setStep(2);
  };

  const handleStep2Complete = (stats: PlayerStatsInput[]) => {
    setPlayerStats(stats);
    setStep(3);
  };

  const handleStep3Complete = async () => {
    const matchData: MatchStatsData = {
      metadata,
      teamPlayers,
      playerStats,
      videos,
    };
    await onSubmit(matchData);
    onClose();
  };

  const handleAddVideo = (video: CreateVideoDto) => {
    setVideos((prev) => [...prev, video]);
  };

  const handleRemoveVideo = (index: number) => {
    setVideos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleBack = () => {
    if (step === 2) {
      setStep(1);
    } else if (step === 3) {
      setStep(2);
    }
  };

  const handleSkipVideos = async () => {
    await handleStep3Complete();
  };

  const allMatchPlayers = [...teamPlayers.teamA, ...teamPlayers.teamB];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar">
        <div className="sticky top-0 bg-orange-600 text-white px-6 py-4 flex justify-between items-center rounded-t-lg z-10">
          <h2 className="text-2xl font-bold">
            Maç İstatistikleri Ekle - Adım {step}/3
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
              onComplete={handleStep2Complete}
              onBack={handleBack}
            />
          ) : (
            <div className="space-y-6">
              <div className="bg-gradient-to-r from-orange-100 to-orange-50 border-l-4 border-orange-500 p-4 rounded-lg">
                <h3 className="font-bold text-gray-800 mb-1">📹 Video Ekleme (Opsiyonel)</h3>
                <p className="text-sm text-gray-600">
                  Maça ait videoları Google Drive üzerinden ekleyebilirsiniz. Videoları
                  oyuncularla etiketleyerek oyuncu profillerinde de gösterebilirsiniz.
                </p>
              </div>

              <VideoUploadForm
                gameId={tempGameId}
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
                  onClick={handleSkipVideos}
                  className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                >
                  Videoları Atla
                </button>
                <button
                  onClick={handleStep3Complete}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold py-3 px-6 rounded-lg transition-all shadow-lg"
                >
                  ✓ Tamamla
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
