import React, { useState } from 'react';
import { usePlayers } from '../../hooks/usePlayers';
import { teamApi } from '../../api/basketballApi';
import ReactMarkdown from 'react-markdown';

interface BuildTeamsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BuildTeamsModal: React.FC<BuildTeamsModalProps> = ({ isOpen, onClose }) => {
  const { players } = usePlayers();
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    teamA: string[];
    teamB: string[];
    analysis: string;
    cost: number;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handlePlayerToggle = (playerId: string) => {
    setSelectedPlayers((prev) => {
      if (prev.includes(playerId)) {
        return prev.filter((id) => id !== playerId);
      } else {
        if (prev.length >= 10) {
          setError('Maximum 10 players can be selected');
          return prev;
        }
        return [...prev, playerId];
      }
    });
    setError(null);
  };

  const handleBuildTeams = async () => {
    if (selectedPlayers.length !== 10) {
      setError('Please select exactly 10 players');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await teamApi.buildBalancedTeams(selectedPlayers);
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to build balanced teams');
    } finally {
      setLoading(false);
    }
  };

  const getPlayerName = (playerId: string) => {
    const player = players.find((p) => p.id === playerId);
    if (!player) return 'Unknown';
    return player.nickname || `${player.firstName} ${player.lastName}`;
  };

  const handleClose = () => {
    setSelectedPlayers([]);
    setResult(null);
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 max-w-6xl w-full max-h-[90vh] overflow-y-auto border border-gray-700 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-cyan-400">
            🤖 AI Takım Oluşturucu
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ✕
          </button>
        </div>

        {!result ? (
          <>
            <p className="text-gray-300 mb-4">
              Maç için 10 oyuncu seçin. AI, geçmiş performanslarına göre dengeli takımlar oluşturacak.
            </p>

            <div className="mb-4 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">
                  Seçili Oyuncu: <span className="text-orange-400 font-bold">{selectedPlayers.length}/10</span>
                </span>
                {selectedPlayers.length > 0 && (
                  <button
                    onClick={() => setSelectedPlayers([])}
                    className="text-sm text-red-400 hover:text-red-300 transition-colors"
                  >
                    Tümünü Temizle
                  </button>
                )}
              </div>
            </div>

            {error && (
              <div className="mb-4 p-4 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
                {error}
              </div>
            )}

            {/* Player Selection Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 mb-6 max-h-96 overflow-y-auto">
              {players.map((player) => {
                const isSelected = selectedPlayers.includes(player.id);
                return (
                  <button
                    key={player.id}
                    onClick={() => handlePlayerToggle(player.id)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      isSelected
                        ? 'border-orange-500 bg-orange-500/20 shadow-lg shadow-orange-500/50'
                        : 'border-gray-700 bg-gray-800/50 hover:border-gray-600 hover:bg-gray-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${
                          isSelected
                            ? 'border-orange-500 bg-orange-500'
                            : 'border-gray-600'
                        }`}
                      >
                        {isSelected && <span className="text-white text-sm">✓</span>}
                      </div>
                      <div className="text-left flex-1">
                        <div className="text-white font-medium">
                          {player.nickname || `${player.firstName} ${player.lastName}`}
                        </div>
                        <div className="text-sm text-gray-400">
                          #{player.jerseyNumber} • {player.position || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Build Teams Button */}
            <div className="flex gap-4">
              <button
                onClick={handleBuildTeams}
                disabled={selectedPlayers.length !== 10 || loading}
                className={`flex-1 py-3 px-6 rounded-lg font-bold transition-all ${
                  selectedPlayers.length === 10 && !loading
                    ? 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-lg shadow-orange-500/50'
                    : 'bg-gray-700 text-gray-500 cursor-not-allowed'
                }`}
              >
                {loading ? '🤖 Takımlar Oluşturuluyor...' : '⚡ Dengeli Takımlar Oluştur'}
              </button>
              <button
                onClick={handleClose}
                className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                İptal
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Results Display */}
            <div className="space-y-6">
              {/* Cost Information */}
              <div className="p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-green-300 font-bold text-lg">💰 Maliyet Bilgisi</div>
                    <div className="text-gray-300 text-sm mt-1">
                      Prompt: {result.tokenUsage.promptTokens} tokens •
                      Completion: {result.tokenUsage.completionTokens} tokens •
                      Toplam: {result.tokenUsage.totalTokens} tokens
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-green-400">
                    ${result.cost.toFixed(6)}
                  </div>
                </div>
              </div>

              {/* Teams Display */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Team A */}
                <div className="p-6 bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/50 rounded-xl">
                  <h3 className="text-2xl font-bold text-blue-400 mb-4 flex items-center gap-2">
                    🔵 Takım A
                  </h3>
                  <div className="space-y-2">
                    {result.teamA.map((playerId, index) => (
                      <div
                        key={playerId}
                        className="p-3 bg-blue-900/30 rounded-lg border border-blue-600/30"
                      >
                        <span className="text-blue-300 font-bold">{index + 1}. </span>
                        <span className="text-white">{getPlayerName(playerId)}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Team B */}
                <div className="p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/50 rounded-xl">
                  <h3 className="text-2xl font-bold text-orange-400 mb-4 flex items-center gap-2">
                    🔴 Takım B
                  </h3>
                  <div className="space-y-2">
                    {result.teamB.map((playerId, index) => (
                      <div
                        key={playerId}
                        className="p-3 bg-orange-900/30 rounded-lg border border-orange-600/30"
                      >
                        <span className="text-orange-300 font-bold">{index + 1}. </span>
                        <span className="text-white">{getPlayerName(playerId)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI Analysis */}
              <div className="p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/50 rounded-xl">
                <h3 className="text-2xl font-bold text-purple-400 mb-4">🎯 AI Analizi</h3>
                <div className="prose prose-invert max-w-none">
                  <ReactMarkdown
                    components={{
                      h1: ({ children }) => <h1 className="text-2xl font-bold text-white mb-3">{children}</h1>,
                      h2: ({ children }) => <h2 className="text-xl font-bold text-gray-200 mb-2 mt-4">{children}</h2>,
                      h3: ({ children }) => <h3 className="text-lg font-bold text-gray-300 mb-2">{children}</h3>,
                      p: ({ children }) => <p className="text-gray-300 mb-3 leading-relaxed">{children}</p>,
                      ul: ({ children }) => <ul className="list-disc list-inside text-gray-300 mb-3 space-y-1">{children}</ul>,
                      li: ({ children }) => <li className="text-gray-300">{children}</li>,
                      strong: ({ children }) => <strong className="text-orange-400 font-bold">{children}</strong>,
                    }}
                  >
                    {result.analysis}
                  </ReactMarkdown>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setResult(null);
                    setSelectedPlayers([]);
                  }}
                  className="flex-1 py-3 px-6 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg font-bold transition-all shadow-lg shadow-orange-500/50"
                >
                  🔄 Yeni Takım Oluştur
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
                >
                  Kapat
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
