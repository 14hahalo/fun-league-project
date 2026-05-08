import type { PlayerStatsWithInfo } from '../../hooks/useMatchDetails';

// ── Constants ──────────────────────────────────────────────────────────────
const CX = 250;
const CY = 250;
const RI = 68;          // fixed inner radius
const MAX_T = 72;       // max arc thickness (globalMax leader)
const MIN_T = 18;       // min arc thickness (so a zero-value stays visible)
const R_TRACK = RI + MAX_T; // track always drawn at full extent = 140
const R_LABEL = 205;    // photo center distance from chart center
const PHOTO_R = 28;     // 56px diameter
const CONN_START = R_TRACK + 6;           // 146
const CONN_END   = R_LABEL - PHOTO_R - 6; // 171
const GAP = 1.5;        // degrees gap at each slice edge

// ── Stat quadrant layout ───────────────────────────────────────────────────
// Each stat occupies 90°. Team A = first 45°, Team B = second 45°.
//   PTS :   0° →  90°   REB :  90° → 180°
//   AST : 180° → 270°   EFF : 270° → 360°
const QUADS = [
  { key: 'PTS', qStart:   0, qEnd:  90 },
  { key: 'REB', qStart:  90, qEnd: 180 },
  { key: 'AST', qStart: 180, qEnd: 270 },
  { key: 'EFF', qStart: 270, qEnd: 360 },
] as const;

const STAT_COLORS: Record<string, string> = {
  PTS: '#f97316', REB: '#3b82f6', AST: '#22c55e', EFF: '#a855f7',
};
const TEAM_A = '#60a5fa';
const TEAM_B = '#f87171';

// ── Types ──────────────────────────────────────────────────────────────────
interface StatLeadersChartProps {
  teamAPlayers: PlayerStatsWithInfo[];
  teamBPlayers: PlayerStatsWithInfo[];
}

interface Leader {
  nickname: string;
  value: number;
  photoUrl?: string;
  jerseyNumber?: number;
}

// ── Helpers ────────────────────────────────────────────────────────────────
const toRad = (d: number) => (d * Math.PI) / 180;
const polar = (r: number, deg: number) => ({
  x: CX + r * Math.cos(toRad(deg)),
  y: CY + r * Math.sin(toRad(deg)),
});
const f = (n: number) => n.toFixed(2);

function annularSector(ri: number, ro: number, a0: number, a1: number): string {
  const s1 = polar(ri, a0), s2 = polar(ro, a0);
  const e1 = polar(ri, a1), e2 = polar(ro, a1);
  const lg = a1 - a0 > 180 ? 1 : 0;
  return [
    `M ${f(s1.x)} ${f(s1.y)} L ${f(s2.x)} ${f(s2.y)}`,
    `A ${ro} ${ro} 0 ${lg} 1 ${f(e2.x)} ${f(e2.y)}`,
    `L ${f(e1.x)} ${f(e1.y)} A ${ri} ${ri} 0 ${lg} 0 ${f(s1.x)} ${f(s1.y)} Z`,
  ].join(' ');
}

const calcEff = (p: PlayerStatsWithInfo) =>
  Math.round(
    (2 * p.twoPointMade + 3 * p.threePointMade + 1.5 * p.assists +
      0.8 * p.defensiveRebounds + 1.2 * p.offensiveRebounds -
      (0.8 * (p.twoPointAttempts - p.twoPointMade) +
       1.2 * (p.threePointAttempts - p.threePointMade))) * 10
  ) / 10;

const STAT_FNS: Record<string, (p: PlayerStatsWithInfo) => number> = {
  PTS: (p) => p.totalPoints,
  REB: (p) => p.totalRebounds,
  AST: (p) => p.assists,
  EFF: (p) => calcEff(p),
};

