import { useState, useEffect, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { PlayerCard } from '../components/visitor/PlayerCard';
import { PlayerDetailsModal } from '../components/visitor/PlayerDetailsModal';
import { Loading } from '../components/shared/Loading';
import type { Player, Position } from '../types/player.types';
import { PlayerRole } from '../types/player.types';
import type { PlayerStats } from '../types/basketball.types';
import { playerStatsApi } from '../api/basketballApi';
import type { TopPlayerStats } from '../hooks/useTopPlayers';

export const PlayersPage = () => {
  const { players: allPlayers, loading, error } = usePlayers(false); 

  const players = useMemo(() =>
    allPlayers.filter(player => player.role === PlayerRole.PLAYER || !player.role),
    [allPlayers]
  );
  const [selectedPlayer, setSelectedPlayer] = useState<Player | null>(null);
  const [selectedLetter, setSelectedLetter] = useState<string | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null);
  const [playerStatsMap, setPlayerStatsMap] = useState<Map<string, TopPlayerStats>>(new Map());

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

  const calculatePlayerAverages = (stats: PlayerStats[], player: Player): TopPlayerStats => {
    if (stats.length === 0) {
      return {
        playerId: player.id,
        playerNickname: player.nickname,
        playerPhotoUrl: player.photoUrl,
        playerPosition: player.position,
        playerJerseyNumber: player.jerseyNumber,
        totalPoints: 0,
        totalRebounds: 0,
        totalAssists: 0,
        shootingPercentage: 0,
        gamesPlayed: 0,
      };
    }

    const totals = stats.reduce(
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

    const gamesPlayed = stats.length;
    const avgPoints = totals.points / gamesPlayed;
    const avgRebounds = totals.rebounds / gamesPlayed;
    const avgAssists = totals.assists / gamesPlayed;
    const twoPointPct = totals.twoPointAttempts > 0 ? (totals.twoPointMade / totals.twoPointAttempts) * 100 : 0;
    const threePointPct = totals.threePointAttempts > 0 ? (totals.threePointMade / totals.threePointAttempts) * 100 : 0;
    const overallShootingPct = (totals.twoPointAttempts + totals.threePointAttempts) > 0
      ? ((totals.twoPointMade + totals.threePointMade) / (totals.twoPointAttempts + totals.threePointAttempts)) * 100
      : 0;

    return {
      playerId: player.id,
      playerNickname: player.nickname,
      playerPhotoUrl: player.photoUrl,
      playerPosition: player.position,
      playerJerseyNumber: player.jerseyNumber,
      totalPoints: avgPoints,
      totalRebounds: avgRebounds,
      totalAssists: avgAssists,
      shootingPercentage: overallShootingPct,
      gamesPlayed: gamesPlayed,
      efficiency: totals.efficiency / gamesPlayed,
      twoPointPercentage: twoPointPct,
      threePointPercentage: threePointPct,
    } as TopPlayerStats & { efficiency: number; twoPointPercentage: number; threePointPercentage: number };
  };

  useEffect(() => {
    const fetchAllPlayerStats = async () => {
      const statsMap = new Map<string, TopPlayerStats>();

      try {
        const playerIds = players.map(p => p.id);
        const bulkStats = await playerStatsApi.getBulkPlayerStats(playerIds);

        players.forEach((player) => {
          const stats = bulkStats[player.id] || [];
          const averages = calculatePlayerAverages(stats, player);
          statsMap.set(player.id, averages);
        });

        setPlayerStatsMap(statsMap);
      } catch (err) {
        players.forEach((player) => {
          statsMap.set(player.id, calculatePlayerAverages([], player));
        });
        setPlayerStatsMap(statsMap);
      }
    };

    if (players.length > 0) {
      fetchAllPlayerStats();
    }

  }, [players.map(p => p.id).join(',')]);

  const groupedPlayers = useMemo(() => {
    const grouped: Record<string, Player[]> = {};

    players.forEach((player) => {
      const firstLetter = player.firstName!.charAt(0).toUpperCase();
      if (!grouped[firstLetter]) {
        grouped[firstLetter] = [];
      }
      grouped[firstLetter].push(player);
    });
    Object.keys(grouped).forEach((letter) => {
      grouped[letter].sort((a, b) => a.firstName!.localeCompare(b.firstName!));
    });

    return grouped;
  }, [players]);

  const availableLetters = useMemo(() => Object.keys(groupedPlayers).sort(), [groupedPlayers]);

  const availablePositions = useMemo(() =>
    Array.from(new Set(players.filter(p => p.position).map(p => p.position!))) as Position[],
    [players]
  );

  let filteredPlayers = players;

  if (selectedLetter) {
    filteredPlayers = groupedPlayers[selectedLetter] || [];
  }

  if (selectedPosition) {
    filteredPlayers = filteredPlayers.filter(p => p.position === selectedPosition);
  }

  const handlePlayerClick = (player: Player) => {
    setSelectedPlayer(player);
  };

  const handleCloseModal = () => {
    setSelectedPlayer(null);
  };

  const handleLetterClick = (letter: string) => {
    setSelectedLetter(selectedLetter === letter ? null : letter);
  };

  const handlePositionClick = (position: Position) => {
    setSelectedPosition(selectedPosition === position ? null : position);
  };

  if (loading) return <Loading />;

  return (
    <div className={`min-h-screen py-12 px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black`}>
      <div className="max-w-8xl mx-auto">
        <div className="text-center mb-12">
          <h1 className={`text-6xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-cyan-400 mb-4 tracking-tight drop-shadow-[0_0_30px_rgba(249,115,22,0.5)]`}>
             Katılımcılar
          </h1>
          <div className="mt-6 flex items-center justify-center gap-3">
            <div className="h-[2px] w-16 md:w-24 bg-gradient-to-r from-transparent to-orange-500"></div>
            <span className={`text-xs md:text-sm uppercase tracking-widest font-bold text-orange-300`}>
              Tüm Oyuncular
            </span>
            <div className="h-[2px] w-16 md:w-24 bg-gradient-to-l from-transparent to-orange-500"></div>
          </div>
        </div>

        {error && (
          <div className={`border-2 border-red-500 px-6 py-4 rounded-xl text-center mb-12 bg-red-500/20 text-red-200 backdrop-blur-md shadow-[0_0_20px_rgba(239,68,68,0.3)]`}>
            {error}
          </div>
        )}

        <div className={`flex flex-col md:flex-row justify-center gap-6 font-[Inter] mb-8 text-gray-100`}>
          {availablePositions.length > 0 && (
            <div className="relative group w-full md:w-auto p-[1px] rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-cyan-400 hover:from-cyan-400 hover:to-orange-500 transition-all">
              <div className="bg-[#0e1116]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 flex flex-col items-center shadow-[0_0_25px_-5px_rgba(255,165,0,0.3)]">
                <h2 className="text-xs tracking-[0.15em] font-bold text-gray-300 mb-3 uppercase">
                  Pozisyon Filtrele
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {availablePositions.map((position) => (
                    <button
                      key={position}
                      onClick={() => handlePositionClick(position)}
                      className={`px-3 py-1.5 rounded-full text-xs uppercase font-semibold tracking-wide border border-transparent transition-all duration-200
                ${selectedPosition === position
                          ? 'bg-gradient-to-r from-orange-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(255,165,0,0.5)] scale-105'
                          : 'bg-white/5 text-gray-300 hover:text-white hover:border-orange-400 hover:bg-white/10'
                        }`}
                    >
                      {position}
                    </button>
                  ))}
                  {selectedPosition && (
                    <button
                      onClick={() => setSelectedPosition(null)}
                      className="px-3 py-1.5 rounded-full text-xs font-semibold bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                    >
                      ✕ Temizle
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {availableLetters.length > 0 && (
            <div className="relative group w-full md:w-auto p-[1px] rounded-2xl bg-gradient-to-br from-orange-400 via-amber-500 to-cyan-400 hover:from-cyan-400 hover:to-orange-500 transition-all">
              <div className="bg-[#0e1116]/90 backdrop-blur-xl rounded-2xl p-4 md:p-5 flex flex-col items-center shadow-[0_0_25px_-5px_rgba(255,165,0,0.3)]">
                <h2 className="text-xs tracking-[0.15em] font-bold text-gray-300 mb-3 uppercase">
                  Harf Filtrele
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {availableLetters.map((letter) => (
                    <button
                      key={letter}
                      onClick={() => handleLetterClick(letter)}
                      className={`w-9 h-9 rounded-full font-semibold text-sm border border-transparent transition-all duration-200
                ${selectedLetter === letter
                          ? 'bg-gradient-to-br from-orange-500 to-cyan-500 text-white shadow-[0_0_15px_rgba(255,165,0,0.5)] scale-110'
                          : 'bg-white/5 text-gray-300 hover:text-white hover:border-orange-400 hover:bg-white/10'
                        }`}
                    >
                      {letter}
                    </button>
                  ))}
                  {selectedLetter && (
                    <button
                      onClick={() => setSelectedLetter(null)}
                      className="px-3 h-9 rounded-full font-semibold text-xs bg-red-500/10 text-red-300 hover:bg-red-500/20 hover:text-white transition-colors"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {(selectedLetter || selectedPosition) && (
          <div className="mt-8 mb-6 text-center">
            <div className="flex flex-wrap justify-center gap-3">
              {selectedPosition && (
                <span className="inline-block bg-gradient-to-r from-orange-500 to-cyan-500 text-white px-5 py-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,165,0,0.5)] tracking-wide border border-orange-400/30">
                  Pozisyon: {selectedPosition}
                </span>
              )}
              {selectedLetter && (
                <span className="inline-block bg-gradient-to-r from-orange-500 to-cyan-500 text-white px-5 py-2 rounded-full font-bold text-sm shadow-[0_0_20px_rgba(255,165,0,0.5)] tracking-wide border border-orange-400/30">
                  Harf: "{selectedLetter}"
                </span>
              )}
              <span className="inline-block bg-white/10 text-white px-5 py-2 rounded-full font-bold text-sm shadow-[0_0_15px_rgba(255,255,255,0.2)] backdrop-blur-md border border-white/20">
                {filteredPlayers.length} oyuncu
              </span>
            </div>
          </div>
        )}


        {filteredPlayers.length === 0 ? (
          <div className="mt-12 text-center py-16 relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-cyan-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
            <div className="relative bg-[#0e1116]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_-5px_rgba(255,165,0,0.3)] p-12">
              <div className="text-8xl mb-6 animate-bounce">🏀</div>
              <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400">
                {selectedLetter || selectedPosition
                  ? 'Seçilen filtrelere uygun oyuncu bulunamadı'
                  : 'Henüz aktif oyuncu bulunmuyor'}
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredPlayers.map((player) => {
              const playerStats = playerStatsMap.get(player.id);

              if (!playerStats) {
                return (
                  <div
                    key={player.id}
                    className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2 opacity-50"
                  >
                    <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 text-center text-white">
                      <p>Yükleniyor...</p>
                    </div>
                  </div>
                );
              }

              const extendedStats = playerStats as TopPlayerStats & {
                efficiency?: number;
                twoPointPercentage?: number;
                threePointPercentage?: number;
              };

              const gradients = [
                'from-yellow-500 via-yellow-600 to-yellow-700',
                'from-orange-600 via-orange-700 to-orange-800',
                'from-gray-400 via-gray-500 to-gray-600',
                'from-blue-500 via-blue-600 to-blue-700',
                'from-purple-500 via-purple-600 to-purple-700',
              ];
              const gradient = gradients[Math.floor(Math.random() * gradients.length)];

              return (
                <div
                  key={player.id}
                  onClick={() => handlePlayerClick(player)}
                  className="cursor-pointer transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                >
                  <PlayerCard
                    player={playerStats}
                    title={player.position || 'PLAYER'}
                    mainStat={{
                      label: 'AVG PTS',
                      value: extendedStats.totalPoints?.toFixed(1) || '0.0',
                    }}
                    gradient={gradient}
                    icon=""
                  />
                </div>
              );
            })}
          </div>
        )}

        {!selectedLetter && !selectedPosition && (
          <div className="text-center mt-16 mb-8">
            <div className="relative inline-block group">
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 rounded-2xl blur-lg opacity-60 group-hover:opacity-100 transition-opacity"></div>
              <div className="relative bg-[#0e1116]/90 backdrop-blur-xl border border-orange-400/30 rounded-2xl px-8 py-5 shadow-[0_0_30px_-5px_rgba(255,165,0,0.4)]">
                <p className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-400 to-cyan-400 tracking-wide">
                  Toplam Aktif Oyuncu: {players.length}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {selectedPlayer && (
        <PlayerDetailsModal player={selectedPlayer} onClose={handleCloseModal} />
      )}
    </div>
  );
};
