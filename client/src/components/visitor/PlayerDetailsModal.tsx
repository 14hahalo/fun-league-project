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

        const uniqueGameIds = [...new Set(stats.map(stat => stat.gameId))];

        const gamesPromises = uniqueGameIds.map(gameId =>
          gameApi.getGameById(gameId).catch(err => {
            console.error(`Error fetching game ${gameId}:`, err);
            return null;
          })
        );
        const games = await Promise.all(gamesPromises);

        const gameMap = new Map(
          games
            .filter((game): game is NonNullable<typeof game> => game !== null)
            .map(game => [game.id, game])
        );

        const statsWithGames = stats
          .map((stat) => {
            const game = gameMap.get(stat.gameId);
            return game ? ({ ...stat, game } as PlayerStatsWithGame) : null;
          })
          .filter((stat): stat is PlayerStatsWithGame => stat !== null);

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
  }, [player.id]);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, []);

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

  const getGameResult = (stat: PlayerStatsWithGame): 'win' | 'loss' | 'Bilinmiyor' => {
    if (!stat.game) return 'Bilinmiyor';

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

    const last5Stats = playerStats.slice(0, 5);
    const last5Results = last5Stats.map(stat => getGameResult(stat));
    const last5Wins = last5Results.filter(r => r === 'win').length;
    const last5Losses = last5Results.filter(r => r === 'loss').length;

    let winStreak = 0;
    let streakBroken = false;
    let totalWins = 0;

    for (const stat of playerStats) {
      const result = getGameResult(stat);
      if (result === 'win') {
        totalWins++;
        if (!streakBroken) {
          winStreak++;
        }
      } else if (!streakBroken) {
        streakBroken = true;
      }
    }

    const winPercentage = gamesPlayed > 0 ? (totalWins / gamesPlayed) * 100 : 0;

    return {
      gamesPlayed,
      avgPoints: (totals.points / gamesPlayed).toFixed(1),
      avgRebounds: (totals.rebounds / gamesPlayed).toFixed(1),
      avgAssists: (totals.assists / gamesPlayed).toFixed(1),
      avgEfficiency: (totals.efficiency / gamesPlayed).toFixed(1),
      twoPointPercentage: twoPointPercentage.toFixed(1),
      threePointPercentage: threePointPercentage.toFixed(1),
      last5Wins,
      last5Losses,
      winStreak,
      totalWins,
      winPercentage: winPercentage.toFixed(1),
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
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900"></div>
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-orange-500/20 via-transparent to-transparent"></div>

          <div className="relative px-4 py-3 md:px-6 md:py-4">
            <div className="flex items-center gap-3 md:gap-4">
              <div className="relative flex-shrink-0">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 p-0.5 shadow-lg shadow-orange-500/25">
                  <div className="w-full h-full rounded-[10px] bg-gray-900 flex items-center justify-center overflow-hidden">
                    {player.photoUrl ? (
                      <img
                        src={player.photoUrl}
                        alt={player.nickname}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl md:text-3xl font-black bg-gradient-to-br from-orange-400 to-amber-500 bg-clip-text text-transparent">
                        {player.nickname.charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                </div>
                {player.jerseyNumber && (
                  <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 bg-gradient-to-br from-orange-500 to-amber-600 rounded-md px-1.5 py-0.5 shadow-lg border border-orange-400/50">
                    <span className="text-[10px] md:text-xs font-black text-white">#{player.jerseyNumber}</span>
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <h2 className="text-lg md:text-xl font-black text-white truncate tracking-tight">
                    {player.nickname}
                  </h2>
                  {player.position && (
                    <span className="flex-shrink-0 text-[10px] md:text-xl font-bold text-orange-400 bg-orange-500/10 border border-orange-500/30 rounded px-1.5 py-0.5">
                      {player.position}
                    </span>
                  )}
                </div>
                {(player.firstName || player.lastName) && (
                  <p className="text-l md:text-l text-gray-400 truncate mb-1">
                    {player.firstName} {player.lastName}
                  </p>
                )}
                <div className="flex items-center gap-3 text-[10px] md:text-xl text-gray-500">
                  {player.height && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18" />
                      </svg>
                      {player.height} cm
                    </span>
                  )}
                  {player.weight && (
                    <span className="flex items-center gap-1">
                      <svg className="w-3 h-3 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" />
                      </svg>
                      {player.weight} kg
                    </span>
                  )}
                  
                </div>
              </div>

              <button
                onClick={onClose}
                className="flex-shrink-0 w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gray-800 hover:bg-gray-700 border border-gray-700 hover:border-gray-600 flex items-center justify-center transition-all group"
              >
                <svg className="w-4 h-4 md:w-5 md:h-5 text-gray-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          <div className="h-0.5 bg-gradient-to-r from-transparent via-orange-500 to-transparent"></div>
        </div>

        <div className="p-4 md:p-6 overflow-y-auto max-h-[calc(95vh-140px)] custom-scrollbar">
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

          {averages && (
            <div className="mb-8">
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 mb-6 flex items-center gap-3">
                <span>📊</span> Kariyer Ortalamaları
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-5 xl:grid-cols-10 gap-3">
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
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-emerald-400 to-teal-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-emerald-400 font-bold mb-1 uppercase">Son 5 Maç</div>
                    <div className="flex items-center justify-center gap-1">
                      <span className="text-lg font-black text-green-400">{averages.last5Wins}W</span>
                      <span className="text-gray-500">-</span>
                      <span className="text-lg font-black text-red-400">{averages.last5Losses}L</span>
                    </div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-amber-400 to-orange-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-amber-400 font-bold mb-1 uppercase">Win Streak</div>
                    <div className="text-3xl font-black text-white flex items-center justify-center gap-1">
                      {averages.winStreak > 0 ? (
                        <>
                          <span className="text-2xl">🔥</span>
                          <span>{averages.winStreak}</span>
                        </>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="relative group p-[2px] rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600">
                  <div className="bg-gray-900 rounded-xl p-4 text-center">
                    <div className="text-xs text-cyan-400 font-bold mb-1 uppercase">Win %</div>
                    <div className="text-2xl font-black text-white">{averages.winPercentage}%</div>
                    <div className="text-[10px] text-gray-500 mt-0.5">{averages.totalWins}W / {averages.gamesPlayed}G</div>
                  </div>
                </div>
              </div>
            </div>
          )}

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

        <div className="bg-gray-900/80 backdrop-blur-sm px-4 py-3 border-t border-gray-800">
          <button
            onClick={onClose}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-2.5 px-6 rounded-lg transition-all hover:shadow-lg hover:shadow-orange-500/20 text-sm uppercase tracking-wide"
          >
            Kapat
          </button>
        </div>
      </div>
    </div>
  );
};
