import type { FC } from 'react';

interface RawEvent {
  period: string;
  actor: string;
  event: string;
}

interface GameFlowStatsProps {
  events: RawEvent[];
  playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>;
}

const SCORING: Record<string, number> = { '2PM': 2, '3PM': 3 };

function computeFlowStats(events: RawEvent[], playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>) {
  let scoreA = 0;
  let scoreB = 0;
  const diffs: number[] = [0];
  const deltas: { team: 'A' | 'B'; pts: number }[] = [];

  for (const ev of events) {
    const pts = SCORING[ev.event];
    if (pts === undefined) continue;
    const team = playerTeams[ev.actor];
    if (!team) continue;

    if (team === 'TEAM_A') {
      scoreA += pts;
      deltas.push({ team: 'A', pts });
    } else {
      scoreB += pts;
      deltas.push({ team: 'B', pts });
    }
    diffs.push(scoreA - scoreB);
  }

  // Takımların öne geçme sayısı
  const peakA = Math.max(0, ...diffs);
  const peakB = Math.abs(Math.min(0, ...diffs));

  // Maç içindeki skor eşitliği sayısı
  const tieCount = diffs.slice(1).filter((d) => d === 0).length;

  // En uzun seri
  let currentRunTeam: 'A' | 'B' | null = null;
  let currentRunPts = 0;
  let bestRunTeam: 'A' | 'B' = 'A';
  let bestRunPts = 0;

  for (const { team, pts } of deltas) {
    if (team === currentRunTeam) {
      currentRunPts += pts;
    } else {
      if (currentRunPts > bestRunPts) {
        bestRunPts = currentRunPts;
        bestRunTeam = currentRunTeam!;
      }
      currentRunTeam = team;
      currentRunPts = pts;
    }
  }
  if (currentRunPts > bestRunPts && currentRunTeam !== null) {
    bestRunPts = currentRunPts;
    bestRunTeam = currentRunTeam;
  }

  // Takımların kaç kez öne geçtiğini hesaplaması için
  let leadA = 0;
  let leadB = 0;
  let prevLeader: 'A' | 'B' | null = null;

  for (const diff of diffs.slice(1)) {
    if (diff > 0 && prevLeader !== 'A') {
      leadA++;
      prevLeader = 'A';
    } else if (diff < 0 && prevLeader !== 'B') {
      leadB++;
      prevLeader = 'B';
    }
  }

  return { peakA, peakB, tieCount, bestRunTeam, bestRunPts, leadA, leadB };
}

export const GameFlowStats: FC<GameFlowStatsProps> = ({ events, playerTeams }) => {
  const { peakA, peakB, tieCount, bestRunTeam, bestRunPts, leadA, leadB } =
    computeFlowStats(events, playerTeams);

  return (
    <div className="relative group">
      <div className="absolute -inset-0.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-3xl blur opacity-30 group-hover:opacity-50 transition duration-300" />
      <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl p-8 shadow-2xl border border-orange-500/30">
        <h3 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-300 to-orange-500 mb-6 flex items-center justify-center gap-3 uppercase tracking-wider">
          Maç Akışı
        </h3>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 ">
          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
              En Yüksek Fark
            </p>
            <div className="flex gap-3 w-full">
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs font-semibold text-blue-400">Team A</p>
                <p className="text-xl font-black text-blue-300">+{peakA}</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs font-semibold text-red-400">Team B</p>
                <p className="text-xl font-black text-red-300">+{peakB}</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
              Beraberlik
            </p>
            {tieCount === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center">Hiç beraberlik olmadı</p>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-3xl font-black text-yellow-300">{tieCount}</p>
                <p className="text-xs text-gray-400 mt-1">kez berabere geldi</p>
              </div>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
              En Uzun Seri
            </p>
            {bestRunPts === 0 ? (
              <p className="text-gray-400 text-sm font-medium text-center">Veri yok</p>
            ) : (
              <div className="flex flex-col items-center">
                <p className="text-3xl font-black text-white">{bestRunPts}-0</p>
                <p className={`text-xs mt-1 font-semibold ${bestRunTeam === 'A' ? 'text-blue-400' : 'text-red-400'}`}>
                  Team {bestRunTeam}
                </p>
              </div>
            )}
          </div>

          <div className="bg-gray-800/50 rounded-2xl p-4 border border-gray-700/50 flex flex-col items-center">
            <p className="text-xs font-bold uppercase tracking-widest text-gray-400 mb-3 text-center">
              Öne Geçme
            </p>
            <div className="flex gap-3 w-full">
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs font-semibold text-blue-400">Team A</p>
                <p className="text-xl font-black text-white">{leadA}x</p>
              </div>
              <div className="w-px bg-gray-700" />
              <div className="flex-1 flex flex-col items-center">
                <p className="text-xs font-semibold text-red-400">Team B</p>
                <p className="text-xl font-black text-white">{leadB}x</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
