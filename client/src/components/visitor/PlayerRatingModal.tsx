import { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRatings } from "../../hooks/useRatings";
import type { PlayerStats } from "../../types/basketball.types";
import type { Player } from "../../types/player.types";
import type { PlayerRating } from "../../types/rating.types";

interface PlayerRatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  playersInGame: Array<{ player: Player; stats: PlayerStats }>;
}

export const PlayerRatingModal = ({
  isOpen,
  onClose,
  gameId,
  playersInGame,
}: PlayerRatingModalProps) => {
  const { user } = useAuth();
  const { submitRating, getVoterRatings, loading } = useRatings();
  const [rankedPlayers, setRankedPlayers] = useState<Array<{ player: Player; stats: PlayerStats }>>([]);
  const [existingRatings, setExistingRatings] = useState<PlayerRating[]>([]);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [_touchCurrentY, setTouchCurrentY] = useState<number | null>(null);

  const playersToRate = playersInGame.filter(
    (p) => p.player.id !== user?.id
  );

  useEffect(() => {
    if (isOpen && user?.id) {
      loadExistingRatings();
    }
  }, [isOpen, user?.id, gameId]);

  const loadExistingRatings = async () => {
    if (!user?.id) return;
    try {
      const existingVotes = await getVoterRatings(gameId, user.id);
      setExistingRatings(existingVotes);

      if (existingVotes.length > 0) {
        const ranked = [...playersToRate].sort((a, b) => {
          const aRank = existingVotes.find(v => v.ratedPlayerId === a.player.id)?.rank || 999;
          const bRank = existingVotes.find(v => v.ratedPlayerId === b.player.id)?.rank || 999;
          return aRank - bRank;
        });
        setRankedPlayers(ranked);
      } else {
        setRankedPlayers([...playersToRate]);
      }
    } catch (error) {
      setRankedPlayers([...playersToRate]);
    }
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;

    const newRanked = [...rankedPlayers];
    const draggedItem = newRanked[draggedIndex];
    newRanked.splice(draggedIndex, 1);
    newRanked.splice(index, 0, draggedItem);

    setRankedPlayers(newRanked);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  const handleTouchStart = (e: React.TouchEvent, index: number) => {
    setDraggedIndex(index);
    setTouchStartY(e.touches[0].clientY);
    setTouchCurrentY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (draggedIndex === null || touchStartY === null) return;

    e.preventDefault(); 
    const touchY = e.touches[0].clientY;
    setTouchCurrentY(touchY);

    const elements = document.querySelectorAll('[data-player-rank-item]');
    let targetIndex = draggedIndex;

    elements.forEach((element, index) => {
      const rect = element.getBoundingClientRect();
      if (touchY >= rect.top && touchY <= rect.bottom) {
        targetIndex = index;
      }
    });

    if (targetIndex !== draggedIndex) {
      const newRanked = [...rankedPlayers];
      const draggedItem = newRanked[draggedIndex];
      newRanked.splice(draggedIndex, 1);
      newRanked.splice(targetIndex, 0, draggedItem);

      setRankedPlayers(newRanked);
      setDraggedIndex(targetIndex);
    }
  };

  const handleTouchEnd = () => {
    setDraggedIndex(null);
    setTouchStartY(null);
    setTouchCurrentY(null);
  };

  const handleSubmit = async () => {
    if (!user?.id) {
      alert("Oyları göndermek için giriş yapmalısınız");
      return;
    }

    try {
      const promises = rankedPlayers.map((item, index) =>
        submitRating({
          gameId,
          voterId: user.id,
          ratedPlayerId: item.player.id,
          rank: index + 1, 
        })
      );

      await Promise.all(promises);
      setSubmitSuccess(true);

      setTimeout(() => {
        setSubmitSuccess(false);
        onClose();
      }, 2000);
    } catch (error) {
      alert("Sıralama gönderilemedi. Lütfen tekrar deneyin.");
    }
  };

  if (!isOpen) return null;

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
          <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-8 text-center">
            <div className="text-6xl mb-4">🔐</div>
            <h2 className="text-2xl font-bold text-white">
              Giriş Yapmanız Gerekiyor
            </h2>
          </div>
          <div className="p-6 text-center">
            <p className="text-gray-600 mb-6">
              Oyuncuları oylamak için lütfen hesabınıza giriş yapın.
            </p>
            <button
              onClick={onClose}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 rounded-xl transition-colors"
            >
              Tamam
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-bold text-white">
              Oyuncu Sıralaması 🏆
            </h2>
            <p className="text-orange-100 text-sm">
              Oyuncuları en iyiden en kötüye sıralayın (sürükle-bırak)
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {submitSuccess && (
          <div className="bg-green-50 border-l-4 border-green-500 p-4 m-4">
            <div className="flex items-center">
              <span className="text-2xl mr-3">✅</span>
              <div>
                <p className="text-green-800 font-bold">Oylarınız kaydedildi!</p>
                <p className="text-green-700 text-sm">
                  Teşekkürler, oylamanız başarıyla alındı.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto p-3 custom-scrollbar">
           <div className="space-y-3">
            {rankedPlayers.map((item, index) => {
              const { player, stats } = item;
              const hasExistingRating = existingRatings.some(
                (r) => r.ratedPlayerId === player.id
              );

              const rankColors = index === 0
                ? 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg'
                : index === 1
                ? 'bg-gradient-to-br from-gray-300 to-gray-400 text-gray-800'
                : index === 2
                ? 'bg-gradient-to-br from-orange-400 to-orange-600 text-white'
                : 'bg-gray-200 text-gray-700';

              return (
                <div
                  key={player.id}
                  data-player-rank-item
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  onTouchStart={(e) => handleTouchStart(e, index)}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`bg-white rounded-xl p-2 border-2 transition-all cursor-move hover:shadow-lg touch-none ${
                    draggedIndex === index
                      ? 'border-orange-500 shadow-xl scale-105 opacity-50'
                      : 'border-gray-200 hover:border-orange-300'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-8 rounded-full flex items-center justify-center font-black text-xl ${rankColors}`}>
                      {index + 1}
                    </div>

                    <div className="text-gray-400 text-2xl cursor-move">
                      ⋮⋮
                    </div>

                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-sm font-bold text-gray-800">
                          {player.nickname}
                        </h3>
                        {player.jerseyNumber && (
                          <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                            #{player.jerseyNumber}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">
                        {stats.totalPoints} PTS • {stats.totalRebounds} REB • {stats.assists} AST
                      </p>
                    </div>

                    {hasExistingRating && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        Daha önce sıralandı
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-between items-center">
          <div className="text-sm text-gray-600">
            <span className="font-bold">
              {rankedPlayers.length}
            </span>{" "}
            oyuncu sıralandı
          </div>
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-200 hover:bg-gray-300 text-gray-700 font-bold rounded-xl transition-colors"
            >
              İptal
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading || rankedPlayers.length === 0}
              className={`px-6 py-3 font-bold rounded-xl transition-all ${
                rankedPlayers.length > 0 && !loading
                  ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg hover:shadow-xl"
                  : "bg-gray-300 text-gray-500 cursor-not-allowed"
              }`}
            >
              {loading ? "Kaydediliyor..." : "Sıralamayı Kaydet"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
