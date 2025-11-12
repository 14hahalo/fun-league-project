import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useMatchDetails, type PlayerStatsWithInfo } from '../hooks/useMatchDetails';
import { Loading } from '../components/shared/Loading';
import { VideoGallery } from '../components/shared/VideoGallery';
import { videoApi } from '../api/basketballApi';
import type { TeamStats, Video } from '../types/basketball.types';
import { PlayerRatingModal } from '../components/visitor/PlayerRatingModal';
import { PlayerRatingsListModal } from '../components/visitor/PlayerRatingsListModal';
import { useRatings } from '../hooks/useRatings';
import ReactMarkdown from 'react-markdown';

interface AwardWinner {
  player: PlayerStatsWithInfo;
  value: number;
}

export const MatchDetailsPage = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const navigate = useNavigate();
  const { matchDetails, loading, error, fetchMatchDetails } = useMatchDetails();
  const { gameRatings, fetchGameRatings } = useRatings();
  const [showTeamB, setShowTeamB] = useState(false); // false = Team A, true = Team B
  const [videos, setVideos] = useState<Video[]>([]);
  const [videosLoading, setVideosLoading] = useState(false);
  const [isRatingModalOpen, setIsRatingModalOpen] = useState(false);
  const [isRatingsListModalOpen, setIsRatingsListModalOpen] = useState(false);

  useEffect(() => {
    if (gameId) {
      fetchMatchDetails(gameId);
      fetchVideos(gameId);
      fetchGameRatings(gameId).catch(err => {
        console.error('[MatchDetailsPage] Error fetching game ratings:', err);
      });
    }
  }, [gameId]);

  const fetchVideos = async (gameId: string) => {
    try {
      setVideosLoading(true);
      const gameVideos = await videoApi.getVideosByGameId(gameId);
      setVideos(gameVideos);
    } catch (err) {
    } finally {
      setVideosLoading(false);
    }
  };

  const calculateEfficiency = (stat: PlayerStatsWithInfo): number => {
    // EFF = 2×2PM + 3×3PM + 1.5×AST + 0.8×DEFREB + 1.2×OFFREB - 1×((2×(2PA-2PM) + 3×(3PA-3PM)))
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
      1 * (0.8 * missed2P + 1.2 * missed3P);

    return Math.round(efficiency * 10) / 10;
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const getAwardWinners = (players: PlayerStatsWithInfo[]) => {
    if (players.length === 0) return null;

    const playersWithEff = players.map((p) => ({
      ...p,
      efficiency: calculateEfficiency(p),
    }));

    const mvp = playersWithEff.reduce((prev, current) =>
      current.efficiency > prev.efficiency ? current : prev
    );

    const topScorer = players.reduce((prev, current) =>
      current.totalPoints > prev.totalPoints ? current : prev
    );

    const reboundKing = players.reduce((prev, current) =>
      current.totalRebounds > prev.totalRebounds ? current : prev
    );

    const assistMaster = players.reduce((prev, current) =>
      current.assists > prev.assists ? current : prev
    );

    return {
      mvp: { player: mvp, value: mvp.efficiency },
      topScorer: { player: topScorer, value: topScorer.totalPoints },
      reboundKing: { player: reboundKing, value: reboundKing.totalRebounds },
      assistMaster: { player: assistMaster, value: assistMaster.assists },
    };
  };

  const renderAwardCard = (
    title: string,
    emoji: string,
    winner: AwardWinner | null,
    suffix: string,
    bgGradient: string
  ) => {
    if (!winner) return null;

    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
        <div
          className={`relative ${bgGradient} rounded-2xl p-6 shadow-2xl transform hover:scale-105 transition-all duration-300 border border-white/10`}
        >
          <div className="text-center">
            <div className="text-6xl mb-4 animate-bounce-slow drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{emoji}</div>
            <h3 className="text-white text-xl font-black mb-3 uppercase tracking-widest drop-shadow-lg">
              {title}
            </h3>
            <div className="bg-black/30 backdrop-blur-sm rounded-xl p-4 mb-3 border border-white/20">
              <p className="text-white text-2xl font-black drop-shadow-lg">
                {winner.player.player?.nickname || 'Unknown'}
              </p>
              {winner.player.player?.jerseyNumber && (
                <p className="text-white text-base opacity-90 mt-1 font-bold">
                  #{winner.player.player.jerseyNumber}
                </p>
              )}
            </div>
            <div className="bg-white rounded-full px-6 py-3 inline-block shadow-lg">
              <span className="text-3xl font-black bg-gradient-to-r from-orange-500 to-orange-700 bg-clip-text text-transparent">
                {winner.value}
                {suffix}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderPlayerStats = (
    players: PlayerStatsWithInfo[],
    teamStats: TeamStats | undefined,
    teamName: string,
    teamEmoji: string
  ) => {
    if (players.length === 0) return null;

    const playersWithEff = players
      .map((p) => ({
        ...p,
        efficiency: calculateEfficiency(p),
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    return (
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur opacity-30 group-hover:opacity-40 transition duration-300"></div>
        <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl shadow-2xl overflow-hidden border border-orange-500/20">
          <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-orange-600 px-6 py-5">
            <h3 className="text-3xl font-black text-white flex items-center gap-3 drop-shadow-lg uppercase tracking-wide">
              <span className="text-4xl drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">{teamEmoji}</span>
              {teamName}
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full table-fixed min-w-[800px]">
              <thead className="bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800 border-b-2 border-orange-500/30">
                <tr>
                  <th className="w-48 px-2 md:px-4 py-3 md:py-4 text-left text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    Oyuncu
                  </th>
                  <th className="w-20 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    EFF
                  </th>
                  <th className="w-16 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    PTS
                  </th>
                  <th className="w-20 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    2P
                  </th>
                  <th className="w-20 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    2P %
                  </th>
                  <th className="w-20 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    3P
                  </th>
                  <th className="w-20 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    3P %
                  </th>
                  <th className="w-28 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    T-REB
                  </th>
                  <th className="w-16 px-1 md:px-4 py-3 md:py-4 text-center text-[10px] md:text-xs font-black text-orange-300 uppercase tracking-wider">
                    AST
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700/50">
                {playersWithEff.map((stat, index) => (
                  <tr
                    key={stat.id}
                    className={`hover:bg-orange-500/10 transition-all duration-200 ${index === 0 ? 'bg-gradient-to-r from-yellow-500/20 via-yellow-600/20 to-yellow-500/20 border-l-4 border-yellow-400' : ''
                      }`}
                  >
                    <td className="w-48 px-2 md:px-4 py-3 md:py-4">
                      <div className="flex items-center gap-1 md:gap-3">
                        {index === 0 && <span className="text-lg md:text-2xl drop-shadow-[0_0_10px_rgba(250,204,21,0.8)] animate-pulse">👑</span>}
                        <div className="truncate min-w-0">
                          <div className={`font-black text-xs md:text-base truncate ${index === 0 ? 'text-yellow-300' : 'text-gray-200'}`}>
                            #{stat.player?.jerseyNumber} {stat.player?.nickname || 'Unknown'}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-4 text-center">
                      <span
                        className={`text-sm md:text-lg font-black ${stat.efficiency >= 20
                          ? 'text-green-400'
                          : stat.efficiency >= 10
                            ? 'text-blue-400'
                            : stat.efficiency >= 0
                              ? 'text-gray-300'
                              : 'text-red-400'
                          }`}
                      >
                        {stat.efficiency.toFixed(1)}
                      </span>
                    </td>
                    <td className="w-16 px-1 md:px-4 py-3 md:py-4 text-center">
                      <span className="text-sm md:text-lg font-black text-orange-400">
                        {stat.totalPoints}
                      </span>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-4 text-center">
                      <div className="text-xs md:text-sm font-bold text-gray-300">
                        {stat.twoPointMade}/{stat.twoPointAttempts}
                      </div>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-4 text-center">
                      <span
                        className={`px-1 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-black ${stat.twoPointPercentage >= 50
                          ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                          : stat.twoPointPercentage >= 30
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50'
                            : 'bg-red-500/30 text-red-300 border border-red-400/50'
                          }`}
                      >
                        {formatPercentage(stat.twoPointPercentage)}
                      </span>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-4 text-center">
                      <div className="text-xs md:text-sm font-bold text-gray-300">
                        {stat.threePointMade}/{stat.threePointAttempts}
                      </div>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-4 text-center">
                      <span
                        className={`px-1 md:px-3 py-0.5 md:py-1 rounded-full text-[10px] md:text-xs font-black ${stat.threePointPercentage >= 40
                          ? 'bg-green-500/30 text-green-300 border border-green-400/50'
                          : stat.threePointPercentage >= 25
                            ? 'bg-yellow-500/30 text-yellow-300 border border-yellow-400/50'
                            : 'bg-red-500/30 text-red-300 border border-red-400/50'
                          }`}
                      >
                        {formatPercentage(stat.threePointPercentage)}
                      </span>
                    </td>
                    <td className="w-28 px-1 md:px-4 py-3 md:py-4 text-center">
                      <div className="font-bold text-gray-200 text-xs md:text-base">
                        {stat.totalRebounds}
                      </div>
                      <div className="text-[10px] md:text-xs text-gray-400 font-semibold">
                        Off:{stat.offensiveRebounds} Def:{stat.defensiveRebounds}
                      </div>
                    </td>
                    <td className="w-16 px-1 md:px-4 py-3 md:py-4 text-center">
                      <span className="font-bold text-gray-200 text-xs md:text-base">
                        {stat.assists}
                      </span>
                    </td>
                  </tr>
                ))}

                {/* Team Subtotal Row */}
                {teamStats && (
                  <tr className="bg-gradient-to-r from-orange-600/40 via-orange-500/40 to-orange-600/40 border-t-4 border-orange-400">
                    <td className="w-48 px-2 md:px-4 py-3 md:py-5" colSpan={2}>
                      <div className="font-black text-white text-sm md:text-xl uppercase tracking-wider drop-shadow-lg flex items-center gap-1 md:gap-3">
                        <span className="text-lg md:text-2xl">🏀</span>
                        <span className="truncate">TAKIM TOPLAM</span>
                      </div>
                    </td>
                    <td className="w-16 px-1 md:px-4 py-3 md:py-5 text-center">
                      <span className="text-2xl md:text-4xl font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                        {teamStats.totalPoints}
                      </span>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-5 text-center">
                      <div className="text-xs md:text-base font-black text-white">
                        {teamStats.twoPointMade}/{teamStats.twoPointAttempts}
                      </div>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-5 text-center">
                      <span className="px-1 md:px-4 py-0.5 md:py-2 rounded-full text-[10px] md:text-sm font-black bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                        {formatPercentage(teamStats.twoPointPercentage)}
                      </span>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-5 text-center">
                      <div className="text-xs md:text-base font-black text-white">
                        {teamStats.threePointMade}/{teamStats.threePointAttempts}
                      </div>
                    </td>
                    <td className="w-20 px-1 md:px-4 py-3 md:py-5 text-center">
                      <span className="px-1 md:px-4 py-0.5 md:py-2 rounded-full text-[10px] md:text-sm font-black bg-white/20 text-white border border-white/30 backdrop-blur-sm">
                        {formatPercentage(teamStats.threePointPercentage)}
                      </span>
                    </td>
                    <td className="w-28 px-1 md:px-4 py-3 md:py-5 text-center">
                      <div className="font-black text-white text-xs md:text-base">
                        {teamStats.totalRebounds}
                      </div>
                      <div className="text-[10px] md:text-xs text-white/80 font-bold">
                        Off:{teamStats.offensiveRebounds} Def:{teamStats.defensiveRebounds}
                      </div>
                    </td>
                    <td className="w-16 px-1 md:px-4 py-3 md:py-5 text-center">
                      <span className="font-black text-white text-xs md:text-base">
                        {teamStats.assists}
                      </span>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className={`flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black`}>
        <Loading />
      </div>
    );
  }

  if (error) {
    return (
      <div className={`min-h-screen flex items-center justify-center px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black`}>
        <div className="max-w-md mx-auto">
          <div className="relative group">
            <div className={`absolute -inset-0.5 bg-gradient-to-r from-red-500 to-red-600 rounded-3xl blur opacity-50 transition duration-300 `}></div>
            <div className={`relative rounded-3xl p-10 shadow-2xl text-center bg-gradient-to-br from-gray-900 to-gray-800 border border-red-500/30`}>
              <div className={`text-8xl mb-6 drop-shadow-[0_0_20px_rgba(239,68,68,0.8)]`}>❌</div>
              <h2 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-red-300 to-red-500 mb-4 uppercase tracking-wider">Hata</h2>
              <p className={`text-lg mb-8 font-semibold text-gray-300`}>{error}</p>
              <button
                onClick={() => navigate('/')}
                className="bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-black py-4 px-8 rounded-xl transition-all transform hover:scale-105 shadow-lg uppercase tracking-wider"
              >
                Ana Sayfaya Dön
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!matchDetails) return null;

  const { game, teamAStats, teamBStats, playerStats } = matchDetails;
  const teamAPlayers = playerStats.filter((p) => p.teamType === 'TEAM_A');
  const teamBPlayers = playerStats.filter((p) => p.teamType === 'TEAM_B');
  const allPlayers = [...teamAPlayers, ...teamBPlayers];
  const awards = getAwardWinners(allPlayers);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 via-orange-600 to-orange-700 rounded-3xl blur opacity-40 group-hover:opacity-60 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 via-orange-900/30 to-gray-900 rounded-3xl p-4 md:p-10 shadow-2xl border border-orange-500/30">
              <div className="flex flex-col md:flex-row items-center justify-center gap-2 md:gap-4 mb-4 md:mb-8 text-center">
                <span className="text-3xl md:text-6xl animate-pulse">🏀</span>
                <h1 className="text-xl md:text-5xl lg:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 via-orange-400 to-orange-500 drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]">
                  MAÇ #{game.gameNumber} - {formatDate(game.date)}
                </h1>
              </div>

              {/* Score Display */}
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 via-transparent to-red-500/10 rounded-2xl blur-xl"></div>
                <div className="relative bg-black/40 backdrop-blur-md rounded-2xl p-4 md:p-8 border border-orange-500/20">
                  <div className="flex items-center justify-center gap-4 md:gap-12">
                    <div className="text-center flex flex-1 flex-col items-center">
                      <div className="text-xs md:text-lg font-bold text-blue-300 mb-2 md:mb-3 uppercase tracking-wider md:tracking-widest">
                        Team A
                      </div>
                      <div className="relative inline-block mb-2 md:mb-4">
                        <div className="text-4xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-300 to-blue-500 drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">
                          {game.teamAScore}
                        </div>
                      </div>
                      {game.teamAScore > game.teamBScore && (
                        <div className="mt-auto inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-2 md:px-6 py-1 md:py-2 rounded-full text-xs md:text-base font-black uppercase tracking-wider shadow-lg shadow-yellow-500/50 animate-pulse">
                          <span className="text-base md:text-2xl">🏆</span>
                          <span>Kazanan</span>
                        </div>
                      )}
                    </div>
                    <div className="text-center">
                      <div className="text-xl md:text-4xl font-black text-orange-400 opacity-50 px-2 md:px-6">VS</div>
                    </div>
                    <div className="text-center flex flex-1 flex-col items-center">
                      <div className="text-xs md:text-lg font-bold text-red-300 mb-2 md:mb-3 uppercase tracking-wider md:tracking-widest">Team B</div>
                      <div className="relative inline-block mb-2 md:mb-4">
                        <div className="text-4xl md:text-7xl lg:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-red-300 to-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.5)]">
                          {game.teamBScore}
                        </div>
                      </div>
                      {game.teamBScore > game.teamAScore && (
                        <div className="mt-auto inline-flex items-center gap-1 md:gap-2 bg-gradient-to-r from-yellow-400 to-yellow-600 text-yellow-900 px-2 md:px-6 py-1 md:py-2 rounded-full text-xs md:text-base font-black uppercase tracking-wider shadow-lg shadow-yellow-500/50 animate-pulse">
                          <span className="text-base md:text-2xl">🏆</span>
                          <span>Kazanan</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Award Cards */}
        {awards && (
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-orange-400 to-orange-500 mb-10 text-center uppercase tracking-wider drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              🌟 Maç Ödülleri 🌟
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {renderAwardCard(
                'Efficiency King',
                '👑',
                awards.mvp,
                '',
                'bg-gradient-to-br from-purple-500 to-purple-700'
              )}
              {renderAwardCard(
                'Scoring Machine',
                '🔥',
                awards.topScorer,
                ' pts',
                'bg-gradient-to-br from-red-500 to-red-700'
              )}
              {renderAwardCard(
                'Board Boss',
                '💪',
                awards.reboundKing,
                ' reb',
                'bg-gradient-to-br from-blue-500 to-blue-700'
              )}
              {renderAwardCard(
                'Dime Dealer',
                '🎯',
                awards.assistMaster,
                ' ast',
                'bg-gradient-to-br from-green-500 to-green-700'
              )}
            </div>
          </div>
        )}

        {/* Fan Ratings MVP */}
        {gameRatings && (
          <div className="mb-12">
            <h2 className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-red-400 to-orange-400 mb-10 text-center uppercase tracking-wider drop-shadow-[0_0_20px_rgba(249,115,22,0.4)]">
              ❤️ Taraftar Oylaması ❤️
            </h2>
            <div className="max-w-md mx-auto">
              <div className="relative group">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-3xl blur opacity-50 group-hover:opacity-75 transition duration-300"></div>
                <div className="relative bg-gradient-to-br from-pink-600 via-red-600 to-orange-600 rounded-3xl p-10 shadow-2xl border border-white/20">
                  <div className="text-center">
                    <div className="text-7xl mb-6 animate-pulse drop-shadow-[0_0_20px_rgba(255,255,255,0.8)]">❤️</div>
                    {gameRatings.mvp ? (
                      <>
                        <h3 className="text-white text-3xl font-black mb-4 uppercase tracking-widest drop-shadow-lg">
                          GÖNÜLLERİN MVPsi
                        </h3>
                        <div className="bg-black/30 backdrop-blur-md rounded-2xl p-5 mb-4 border border-white/30">
                          <p className="text-white text-3xl font-black drop-shadow-lg">
                            {gameRatings.mvp.playerName}
                          </p>
                        </div>
                        <div className="flex items-center justify-center gap-4 mb-4">
                          <div className="bg-white rounded-full px-6 py-4 shadow-lg">
                            <div className="flex items-center gap-3">
                              <span className="text-4xl">⭐</span>
                              <span className="text-4xl font-black bg-gradient-to-r from-pink-500 to-orange-500 bg-clip-text text-transparent">
                                {gameRatings.mvp.averageRating.toFixed(1)}
                              </span>
                              <span className="text-xl text-gray-600 font-black">/10</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-white text-base font-bold opacity-90 mb-3">
                          {gameRatings.mvp.totalVotes} oyuncu tarafından oylandı
                        </div>
                      </>
                    ) : (
                      <>
                        <h3 className="text-white text-2xl font-black mb-4 uppercase tracking-widest drop-shadow-lg">
                          Henüz Oy Kullanılmadı
                        </h3>
                        <p className="text-white/80 text-lg mb-4">
                          Bu maç için henüz oyuncu oylaması yapılmamış.
                        </p>
                      </>
                    )}
                    <div className="pt-4 border-t border-white/30 text-white text-sm font-semibold opacity-80">
                      {gameRatings.totalVoters} / {gameRatings.totalPlayers} oyuncu oy kullandı
                    </div>
                    {gameRatings.ratings && gameRatings.ratings.length > 0 && (
                      <button
                        onClick={() => setIsRatingsListModalOpen(true)}
                        className="mt-6 w-full bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white font-bold py-3 px-6 rounded-xl transition-all border border-white/30 flex items-center justify-center gap-2 group"
                      >
                        <span>Tüm Sıralamayı Gör</span>
                        <svg
                          className="w-5 h-5 transform group-hover:translate-x-1 transition-transform"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Rating Button */}
        <div className="mb-12 flex justify-center">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 rounded-2xl blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <button
              onClick={() => setIsRatingModalOpen(true)}
              className="relative bg-gradient-to-r from-pink-500 via-red-500 to-orange-500 hover:from-pink-600 hover:via-red-600 hover:to-orange-600 text-white font-black py-5 px-10 rounded-2xl shadow-2xl transition-all transform hover:scale-110 flex items-center gap-4 text-xl border border-white/20"
            >
              <span className="text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">⭐</span>
              <span className="uppercase tracking-wider drop-shadow-lg">Oyuncuları Oyla</span>
              <span className="text-3xl drop-shadow-[0_0_10px_rgba(255,255,255,0.8)]">❤️</span>
            </button>
          </div>
        </div>

        {/* Team Selection Toggle */}
        <div className="mb-8 flex items-center justify-center gap-6">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 shadow-xl border border-orange-500/30">
              <div className="flex items-center gap-6">
                <span
                  className={`text-xl font-black transition-all uppercase tracking-wider ${!showTeamB ? 'text-blue-400 scale-110 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]' : 'text-gray-500'
                    }`}
                >
                  🔵 Team A
                </span>
                <button
                  onClick={() => setShowTeamB(!showTeamB)}
                  className={`relative inline-flex h-10 w-20 items-center rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-orange-500/50 ${showTeamB ? 'bg-gradient-to-r from-red-500 to-red-600' : 'bg-gradient-to-r from-blue-500 to-blue-600'
                    } shadow-lg`}
                >
                  <span
                    className={`inline-block h-8 w-8 transform rounded-full bg-white shadow-xl transition-transform ${showTeamB ? 'translate-x-11' : 'translate-x-1'
                      }`}
                  />
                </button>
                <span
                  className={`text-xl font-black transition-all uppercase tracking-wider ${showTeamB ? 'text-red-400 scale-110 drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]' : 'text-gray-500'
                    }`}
                >
                  🔴 Team B
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Player Stats */}
        <div className="mb-8">
          {!showTeamB
            ? renderPlayerStats(teamAPlayers, teamAStats, 'Team A', '🔵')
            : renderPlayerStats(teamBPlayers, teamBStats, 'Team B', '🔴')}
        </div>

        {/* Videos */}
        <div className="mb-8">
          {videosLoading ? (
            <div className="py-12">
              <Loading />
            </div>
          ) : (
            <VideoGallery
              videos={videos}
              title="🎥 Maç Videoları"
              emptyMessage="Bu maça ait video eklenmemiş"
            />
          )}
        </div>

        {/* AI Analysis */}
        {game.aiAnalysis && (
          <div className="mb-8 relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 via-gray-800 to-black rounded-3xl p-8 shadow-[0_0_30px_-5px_rgba(168,85,247,0.4)] border border-purple-500/20">
              <div className="flex items-center gap-3 mb-6">
                <div className="text-4xl">🤖</div>
                <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-pink-400 to-orange-400">
                  AI Maç Analizi
                </h3>
              </div>
              <div className="prose prose-invert prose-lg max-w-none">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-400 mb-4 mt-8">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-400 mb-3 mt-6">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-xl font-semibold text-cyan-300 mb-2 mt-4">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-gray-300 leading-relaxed mb-4">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="list-disc list-inside text-gray-300 space-y-2 mb-4">
                        {children}
                      </ul>
                    ),
                    ol: ({ children }) => (
                      <ol className="list-decimal list-inside text-gray-300 space-y-2 mb-4">
                        {children}
                      </ol>
                    ),
                    li: ({ children }) => (
                      <li className="text-gray-300 ml-4">
                        {children}
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="text-orange-400 font-bold">
                        {children}
                      </strong>
                    ),
                  }}
                >
                  {game.aiAnalysis}
                </ReactMarkdown>
              </div>
              <div className="mt-6 pt-6 border-t border-purple-500/20">
                <p className="text-xs text-gray-500 text-center italic">
                  Bu analiz OpenAI tarafından otomatik olarak oluşturulmuştur
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        {game.notes && (
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300"></div>
            <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-blue-500/30">
              <h3 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-blue-500 mb-4 flex items-center gap-3 uppercase tracking-wider">
                <span className="text-4xl">📝</span> Notlar
              </h3>
              <p className="text-gray-200 text-lg leading-relaxed font-medium">{game.notes}</p>
            </div>
          </div>
        )}
      </div>

      {/* Rating Modal */}
      {gameId && (
        <PlayerRatingModal
          isOpen={isRatingModalOpen}
          onClose={() => {
            setIsRatingModalOpen(false);
            // Refresh ratings after modal closes
            if (gameId) {
              fetchGameRatings(gameId);
            }
          }}
          gameId={gameId}
          playersInGame={allPlayers.map((stat) => ({
            player: stat.player!,
            stats: stat,
          }))}
        />
      )}

      {/* Ratings List Modal */}
      <PlayerRatingsListModal
        isOpen={isRatingsListModalOpen}
        onClose={() => setIsRatingsListModalOpen(false)}
        gameRatings={gameRatings}
      />
    </div>
  );
};
