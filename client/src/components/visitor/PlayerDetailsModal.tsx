import { useEffect, useState } from 'react';
import type { Player } from '../../types/player.types';
import type { PlayerStats, Game, Video } from '../../types/basketball.types';
import { playerStatsApi, gameApi, videoApi } from '../../api/basketballApi';
import { Loading } from '../shared/Loading';
import { VideoGallery } from '../shared/VideoGallery';

interface PlayerDetailsModalProps {
  player: Player;
  onClose: () => void;
}

interface PlayerStatsWithGame extends PlayerStats {
  game: Game;
}

export const PlayerDetailsModal = ({ player, onClose }: PlayerDetailsModalProps) => {
  const [playerStats, setPlayerStats] = useState<PlayerStatsWithGame[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);

  useEffect(() => {
    const fetchPlayerStats = async () => {
      try {
        setLoading(true);
        const stats = await playerStatsApi.getAllStatsForPlayer(player.id);

        // Extract unique game IDs
        const uniqueGameIds = [...new Set(stats.map(stat => stat.gameId))];

        // Batch fetch all games at once (much more efficient than individual calls)
        const gamesPromises = uniqueGameIds.map(gameId =>
          gameApi.getGameById(gameId).catch(err => {
            console.error(`Error fetching game ${gameId}:`, err);
            return null;
          })
        );
        const games = await Promise.all(gamesPromises);

        // Create a game lookup map for O(1) access
        const gameMap = new Map(
          games
            .filter((game): game is NonNullable<typeof game> => game !== null)
            .map(game => [game.id, game])
        );

        // Map stats to games (no additional API calls!)
        const statsWithGames = stats
          .map((stat) => {
            const game = gameMap.get(stat.gameId);
            return game ? ({ ...stat, game } as PlayerStatsWithGame) : null;
          })
          .filter((stat): stat is PlayerStatsWithGame => stat !== null);

        // Sort by game date (newest first)
        statsWithGames.sort((a, b) => {
          return new Date(b.game.date).getTime() - new Date(a.game.date).getTime();
        });

        setPlayerStats(statsWithGames);
        setError(null);
      } catch (err) {
        setError('Oyuncu istatistikleri yüklenirken bir hata oluştu');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const fetchPlayerVideos = async () => {
      try {
        setVideosLoading(true);
        const playerVideos = await videoApi.getVideosByPlayerId(player.id);
        setVideos(playerVideos);
      } catch (err) {
        console.error('Error fetching player videos:', err);
      } finally {
        setVideosLoading(false);
      }
    };

    fetchPlayerStats();
    fetchPlayerVideos();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [player.id]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

  // Handle ESC key
  useEffect(() => {
    const handleEscKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscKey);
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [onClose]);

  const calculateEfficiency = (stat: PlayerStats): number => {
    const made2P = stat.twoPointMade;
    const made3P = stat.threePointMade;
    const assists = stat.assists;
    const defReb = stat.defensiveRebounds;
    const offReb = stat.offensiveRebounds;
    const missed2P = stat.twoPointAttempts - stat.twoPointMade;
    const missed3P = stat.threePointAttempts - stat.threePointMade;

    const efficiency =
      2 * made2P +
      3 * made3P +
      1.5 * assists +
      0.8 * defReb +
      1.2 * offReb -
      (0.8 * missed2P + 1.2 * missed3P);

    return Math.round(efficiency * 10) / 10;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getGameResult = (stat: PlayerStatsWithGame): 'win' | 'loss' | 'unknown' => {
    if (!stat.game) return 'unknown';

    const { teamAScore, teamBScore } = stat.game;
    const playerTeam = stat.teamType;

    if (playerTeam === 'TEAM_A') {
      return teamAScore > teamBScore ? 'win' : 'loss';
    } else {
      return teamBScore > teamAScore ? 'win' : 'loss';
    }
  };

  const calculateAverages = () => {
    if (playerStats.length === 0) return null;

    const totals = playerStats.reduce(
      (acc, stat) => ({
        points: acc.points + stat.totalPoints,
        rebounds: acc.rebounds + stat.totalRebounds,
        assists: acc.assists + stat.assists,
        efficiency: acc.efficiency + calculateEfficiency(stat),
        twoPointMade: acc.twoPointMade + stat.twoPointMade,
        twoPointAttempts: acc.twoPointAttempts + stat.twoPointAttempts,
        threePointMade: acc.threePointMade + stat.threePointMade,
        threePointAttempts: acc.threePointAttempts + stat.threePointAttempts,
      }),
      {
        points: 0,
        rebounds: 0,
        assists: 0,
        efficiency: 0,
        twoPointMade: 0,
        twoPointAttempts: 0,
        threePointMade: 0,
        threePointAttempts: 0,
      }
    );

    const gamesPlayed = playerStats.length;
    const twoPointPercentage = totals.twoPointAttempts > 0
      ? (totals.twoPointMade / totals.twoPointAttempts) * 100
      : 0;
    const threePointPercentage = totals.threePointAttempts > 0
      ? (totals.threePointMade / totals.threePointAttempts) * 100
      : 0;

    return {
      gamesPlayed,
      avgPoints: (totals.points / gamesPlayed).toFixed(1),
      avgRebounds: (totals.rebounds / gamesPlayed).toFixed(1),
      avgAssists: (totals.assists / gamesPlayed).toFixed(1),
      avgEfficiency: (totals.efficiency / gamesPlayed).toFixed(1),
      twoPointPercentage: twoPointPercentage.toFixed(1),
      threePointPercentage: threePointPercentage.toFixed(1),
    };
  };

  const averages = calculateAverages();

  return (
    <div
      className="fixed inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-gradient-to-br from-gray-900 via-gray-800 to-black border-2 border-orange-500/30 rounded-3xl max-w-7xl w-full max-h-[95vh] overflow-hidden shadow-[0_0_100px_rgba(249,115,22,0.3)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 p-4 md:p-8 overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 opacity-10">
            <div className="absolute inset-0" style={{
              backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)',
              backgroundSize: '20px 20px'
            }}></div>
          </div>

          <div className="relative flex items-start justify-between gap-2">
            <div className="flex flex-row md:flex-row items-center md:items-center gap-3 md:gap-6 min-w-0 flex-1">
              {/* Player Avatar with Glow */}
              <div className="relative group flex-shrink-0">
                <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 to-orange-600 rounded-full blur-xl opacity-75 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative w-16 h-16 md:w-28 md:h-28 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border-4 border-white/50 shadow-2xl overflow-hidden">
                  {player.photoUrl ? (
                    <img
                      src={player.photoUrl}
                      alt={player.nickname}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl md:text-6xl font-black text-white">{player.nickname.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </div>

              <div className="min-w-0 flex-1">
                <h2 className="text-xl md:text-5xl font-black text-white mb-1 md:mb-2 tracking-tight drop-shadow-lg truncate">
                  {player.nickname}
                </h2>
                {(player.firstName || player.lastName) && (
                  <p className="text-xs md:text-xl text-white/90 font-semibold mb-1 md:mb-3 truncate">
                    {player.firstName} {player.lastName}
                  </p>
                )}
                <div className="flex flex-wrap gap-1.5 md:gap-3">
                  {player.jerseyNumber && (
                    <div className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 md:px-4 py-0.5 md:py-2 border border-white/30">
                      <span className="text-xs md:text-2xl font-black text-white">#{player.jerseyNumber}</span>
                    </div>
                  )}
                  {player.position && (
                    <div className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 md:px-4 py-0.5 md:py-2 border border-white/30">
                      <span className="text-xs md:text-lg font-bold text-white">{player.position}</span>
                    </div>
                  )}
                  {player.height && (
                    <div className="inline-flex items-center gap-1 md:gap-2 bg-white/20 backdrop-blur-sm rounded-full px-2 md:px-4 py-0.5 md:py-2 border border-white/30">
                      <span className="text-xs md:text-lg font-bold text-white">{player.height} cm</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={onClose}
              className="bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-2 md:p-3 transition-all border border-white/30 group flex-shrink-0"
            >
              <svg className="w-6 h-6 md:w-8 md:h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-8 overflow-y-auto max-h-[calc(95vh-200px)] custom-scrollbar">
          {/* Physical Stats */}
          {(player.height || player.weight) && (
            <div className="grid grid-cols-2 gap-4 mb-8">

              {player.weight && (
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-purple-400 to-pink-500">
                  <div className="bg-gray-900 rounded-xl p-5 text-center">
                    <div className="text-sm text-purple-400 font-bold mb-2 uppercase tracking-wider">Kilo</div>
                    <div className="text-3xl font-black text-white">{player.weight} <span className="text-xl">kg</span></div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Oyuncu Rozetleri */}
          {player.badges && Object.keys(player.badges).length > 0 && (
            <div className="mb-8">
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500 mb-6 flex items-center gap-3">
                <span>🏆</span> Oyuncu Rozetleri
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(player.badges).map(([category, badgeName]) => {
                  const categoryColors: Record<string, { from: string; to: string; text: string }> = {
                    'Bitiriş': { from: 'from-red-500', to: 'to-red-700', text: 'text-red-300' },
                    'Şut': { from: 'from-green-500', to: 'to-green-700', text: 'text-green-300' },
                    'Oyun Kurma': { from: 'from-blue-500', to: 'to-blue-700', text: 'text-blue-300' },
                    'Savunma': { from: 'from-purple-500', to: 'to-purple-700', text: 'text-purple-300' },
                    'Ribaund': { from: 'from-orange-500', to: 'to-orange-700', text: 'text-orange-300' },
                    'Genel': { from: 'from-cyan-500', to: 'to-cyan-700', text: 'text-cyan-300' },
                  };

                  const colors = categoryColors[category] || { from: 'from-gray-500', to: 'to-gray-700', text: 'text-gray-300' };

                  return (
                    <div
                      key={category}
                      className={`relative group p-[2px] rounded-xl bg-gradient-to-br ${colors.from} ${colors.to}`}
                    >
                      <div className="bg-gray-900 rounded-xl p-4">
                        <div className={`text-xs font-bold mb-2 ${colors.text} uppercase tracking-wider opacity-75`}>
                          {category}
                        </div>
                        <div className="text-lg font-black text-white">{badgeName}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Career Averages */}
          {averages && (
            <div className="mb-8">
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 mb-6 flex items-center gap-3">
                <span>📊</span> Kariyer Ortalamaları
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-orange-400 to-orange-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-orange-400 font-bold mb-1 uppercase">Maçlar</div>
                    <div className="text-3xl font-black text-white">{averages.gamesPlayed}</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-red-400 to-red-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-red-400 font-bold mb-1 uppercase">Ort. PTS</div>
                    <div className="text-3xl font-black text-white">{averages.avgPoints}</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-blue-400 to-blue-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-blue-400 font-bold mb-1 uppercase">Ort. REB</div>
                    <div className="text-3xl font-black text-white">{averages.avgRebounds}</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-green-400 to-green-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-green-400 font-bold mb-1 uppercase">Ort. AST</div>
                    <div className="text-3xl font-black text-white">{averages.avgAssists}</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-purple-400 to-purple-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-purple-400 font-bold mb-1 uppercase">Ort. EFF</div>
                    <div className="text-3xl font-black text-white">{averages.avgEfficiency}</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-yellow-400 to-yellow-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-yellow-400 font-bold mb-1 uppercase">2P %</div>
                    <div className="text-2xl font-black text-white">{averages.twoPointPercentage}%</div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-pink-400 to-pink-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-pink-400 font-bold mb-1 uppercase">3P %</div>
                    <div className="text-2xl font-black text-white">{averages.threePointPercentage}%</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Match Statistics */}
          <div className="mb-8">
            <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500 mb-6 flex items-center gap-3">
              <span>🏀</span> Maç İstatistikleri
            </h3>

            {loading ? (
              <div className="py-12">
                <Loading />
              </div>
            ) : error ? (
              <div className="bg-red-500/20 border-2 border-red-500 text-red-200 px-6 py-4 rounded-xl text-center backdrop-blur-md">
                {error}
              </div>
            ) : playerStats.length === 0 ? (
              <div className="text-center py-16 bg-gray-800/50 backdrop-blur-sm rounded-2xl border border-gray-700">
                <div className="text-6xl mb-4">📊</div>
                <p className="text-2xl text-gray-400">Henüz maç istatistiği bulunmuyor</p>
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border-2 border-gray-700 custom-scrollbar">
                <table className="w-full">
                  <thead className="bg-gradient-to-r from-gray-800 to-gray-900">
                    <tr>
                      <th className="px-4 py-4 text-left text-xs font-black text-orange-400 uppercase tracking-wider">Maç</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">Takım</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">Sonuç</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">EFF</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">PTS</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">2P</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">3P</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">REB</th>
                      <th className="px-4 py-4 text-center text-xs font-black text-orange-400 uppercase tracking-wider">AST</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {playerStats.map((stat) => {
                      const efficiency = calculateEfficiency(stat);
                      const gameResult = getGameResult(stat);
                      return (
                        <tr key={stat.id} className="bg-gray-900/50 hover:bg-orange-500/10 transition-colors">
                          <td className="px-4 py-4">
                            <div className="font-bold text-white">Maç #{stat.game?.gameNumber || '-'}</div>
                            <div className="text-xs text-gray-400">{stat.game?.date ? formatDate(stat.game.date) : '-'}</div>
                          </td>
                          <td className="px-2 md:px-4 py-4 text-center">
                            <span className={`inline-block px-2 md:px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap ${stat.teamType === 'TEAM_A'
                              ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50'
                              : 'bg-red-500/20 text-red-300 border border-red-500/50'
                              }`}>
                              {stat.teamType === 'TEAM_A' ? '🔵 Team A' : '🔴 Team B'}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            {gameResult === 'win' ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-green-500/20 border border-green-500/50">
                                <span className="text-lg">🏆</span>
                                <span className="text-xs font-bold text-green-300">Win</span>
                              </div>
                            ) : gameResult === 'loss' ? (
                              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-gray-500/20 border border-gray-500/50">
                                <span className="text-lg">😞</span>
                                <span className="text-xs font-bold text-gray-300">Loss</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-500">-</span>
                            )}
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className={`text-lg font-black ${efficiency >= 20 ? 'text-green-400' :
                              efficiency >= 10 ? 'text-blue-400' :
                                efficiency >= 0 ? 'text-gray-400' : 'text-red-400'
                              }`}>
                              {efficiency.toFixed(1)}
                            </span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="text-lg font-black text-orange-400">{stat.totalPoints}</span>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm font-bold text-white">{stat.twoPointMade}/{stat.twoPointAttempts}</div>
                            <div className="text-xs text-gray-500">{formatPercentage(stat.twoPointPercentage)}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="text-sm font-bold text-white">{stat.threePointMade}/{stat.threePointAttempts}</div>
                            <div className="text-xs text-gray-500">{formatPercentage(stat.threePointPercentage)}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <div className="font-bold text-white">{stat.totalRebounds}</div>
                            <div className="text-xs text-gray-500">O:{stat.offensiveRebounds} D:{stat.defensiveRebounds}</div>
                          </td>
                          <td className="px-4 py-4 text-center">
                            <span className="font-bold text-white">{stat.assists}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Player Videos */}
          <div>
            {videosLoading ? (
              <div className="py-12">
                <Loading />
              </div>
            ) : (
              <VideoGallery
                videos={videos}
                title="🎥 Oyuncu Videoları"
                emptyMessage="Bu oyuncuya ait video bulunmuyor"
              />
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="bg-gradient-to-r from-gray-900 to-gray-800 p-6 border-t-2 border-orange-500/30">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-black py-4 px-8 rounded-xl transition-all shadow-lg hover:shadow-xl hover:scale-105 text-lg uppercase tracking-wider"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
