import { useState } from 'react';
import type { Player } from '../../types/player.types';
import type { MatchMetadata, TeamPlayers } from './AddMatchStatsModal';

interface TeamPlayerSelectionProps {
  players: Player[];
  initialMetadata: MatchMetadata;
  initialTeamPlayers: TeamPlayers;
  onComplete: (metadata: MatchMetadata, teamPlayers: TeamPlayers) => void;
  onCancel: () => void;
}

export const TeamPlayerSelection = ({
  players,
  initialMetadata,
  initialTeamPlayers,
  onComplete,
  onCancel,
}: TeamPlayerSelectionProps) => {
  const [metadata, setMetadata] = useState<MatchMetadata>(initialMetadata);
  const [teamSize, setTeamSize] = useState<number>(
    initialTeamPlayers.teamA.length > 0 ? initialTeamPlayers.teamA.length : 5
  );
  const [teamA, setTeamA] = useState<(Player | null)[]>(
    initialTeamPlayers.teamA.length > 0
      ? initialTeamPlayers.teamA
      : Array(5).fill(null)
  );
  const [teamB, setTeamB] = useState<(Player | null)[]>(
    initialTeamPlayers.teamB.length > 0
      ? initialTeamPlayers.teamB
      : Array(5).fill(null)
  );
  const [selectingFor, setSelectingFor] = useState<{
    team: 'A' | 'B';
    index: number;
  } | null>(null);

  const handleTeamSizeChange = (size: number) => {
    setTeamSize(size);
    // Resize teams - keep existing players if they fit, otherwise reset
    if (size < teamA.length) {
      setTeamA(teamA.slice(0, size));
      setTeamB(teamB.slice(0, size));
    } else {
      const additionalSlots = size - teamA.length;
      setTeamA([...teamA, ...Array(additionalSlots).fill(null)]);
      setTeamB([...teamB, ...Array(additionalSlots).fill(null)]);
    }
  };

  const handlePlayerSelect = (player: Player) => {
    if (!selectingFor) return;

    const { team, index } = selectingFor;
    if (team === 'A') {
      const newTeamA = [...teamA];
      newTeamA[index] = player;
      setTeamA(newTeamA);
    } else {
      const newTeamB = [...teamB];
      newTeamB[index] = player;
      setTeamB(newTeamB);
    }
    setSelectingFor(null);
  };

  const handleRemovePlayer = (team: 'A' | 'B', index: number) => {
    if (team === 'A') {
      const newTeamA = [...teamA];
      newTeamA[index] = null;
      setTeamA(newTeamA);
    } else {
      const newTeamB = [...teamB];
      newTeamB[index] = null;
      setTeamB(newTeamB);
    }
  };

  const getAvailablePlayers = () => {
    const selectedPlayerIds = [
      ...teamA.filter((p) => p !== null).map((p) => p!.id),
      ...teamB.filter((p) => p !== null).map((p) => p!.id),
    ];
    return players.filter((p) => !selectedPlayerIds.includes(p.id));
  };

  const isFormValid = () => {
    const teamAFilled = teamA.every((p) => p !== null);
    const teamBFilled = teamB.every((p) => p !== null);
    const metadataValid = metadata.gameNumber.trim() !== '' && metadata.date.trim() !== '';
    return teamAFilled && teamBFilled && metadataValid;
  };

  const handleNext = () => {
    if (!isFormValid()) return;

    onComplete(
      { ...metadata, teamSize },
      {
        teamA: teamA.filter((p) => p !== null) as Player[],
        teamB: teamB.filter((p) => p !== null) as Player[],
      }
    );
  };

  return (
    <div className="space-y-6">
      {/* Match Metadata */}
      <div className="bg-gray-50 p-6 rounded-lg">
        <h3 className="text-lg font-semibold mb-4 text-gray-800">Maç Bilgileri</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Maç Numarası <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={metadata.gameNumber}
              onChange={(e) => setMetadata({ ...metadata, gameNumber: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Örn: 001"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tarih <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={metadata.date}
              onChange={(e) => setMetadata({ ...metadata, date: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Takım Büyüklüğü <span className="text-red-500">*</span>
            </label>
            <select
              value={teamSize}
              onChange={(e) => handleTeamSizeChange(Number(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500 bg-white"
            >
              <option value={3}>3v3 (Half Court)</option>
              <option value={4}>4v4 (Half Court)</option>
              <option value={5}>5v5 (Full Court)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Notlar
            </label>
            <input
              type="text"
              value={metadata.notes || ''}
              onChange={(e) => setMetadata({ ...metadata, notes: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="Opsiyonel"
            />
          </div>
        </div>
      </div>

      {/* Team Selection */}
      <div>
        <h3 className="text-lg font-semibold mb-4 text-gray-800">
          Takım Oyuncuları (Her takımdan {teamSize} oyuncu seçiniz)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Team A */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-3 text-orange-600 text-center">
              Takım A
            </h4>
            <div className="space-y-2">
              {teamA.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:border-orange-400 transition-colors"
                >
                  {player ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          {index + 1}.
                        </span>
                        <span className="font-medium text-gray-800">
                          {player.nickname}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({player.firstName} {player.lastName})
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer('A', index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectingFor({ team: 'A', index })}
                      className="w-full text-left text-gray-400 hover:text-orange-600 transition-colors"
                    >
                      <span className="text-sm font-medium mr-2">{index + 1}.</span>
                      Oyuncu seçmek için tıklayın...
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Team B */}
          <div className="border border-gray-300 rounded-lg p-4">
            <h4 className="text-md font-semibold mb-3 text-blue-600 text-center">
              Takım B
            </h4>
            <div className="space-y-2">
              {teamB.map((player, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md hover:border-blue-400 transition-colors"
                >
                  {player ? (
                    <>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-medium text-gray-700">
                          {index + 1}.
                        </span>
                        <span className="font-medium text-gray-800">
                          {player.nickname}
                        </span>
                        <span className="text-sm text-gray-500">
                          ({player.firstName} {player.lastName})
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemovePlayer('B', index)}
                        className="text-red-500 hover:text-red-700 text-xl font-bold"
                      >
                        ×
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => setSelectingFor({ team: 'B', index })}
                      className="w-full text-left text-gray-400 hover:text-blue-600 transition-colors"
                    >
                      <span className="text-sm font-medium mr-2">{index + 1}.</span>
                      Oyuncu seçmek için tıklayın...
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Player Selection Modal */}
      {selectingFor && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[70vh] overflow-hidden mx-4">
            <div className="bg-orange-600 text-white px-6 py-4 flex justify-between items-center">
              <h3 className="text-xl font-bold">
                Oyuncu Seçin (Takım {selectingFor.team})
              </h3>
              <button
                onClick={() => setSelectingFor(null)}
                className="text-white hover:text-gray-200 text-3xl font-bold leading-none"
              >
                ×
              </button>
            </div>
            <div className="p-6 overflow-y-auto max-h-[calc(70vh-80px)]">
              {getAvailablePlayers().length === 0 ? (
                <p className="text-center text-gray-500">Tüm oyuncular seçildi</p>
              ) : (
                <div className="space-y-2">
                  {getAvailablePlayers().map((player) => (
                    <button
                      key={player.id}
                      onClick={() => handlePlayerSelect(player)}
                      className="w-full text-left p-4 border border-gray-200 rounded-md hover:bg-orange-50 hover:border-orange-400 transition-colors"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-semibold text-gray-800">
                            {player.nickname}
                          </div>
                          <div className="text-sm text-gray-600">
                            {player.firstName} {player.lastName}
                          </div>
                        </div>
                        <div className="text-right text-sm text-gray-500">
                          <div>Forma: {player.jerseyNumber || '-'}</div>
                          <div>Pozisyon: {player.position || '-'}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-4 pt-4 border-t">
        <button
          onClick={onCancel}
          className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
        >
          İptal
        </button>
        <button
          onClick={handleNext}
          disabled={!isFormValid()}
          className={`px-6 py-2 rounded-md transition-colors ${
            isFormValid()
              ? 'bg-orange-600 text-white hover:bg-orange-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
        >
          İstatistikleri Gir →
        </button>
      </div>
    </div>
  );
};
