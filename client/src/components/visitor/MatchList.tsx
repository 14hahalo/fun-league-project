import type { Game } from '../../types/basketball.types';
import { isMatchExcludedFromStats } from '../../utils/gameUtils';

interface MatchListProps {
  games: Game[];
  onMatchClick: (gameId: string) => void;
}

export const MatchList = ({ games, onMatchClick }: MatchListProps) => {
  const formatDate = (date: Date | string) => {
    const d = new Date(date);
    return d.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    });
  };

  const getStatusBadgeClass = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-[0_0_10px_rgba(34,197,94,0.5)]';
      case 'IN_PROGRESS':
        return 'bg-gradient-to-r from-yellow-500 to-amber-600 text-white shadow-[0_0_10px_rgba(245,158,11,0.5)]';
      case 'SCHEDULED':
        return 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-[0_0_10px_rgba(59,130,246,0.5)]';
      case 'CANCELLED':
        return 'bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-[0_0_10px_rgba(239,68,68,0.5)]';
      default:
        return 'bg-gray-700 text-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'Tamamlandı';
      case 'IN_PROGRESS':
        return 'Devam Ediyor';
      case 'SCHEDULED':
        return 'Planlandı';
      case 'CANCELLED':
        return 'İptal Edildi';
      default:
        return status;
    }
  };

  const getWinnerClass = (scoreA: number, scoreB: number, team: 'A' | 'B') => {
    if (team === 'A') {
      return scoreA > scoreB ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-white/5';
    }
    return scoreB > scoreA ? 'ring-2 ring-amber-400 bg-amber-500/10 shadow-[0_0_15px_rgba(251,191,36,0.3)]' : 'bg-white/5';
  };

  if (games.length === 0) {
    return (
      <div className="mt-12 text-center py-16 relative group">
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 via-cyan-500/10 to-orange-500/10 rounded-3xl blur-xl"></div>
        <div className="relative bg-[#0e1116]/80 backdrop-blur-xl rounded-3xl border border-white/10 shadow-[0_0_50px_-5px_rgba(255,165,0,0.3)] p-12">
          <div className="text-8xl mb-6 animate-bounce">🏀</div>
          <p className="text-2xl md:text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400">
            Henüz maç kaydı bulunmuyor
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {games.map((game) => {
        const excluded = isMatchExcludedFromStats(game);
        return (
        <div
          key={game.id}
          onClick={() => onMatchClick(game.id)}
          className="relative group cursor-pointer"
        >
          <div className={`absolute -inset-0.5 bg-gradient-to-r rounded-2xl blur transition duration-300 ${
            excluded
              ? 'from-slate-600 via-slate-500 to-slate-600 opacity-20 group-hover:opacity-40'
              : 'from-orange-500 via-amber-500 to-cyan-500 opacity-30 group-hover:opacity-60'
          }`}></div>

          <div className="relative bg-[#0e1116]/90 backdrop-blur-xl rounded-2xl overflow-hidden border border-white/10 shadow-[0_0_30px_-5px_rgba(255,165,0,0.3)] transform transition-all duration-300 hover:scale-105 hover:-translate-y-2">
            <div className={`px-4 py-3 ${excluded ? 'bg-gradient-to-r from-slate-700 via-slate-600 to-slate-700' : 'bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm md:text-base font-black text-white tracking-wide">
                    Maç #{game.gameNumber}
                  </span>
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStatusBadgeClass(
                      game.status
                    )}`}
                  >
                    {getStatusText(game.status)}
                  </span>
                  {excluded && (
                    <span
                      title="Bu maç istatistiklere dahil edilmemiştir"
                      className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-500/40 text-slate-300 border border-slate-500/50 tracking-wide"
                    >
                      İstatistik Dışı
                    </span>
                  )}
                </div>
              </div>
              <div className="text-xs font-medium text-white/90 mt-1.5 flex items-center gap-1">
                <span>📅</span>
                <span>{formatDate(game.date)}</span>
              </div>
            </div>

            <div className="p-5">
              <div className="flex items-center justify-between gap-4">
                <div className={`flex-1 text-center rounded-xl p-4 backdrop-blur-md transition-all duration-300 ${getWinnerClass(game.teamAScore, game.teamBScore, 'A')}`}>
                  <div className="text-xs font-bold text-gray-300 mb-2 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <span className="text-lg">🔵</span>
                    <span>Team A</span>
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-br from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                    {game.teamAScore}
                  </div>
                  {game.teamAScore > game.teamBScore && (
                    <div className="mt-2 animate-pulse">
                      <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">🏆</span>
                    </div>
                  )}
                </div>

                <div className="text-xl md:text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-cyan-400 px-2">
                  VS
                </div>

                <div className={`flex-1 text-center rounded-xl p-4 backdrop-blur-md transition-all duration-300 ${getWinnerClass(game.teamAScore, game.teamBScore, 'B')}`}>
                  <div className="text-xs font-bold text-gray-300 mb-2 flex items-center justify-center gap-1.5 uppercase tracking-wider">
                    <span className="text-lg">🔴</span>
                    <span>Team B</span>
                  </div>
                  <div className="text-5xl font-black bg-gradient-to-br from-orange-400 via-amber-400 to-cyan-400 bg-clip-text text-transparent drop-shadow-lg">
                    {game.teamBScore}
                  </div>
                  {game.teamBScore > game.teamAScore && (
                    <div className="mt-2 animate-pulse">
                      <span className="text-2xl drop-shadow-[0_0_8px_rgba(251,191,36,0.8)]">🏆</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-cyan-500/10 px-4 py-3 border-t border-white/10 backdrop-blur-md">
              <div className="text-center text-orange-300 text-sm font-bold group-hover:text-orange-200 transition-colors">
                <span className="group-hover:translate-x-1 transition-transform inline-block flex items-center justify-center gap-2">
                  <span>Detaylı İstatistikler</span>
                  <span className="text-cyan-400">→</span>
                </span>
              </div>
            </div>
          </div>
        </div>
        );
      })}
    </div>
  );
};