function getLeader(players: PlayerStatsWithInfo[], key: string): Leader | null {
  if (!players.length) return null;
  const fn = STAT_FNS[key];
  const best = players.reduce((a, b) => (fn(b) > fn(a) ? b : a));
  return {
    nickname: best.player?.nickname ?? '—',
    value: Math.max(0, fn(best)),
    photoUrl: best.player?.photoUrl,
    jerseyNumber: best.player?.jerseyNumber,
  };
}

// ── Arc label component ────────────────────────────────────────────────────
function ArcLabel({
  midDeg, leader, color, clipId,
}: {
  midDeg: number; leader: Leader; color: string; clipId: string;
}) {
  const photo  = polar(R_LABEL, midDeg);
  const cStart = polar(CONN_START, midDeg);
  const cEnd   = polar(CONN_END,   midDeg);

  const name = leader.nickname.length > 8
    ? leader.nickname.slice(0, 7) + '…'
    : leader.nickname;

  return (
    <g>
      {/* Connector */}
      <line
        x1={f(cStart.x)} y1={f(cStart.y)}
        x2={f(cEnd.x)}   y2={f(cEnd.y)}
        stroke={color} strokeWidth={1.5} opacity={0.7}
      />

      {/* Photo clip */}
      <defs>
        <clipPath id={clipId}>
          <circle cx={f(photo.x)} cy={f(photo.y)} r={PHOTO_R} />
        </clipPath>
      </defs>

      {leader.photoUrl ? (
        <image
          href={leader.photoUrl}
          x={f(photo.x - PHOTO_R)} y={f(photo.y - PHOTO_R)}
          width={PHOTO_R * 2} height={PHOTO_R * 2}
          clipPath={`url(#${clipId})`}
          preserveAspectRatio="xMidYMid slice"
        />
      ) : (
        <>
          <circle cx={f(photo.x)} cy={f(photo.y)} r={PHOTO_R} fill={color} opacity={0.15} />
          <text
            x={f(photo.x)} y={f(photo.y + 1)}
            textAnchor="middle" dominantBaseline="middle"
            fill={color} fontSize={10} fontWeight="700"
          >
            {leader.jerseyNumber != null
              ? `#${leader.jerseyNumber}`
              : leader.nickname.slice(0, 2).toUpperCase()}
          </text>
        </>
      )}

      {/* Photo border ring */}
      <circle
        cx={f(photo.x)} cy={f(photo.y)} r={PHOTO_R}
        fill="none" stroke={color} strokeWidth={1.5}
      />

      {/* Player name — ABOVE photo */}
      <text
        x={f(photo.x)} y={f(photo.y - PHOTO_R - 7)}
        textAnchor="middle" dominantBaseline="auto"
        fill="#f1f5f9" fontSize={13} fontWeight="800"
      >
        {name}
      </text>

      {/* Stat value — BELOW photo */}
      <text
        x={f(photo.x)} y={f(photo.y + PHOTO_R + 16)}
        textAnchor="middle" dominantBaseline="auto"
        fill={color} fontSize={16} fontWeight="900"
      >
        {leader.value}
      </text>
    </g>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export const StatLeadersChart = ({ teamAPlayers, teamBPlayers }: StatLeadersChartProps) => {
  // Collect all leaders and compute globalMax across all 8 slices
  const statMap = QUADS.map((q) => ({
    key: q.key,
    qStart: q.qStart,
    qEnd: q.qEnd,
    leaderA: getLeader(teamAPlayers, q.key),
    leaderB: getLeader(teamBPlayers, q.key),
  }));

  const globalMax = Math.max(
    1,
    ...statMap.flatMap((s) => [s.leaderA?.value ?? 0, s.leaderB?.value ?? 0])
  );

  const outerR = (value: number) =>
    RI + Math.max(MIN_T, (value / globalMax) * MAX_T);

  return (
    <div style={{ maxWidth: 480, width: '100%', margin: '0 auto' }}>
      <svg
        viewBox="0 0 500 500"
        width="100%"
        height="auto"
        aria-label="Stat Leaders Chart"
      >
        <defs>
          <radialGradient id="slcCenter" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </radialGradient>
        </defs>

        {/* ── Sectors ── */}
        {statMap.map((s) => {
          const trackColor = STAT_COLORS[s.key];
          const aStart  = s.qStart + GAP;
          const aMid    = s.qStart + 45;  // Team A / Team B boundary
          const bEnd    = s.qEnd   - GAP;
          const midA    = (aStart + aMid - GAP) / 2;
          const midB    = (aMid + GAP + bEnd)   / 2;
          const roA     = s.leaderA ? outerR(s.leaderA.value) : RI + MIN_T;
          const roB     = s.leaderB ? outerR(s.leaderB.value) : RI + MIN_T;

          return (
            <g key={s.key}>
              {/* Track rings (full thickness) */}
              <path
                d={annularSector(RI + 2, R_TRACK, aStart, aMid - GAP)}
                fill={trackColor} opacity={0.08}
              />
              <path
                d={annularSector(RI + 2, R_TRACK, aMid + GAP, bEnd)}
                fill={trackColor} opacity={0.08}
              />

              {/* Filled arcs — thickness proportional to value / globalMax */}
              {s.leaderA && (
                <path
                  d={annularSector(RI + 2, roA, aStart, aMid - GAP)}
                  fill={TEAM_A} opacity={0.88}
                />
              )}
              {s.leaderB && (
                <path
                  d={annularSector(RI + 2, roB, aMid + GAP, bEnd)}
                  fill={TEAM_B} opacity={0.88}
                />
              )}

              {/* Leader labels */}
              {s.leaderA && (
                <ArcLabel
                  midDeg={midA} leader={s.leaderA}
                  color={TEAM_A} clipId={`clip-${s.key}-A`}
                />
              )}
              {s.leaderB && (
                <ArcLabel
                  midDeg={midB} leader={s.leaderB}
                  color={TEAM_B} clipId={`clip-${s.key}-B`}
                />
              )}
            </g>
          );
        })}

        {/* ── Stat boundary dividers (0°, 90°, 180°, 270°) ── */}
        {[0, 90, 180, 270].map((deg) => {
          const p0 = polar(RI,      deg);
          const p1 = polar(R_TRACK, deg);
          return (
            <line
              key={`major-${deg}`}
              x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)}
              stroke="#0f172a" strokeWidth={3}
            />
          );
        })}

        {/* ── A/B boundary dividers (45°, 135°, 225°, 315°) ── */}
        {[45, 135, 225, 315].map((deg) => {
          const p0 = polar(RI,      deg);
          const p1 = polar(R_TRACK, deg);
          return (
            <line
              key={`minor-${deg}`}
              x1={f(p0.x)} y1={f(p0.y)} x2={f(p1.x)} y2={f(p1.y)}
              stroke="#0f172a" strokeWidth={1.5} strokeDasharray="3 2"
            />
          );
        })}

        {/* ── Center circle ── */}
        <circle cx={CX} cy={CY} r={RI} fill="url(#slcCenter)" />
        <circle cx={CX} cy={CY} r={RI} fill="none" stroke="#334155" strokeWidth={1} />

        {/* Axis dividers inside center circle */}
        <line x1={CX} y1={CY - RI} x2={CX} y2={CY + RI} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />
        <line x1={CX - RI} y1={CY} x2={CX + RI} y2={CY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* Stat labels inside center circle, angled toward each quadrant */}
        {QUADS.map((q) => {
          const midAngle = q.qStart + 45; // midpoint of quadrant
          const pt = polar(RI * 0.55, midAngle);
          return (
            <text
              key={q.key}
              x={f(pt.x)} y={f(pt.y)}
              textAnchor="middle" dominantBaseline="middle"
              fill={STAT_COLORS[q.key]}
              fontSize={11} fontWeight="800" letterSpacing="0.04em" opacity={0.95}
            >
              {q.key}
            </text>
          );
        })}

      </svg>
    </div>
  );
};
