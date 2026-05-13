import type { PlayerStatsWithInfo } from '../../hooks/useMatchDetails';

interface TeamComparisonChartProps {
  teamAPlayers: PlayerStatsWithInfo[];
  teamBPlayers: PlayerStatsWithInfo[];
  teamAName?: string;
  teamBName?: string;
  teamAColor?: string;
  teamBColor?: string;
}

interface StatRow {
  label: string;
  valA: number;
  valB: number;
  format: (v: number) => string;
}

const calcEff = (p: PlayerStatsWithInfo) =>
  Math.round(
    (2 * p.twoPointMade +
      3 * p.threePointMade +
      1.5 * p.assists +
      0.8 * p.defensiveRebounds +
      1.2 * p.offensiveRebounds -
      (0.8 * (p.twoPointAttempts - p.twoPointMade) +
        1.2 * (p.threePointAttempts - p.threePointMade))) *
      10
  ) / 10;

function buildRows(
  a: PlayerStatsWithInfo[],
  b: PlayerStatsWithInfo[]
): StatRow[] {
  const sum = (arr: PlayerStatsWithInfo[], fn: (p: PlayerStatsWithInfo) => number) =>
    arr.reduce((acc, p) => acc + fn(p), 0);

  const pct = (made: number, att: number) => (att === 0 ? 0 : (made / att) * 100);

  const twoMadeA = sum(a, (p) => p.twoPointMade);
  const twoAttA  = sum(a, (p) => p.twoPointAttempts);
  const twoMadeB = sum(b, (p) => p.twoPointMade);
  const twoAttB  = sum(b, (p) => p.twoPointAttempts);

  const threeMadeA = sum(a, (p) => p.threePointMade);
  const threeAttA  = sum(a, (p) => p.threePointAttempts);
  const threeMadeB = sum(b, (p) => p.threePointMade);
  const threeAttB  = sum(b, (p) => p.threePointAttempts);

  const avgEff = (arr: PlayerStatsWithInfo[]) =>
    arr.length === 0 ? 0 : sum(arr, calcEff) / arr.length;

  const fmt0 = (v: number) => v.toFixed(0);
  const fmtPct = (v: number) => `${v.toFixed(1)}%`;
  const fmt1 = (v: number) => v.toFixed(1);

  return [
    { label: 'PTS',  valA: sum(a, (p) => p.totalPoints),        valB: sum(b, (p) => p.totalPoints),        format: fmt0 },
    { label: 'OREB', valA: sum(a, (p) => p.offensiveRebounds),  valB: sum(b, (p) => p.offensiveRebounds),  format: fmt0 },
    { label: 'DREB', valA: sum(a, (p) => p.defensiveRebounds),  valB: sum(b, (p) => p.defensiveRebounds),  format: fmt0 },
    { label: 'AST',  valA: sum(a, (p) => p.assists),            valB: sum(b, (p) => p.assists),            format: fmt0 },
    { label: '2PT%', valA: pct(twoMadeA, twoAttA),              valB: pct(twoMadeB, twoAttB),              format: fmtPct },
    { label: '3PT%', valA: pct(threeMadeA, threeAttA),          valB: pct(threeMadeB, threeAttB),          format: fmtPct },
    { label: 'EFF',  valA: avgEff(a),                           valB: avgEff(b),                           format: fmt1 },
  ];
}

export const TeamComparisonChart = ({
  teamAPlayers,
  teamBPlayers,
  teamAName = 'Team A',
  teamBName = 'Team B',
  teamAColor = '#2563eb',
  teamBColor = '#e85d5d',
}: TeamComparisonChartProps) => {
  const rows = buildRows(teamAPlayers, teamBPlayers);

  // Global max across all stats and both teams so bars are proportional to each other
  const globalMax = Math.max(...rows.map((r) => Math.max(r.valA, r.valB)), 0.001);

  return (
    <div className="w-full">
      {/* Legend */}
      <div className="flex items-center justify-center gap-4 mb-5">
        {[{ name: teamAName, color: teamAColor }, { name: teamBName, color: teamBColor }].map(({ name, color }) => (
          <span
            key={name}
            className="text-white font-semibold text-[13px]"
            style={{
              backgroundColor: color,
              borderRadius: 6,
              padding: '4px 12px',
              boxShadow: `0 0 8px ${color}66`,
              border: `1px solid ${color}`,
            }}
          >
            {name}
          </span>
        ))}
      </div>

      {/* Rows */}
      <div className="flex flex-col gap-2">
        {rows.map(({ label, valA, valB, format }) => {
          const pctA = (valA / globalMax) * 100;
          const pctB = (valB / globalMax) * 100;

          return (
            <div key={label} className="flex items-center gap-2">
              {/* Team A bar — grows right-to-left */}
              <div className="flex-1 flex items-center justify-end gap-1.5">
                <span className="text-xs font-black tabular-nums" style={{ color: teamAColor }}>
                  {format(valA)}
                </span>
                <div className="flex-1 flex justify-end h-5">
                  <div
                    className="h-full rounded-l-sm transition-all duration-500"
                    style={{ width: `${pctA}%`, backgroundColor: teamAColor, opacity: 0.85 }}
                  />
                </div>
              </div>

              {/* Stat label */}
              <div className="w-10 shrink-0 text-center text-[11px] font-black uppercase tracking-wider text-gray-400">
                {label}
              </div>

              {/* Team B bar — grows left-to-right */}
              <div className="flex-1 flex items-center gap-1.5">
                <div className="flex-1 h-5">
                  <div
                    className="h-full rounded-r-sm transition-all duration-500"
                    style={{ width: `${pctB}%`, backgroundColor: teamBColor, opacity: 0.85 }}
                  />
                </div>
                <span className="text-xs font-black tabular-nums" style={{ color: teamBColor }}>
                  {format(valB)}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
