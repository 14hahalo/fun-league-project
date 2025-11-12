import type { GameRatings } from "../../types/rating.types";

interface PlayerRatingsListModalProps {
  isOpen: boolean;
  onClose: () => void;
  gameRatings: GameRatings | null;
}

export const PlayerRatingsListModal = ({
  isOpen,
  onClose,
  gameRatings,
}: PlayerRatingsListModalProps) => {
  if (!isOpen || !gameRatings) return null;

  const sortedRatings = [...gameRatings.ratings].sort(
    (a, b) => a.averageRating - b.averageRating
  );

  return (
    <div
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-pink-500/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-hidden shadow-[0_0_100px_rgba(236,72,153,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-pink-600 via-red-500 to-orange-500 p-6 overflow-hidden">
          <div className="absolute inset-0 opacity-10">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  "radial-gradient(circle, white 1px, transparent 1px)",
                backgroundSize: "20px 20px",
              }}
            ></div>
          </div>

          <div className="relative flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">
                ❤️
              </span>
              <div>
                <h2 className="text-3xl font-black text-white drop-shadow-lg">
                  Taraftar Oylaması Sonuçları
                </h2>
                <p className="text-white/90 text-sm mt-1">
                  {gameRatings.totalVoters} / {gameRatings.totalPlayers} oyuncu
                  oy kullandı
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 transition-all border border-white/30 group flex-shrink-0"
            >
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={3}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)] custom-scrollbar">
          {sortedRatings.length === 0 ? (
            <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
              <div className="text-6xl mb-4">📊</div>
              <p className="text-2xl text-gray-400">
                Henüz oy kullanılmamış
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedRatings.map((rating, index) => {
                const isMVP = rating.isMVP;
                const rank = index + 1;

                // Medal colors for top 3
                const rankBadgeStyle =
                  rank === 1
                    ? "bg-gradient-to-br from-yellow-400 to-yellow-600 text-white shadow-lg border-4 border-yellow-300"
                    : rank === 2
                    ? "bg-gradient-to-br from-gray-300 to-gray-500 text-gray-900 border-4 border-gray-200"
                    : rank === 3
                    ? "bg-gradient-to-br from-orange-400 to-orange-600 text-white border-4 border-orange-300"
                    : "bg-gray-700 text-gray-300 border-2 border-gray-600";

                const cardStyle = isMVP
                  ? "bg-gradient-to-r from-pink-500/20 via-red-500/20 to-orange-500/20 border-pink-500/50 shadow-xl"
                  : "bg-gray-800/50 border-gray-700";

                return (
                  <div
                    key={rating.playerId}
                    className={`relative rounded-2xl p-5 border-2 transition-all hover:scale-[1.02] ${cardStyle}`}
                  >
                    {isMVP && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase shadow-lg border-2 border-white">
                        <span className="mr-1">❤️</span>
                        Gönüllerin MVPsi
                        <span className="ml-1">❤️</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4">
                      {/* Rank Badge */}
                      <div
                        className={`w-16 h-16 rounded-full flex items-center justify-center font-black text-2xl flex-shrink-0 ${rankBadgeStyle}`}
                      >
                        {rank === 1 ? (
                          <span className="text-3xl">🥇</span>
                        ) : rank === 2 ? (
                          <span className="text-3xl">🥈</span>
                        ) : rank === 3 ? (
                          <span className="text-3xl">🥉</span>
                        ) : (
                          rank
                        )}
                      </div>

                      {/* Player Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`text-2xl font-black mb-1 truncate ${
                            isMVP
                              ? "text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-red-300 to-orange-300"
                              : "text-white"
                          }`}
                        >
                          {rating.playerName}
                        </h3>
                        <p className="text-sm text-gray-400">
                          {rating.totalVotes} oyuncu tarafından oylandı
                        </p>
                      </div>

                      {/* Rating Display */}
                      <div className="flex-shrink-0">
                        <div
                          className={`rounded-2xl px-6 py-4 ${
                            isMVP
                              ? "bg-gradient-to-br from-pink-500 to-orange-500"
                              : "bg-gray-900"
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-3xl">
                              {isMVP ? "❤️" : "⭐"}
                            </span>
                            <span
                              className={`text-4xl font-black ${
                                isMVP ? "text-white" : "text-orange-400"
                              }`}
                            >
                              {rating.averageRating.toFixed(1)}
                            </span>
                          </div>
                          <div className="text-center mt-1">
                            <span
                              className={`text-xs font-bold ${
                                isMVP ? "text-white/80" : "text-gray-500"
                              }`}
                            >
                              Ortalama Sıra
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-4 border-t-2 border-pink-500/30">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white font-black py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 uppercase tracking-wider"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
