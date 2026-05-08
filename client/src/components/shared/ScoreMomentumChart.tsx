import {
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RawEvent {
  period: string;
  actor: string;
  event: string;
}

interface ScoreMomentumChartProps {
  events: RawEvent[];
  playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>;
}

interface DataPoint {
  index: number;
  diff: number;
  scoreA: number;
  scoreB: number;
  label: string;
  period: string;
}

const SCORING_EVENTS: Record<string, number> = {
  '2PM': 2,
  '3PM': 3,
};

function buildChartData(events: RawEvent[], playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>): {
  data: DataPoint[];
  // index=0 means "place label at chart origin (no divider line)"
  // index>0 means "draw a divider line at this x position"
  periodBoundaries: { index: number; period: string; isFirst: boolean }[];
} {
  const data: DataPoint[] = [{ index: 0, diff: 0, scoreA: 0, scoreB: 0, label: 'Başlangıç', period: '' }];
  const periodBoundaries: { index: number; period: string; isFirst: boolean }[] = [];
  const seenPeriods = new Set<string>();

  let scoreA = 0;
  let scoreB = 0;

  for (const ev of events) {
    const pts = SCORING_EVENTS[ev.event];
    if (pts === undefined) continue;

    const team = playerTeams[ev.actor];
    if (!team) continue;

    if (!seenPeriods.has(ev.period)) {
      seenPeriods.add(ev.period);
      // First period: label at chart origin (x=0), no divider line
      // Subsequent periods: divider line at the boundary index
      const isFirst = periodBoundaries.length === 0;
      periodBoundaries.push({ index: isFirst ? 0 : data.length, period: ev.period, isFirst });
    }

    if (team === 'TEAM_A') scoreA += pts;
    else scoreB += pts;

    data.push({
      index: data.length,
      diff: scoreA - scoreB,
      scoreA,
      scoreB,
      label: `${ev.actor} ${ev.event === '2PM' ? '+2' : '+3'}`,
      period: ev.period,
    });
  }

  return { data, periodBoundaries };
}

const CustomTooltip = ({ active, payload }: any) => {
  if (!active || !payload || !payload.length) return null;
  const d: DataPoint = payload[0].payload;
  return (
    <div className="bg-gray-900 border border-gray-600 rounded-lg px-3 py-2 text-sm shadow-xl">
      {d.label && <p className="text-orange-400 font-bold mb-1">{d.label}</p>}
      {d.period && <p className="text-gray-400 text-xs mb-1">{d.period}</p>}
      <p className="text-blue-300">Team A: <span className="font-bold text-white">{d.scoreA}</span></p>
      <p className="text-red-300">Team B: <span className="font-bold text-white">{d.scoreB}</span></p>
      <p className={`font-bold mt-1 ${d.diff > 0 ? 'text-blue-300' : d.diff < 0 ? 'text-red-300' : 'text-gray-300'}`}>
        Fark: {d.diff > 0 ? '+' : ''}{d.diff}
      </p>
    </div>
  );
};

export const ScoreMomentumChart = ({ events, playerTeams }: ScoreMomentumChartProps) => {
  const { data, periodBoundaries } = buildChartData(events, playerTeams);

  if (data.length <= 1) {
    return (
      <div className="flex items-center justify-center h-40 text-gray-500">
        Grafik için yeterli veri yok
      </div>
    );
  }

  const diffs = data.map((d) => d.diff);
  const peakA = Math.max(...diffs, 0);
  const peakB = Math.abs(Math.min(...diffs, 0));
  const maxDiff = peakA;
  const minDiff = -peakB;
  const range = maxDiff - minDiff;

  const zeroOffset = range === 0 ? 0.5 : maxDiff / range;
  const gradientId = 'scoreMomentumGradient';

  return (
    <div style={{ width: '100%', height: 320 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 10, right: 56, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
              <stop offset={`${(zeroOffset * 100).toFixed(1)}%`} stopColor="#3b82f6" stopOpacity={0.6} />
              <stop offset={`${(zeroOffset * 100).toFixed(1)}%`} stopColor="#ef4444" stopOpacity={0.6} />
            </linearGradient>
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke="#374151" vertical={false} />

          <XAxis dataKey="index" hide />

          <YAxis
            domain={[minDiff - 2, maxDiff + 2]}
            tickLine={false}
            axisLine={false}
            tick={{ fill: '#9ca3af', fontSize: 10 }}
            width={28}
          />

          <Tooltip content={<CustomTooltip />} />

          <ReferenceLine y={0} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" />

          {peakA > 0 && (
            <ReferenceLine
              y={peakA}
              stroke="#3b82f6"
              strokeWidth={1}
              strokeDasharray="5 3"
              label={{ value: `+${peakA}`, position: 'right', fill: '#93c5fd', fontSize: 11, fontWeight: 700 }}
            />
          )}

          {peakB > 0 && (
            <ReferenceLine
              y={-peakB}
              stroke="#ef4444"
              strokeWidth={1}
              strokeDasharray="5 3"
              label={{ value: `+${peakB}`, position: 'right', fill: '#fca5a5', fontSize: 11, fontWeight: 700 }}
            />
          )}

          {/* Quarter labels and dividers:
              - Q1 (isFirst=true): label only at x=0, no visible line
              - Q2/Q3/Q4: orange dashed divider at boundary + label to the right (start of the new quarter) */}
          {periodBoundaries.map(({ index, period, isFirst }) => (
            <ReferenceLine
              key={period}
              x={index}
              stroke={isFirst ? 'transparent' : '#f97316'}
              strokeWidth={isFirst ? 0 : 1}
              strokeDasharray={isFirst ? undefined : '3 3'}
              label={{ value: period, position: 'insideTopRight', fill: '#f97316', fontSize: 10 }}
            />
          ))}

          <Area
            type="monotone"
            dataKey="diff"
            stroke="none"
            fill={`url(#${gradientId})`}
            isAnimationActive={false}
          />

          <Area
            type="monotone"
            dataKey="diff"
            stroke="#f97316"
            strokeWidth={2}
            fill="none"
            dot={false}
            isAnimationActive={false}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
};
