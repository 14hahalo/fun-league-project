import { useState, useMemo } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { useMatchSimulation } from '../hooks/useMatchSimulation';
import { TeamComparisonChart } from '../components/shared/TeamComparisonChart';
import { Loading } from '../components/shared/Loading';
import type { Player } from '../types/player.types';
import type { PlayerSimProfile } from '../hooks/useMatchSimulation';

// ─── Mini helpers ─────────────────────────────────────────────────────────────

const TEAM_A_COLOR = '#f97316';
const TEAM_B_COLOR = '#3b82f6';

function Avatar({ player, size = 'md' }: { player: Player; size?: 'sm' | 'md' | 'lg' }) {
  const dim = size === 'sm' ? 'w-8 h-8 text-xs' : size === 'lg' ? 'w-16 h-16 text-xl' : 'w-10 h-10 text-sm';
  if (player.photoUrl) {
    return (
      <img
        src={player.photoUrl}
        alt={player.nickname}
        className={`${dim} rounded-full object-cover border-2 border-gray-700 shrink-0`}
      />
    );
  }
  return (
    <div
      className={`${dim} rounded-full bg-gradient-to-br from-orange-500 to-orange-700 flex items-center justify-center font-bold text-white shrink-0`}
    >
      {player.nickname.charAt(0).toUpperCase()}
    </div>
  );
}

function ProfileBadge({ profile, color }: { profile: PlayerSimProfile; color: string }) {
  if (profile.hasInsufficientData) {
    return (
      <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded p-2.5">
        <Avatar player={profile.player} size="sm" />
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{profile.player.nickname}</div>
          <div className="text-xs text-yellow-500">Yetersiz veri ({profile.gamesPlayed} maç)</div>
        </div>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-3 bg-gray-800/60 border border-gray-700 rounded p-2.5">
      <Avatar player={profile.player} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-white truncate">{profile.player.nickname}</div>
        <div className="text-xs text-gray-400">{profile.gamesPlayed} maç</div>
      </div>
      <div className="flex gap-2 shrink-0">
        {[
          { label: 'PPG', value: profile.ppg.toFixed(1) },
          { label: 'RPG', value: profile.rpg.toFixed(1) },
          { label: 'APG', value: profile.apg.toFixed(1) },
          { label: 'EFF', value: profile.eff.toFixed(1) },
        ].map(({ label, value }) => (
          <div key={label} className="text-center">
            <div className="text-xs font-bold" style={{ color }}>
              {value}
            </div>
            <div className="text-[10px] text-gray-500 uppercase">{label}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Minimal inline markdown renderer (bold + headers)
function MarkdownText({ text }: { text: string }) {
  const lines = text.split('\n');
  return (
    <div className="space-y-1.5">
      {lines.map((line, i) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={i} className="h-2" />;

        const parts = trimmed.split(/(\*\*[^*]+\*\*)/g);
        const rendered = parts.map((part, j) => {
          if (part.startsWith('**') && part.endsWith('**')) {
            return (
              <span key={j} className="font-bold text-orange-300">
                {part.slice(2, -2)}
              </span>
            );
          }
          return <span key={j}>{part}</span>;
        });

        if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
          return (
            <p key={i} className="text-orange-300 font-bold text-sm mt-3 first:mt-0">
              {trimmed.slice(2, -2)}
            </p>
          );
        }
        return (
          <p key={i} className="text-gray-300 text-sm leading-relaxed">
            {rendered}
          </p>
        );
      })}
    </div>
  );
}

// ─── Squad Selection Step ─────────────────────────────────────────────────────

function TeamPanel({
  label,
  color,
  players,
  onRemove,
}: {
  label: string;
  color: string;
  players: Player[];
  onRemove: (id: string) => void;
}) {
  return (
    <div
      className="flex-1 min-w-0 bg-gray-900 border rounded-lg p-4 flex flex-col gap-3"
      style={{ borderColor: `${color}40` }}
    >
      <div className="flex items-center gap-2">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
        <span className="font-bold text-white uppercase tracking-wider text-sm">{label}</span>
        <span className="ml-auto text-xs text-gray-500">{players.length} oyuncu</span>
      </div>
      {players.length === 0 ? (
        <p className="text-gray-600 text-xs text-center py-4">Aşağıdan oyuncu ekle</p>
      ) : (
        <div className="flex flex-col gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className="flex items-center gap-2 bg-gray-800/60 border border-gray-700 rounded px-3 py-2"
            >
              <Avatar player={p} size="sm" />
              <span className="text-sm text-white font-medium flex-1 truncate">{p.nickname}</span>
              <button
                onClick={() => onRemove(p.id)}
                className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none"
                title="Çıkar"
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function PlayerPoolCard({
  player,
  assignedTo,
  onAddA,
  onAddB,
}: {
  player: Player;
  assignedTo: 'A' | 'B' | null;
  onAddA: () => void;
  onAddB: () => void;
}) {
  const inA = assignedTo === 'A';
  const inB = assignedTo === 'B';

  return (
    <div
      className={`flex items-center gap-3 bg-gray-900 border rounded-lg px-3 py-2.5 transition-opacity ${
        assignedTo ? 'opacity-50' : ''
      }`}
      style={{ borderColor: inA ? `${TEAM_A_COLOR}60` : inB ? `${TEAM_B_COLOR}60` : '#374151' }}
    >
      <Avatar player={player} size="sm" />
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-white truncate">{player.nickname}</div>
        {player.position && (
          <div className="text-xs text-gray-500 truncate">{player.position}</div>
        )}
      </div>
      {!assignedTo && (
        <div className="flex gap-1 shrink-0">
          <button
            onClick={onAddA}
            className="px-2 py-1 text-xs font-bold rounded border transition-all hover:opacity-90"
            style={{ borderColor: TEAM_A_COLOR, color: TEAM_A_COLOR }}
          >
            A
          </button>
          <button
            onClick={onAddB}
            className="px-2 py-1 text-xs font-bold rounded border transition-all hover:opacity-90"
            style={{ borderColor: TEAM_B_COLOR, color: TEAM_B_COLOR }}
          >
            B
          </button>
        </div>
      )}
      {assignedTo && (
        <div
          className="text-xs font-bold px-2 py-1 rounded"
          style={{
            backgroundColor: inA ? `${TEAM_A_COLOR}20` : `${TEAM_B_COLOR}20`,
            color: inA ? TEAM_A_COLOR : TEAM_B_COLOR,
          }}
        >
          Takım {assignedTo}
        </div>
      )}
    </div>
  );
}

// ─── Results Step ─────────────────────────────────────────────────────────────

function ScoreBanner({
  scoreA,
  scoreB,
  winPctA,
  winPctB,
}: {
  scoreA: number;
  scoreB: number;
  winPctA: number;
  winPctB: number;
}) {
  const aWins = scoreA >= scoreB;
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 text-center">
      <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Tahmini Skor</p>
      <div className="flex items-center justify-center gap-6">
        <div className="flex flex-col items-center gap-1">
          <div
            className="text-5xl font-black tabular-nums"
            style={{ color: TEAM_A_COLOR, textShadow: `0 0 20px ${TEAM_A_COLOR}60` }}
          >
            {Math.round(scoreA)}
          </div>
          <div className="text-xs font-bold uppercase text-gray-400">Takım A</div>
          {aWins && (
            <div
              className="text-[10px] px-2 py-0.5 rounded font-bold"
              style={{ backgroundColor: `${TEAM_A_COLOR}20`, color: TEAM_A_COLOR }}
            >
              Favori
            </div>
          )}
        </div>
        <div className="text-3xl font-black text-gray-600">—</div>
        <div className="flex flex-col items-center gap-1">
          <div
            className="text-5xl font-black tabular-nums"
            style={{ color: TEAM_B_COLOR, textShadow: `0 0 20px ${TEAM_B_COLOR}60` }}
          >
            {Math.round(scoreB)}
          </div>
          <div className="text-xs font-bold uppercase text-gray-400">Takım B</div>
          {!aWins && scoreB !== scoreA && (
            <div
              className="text-[10px] px-2 py-0.5 rounded font-bold"
              style={{ backgroundColor: `${TEAM_B_COLOR}20`, color: TEAM_B_COLOR }}
            >
              Favori
            </div>
          )}
        </div>
      </div>

      {/* Win probability bar */}
      <div className="mt-5">
        <div className="flex justify-between text-xs text-gray-500 mb-1.5">
          <span style={{ color: TEAM_A_COLOR }}>{(winPctA * 100).toFixed(0)}% Takım A</span>
          <span className="text-gray-500 text-[10px] uppercase tracking-widest">Kazanma İhtimali</span>
          <span style={{ color: TEAM_B_COLOR }}>Takım B {(winPctB * 100).toFixed(0)}%</span>
        </div>
        <div className="h-3 rounded-full overflow-hidden bg-gray-800 flex">
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${winPctA * 100}%`, backgroundColor: TEAM_A_COLOR }}
          />
          <div
            className="h-full transition-all duration-700"
            style={{ width: `${winPctB * 100}%`, backgroundColor: TEAM_B_COLOR }}
          />
        </div>
      </div>
    </div>
  );
}

function TopPerformersCard({
  performers,
  teamLabel,
  color,
}: {
  performers: PlayerSimProfile[];
  teamLabel: string;
  color: string;
}) {
  return (
    <div className="flex-1 min-w-0 bg-gray-900 border border-gray-800 rounded-xl p-4">
      <h3 className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color }}>
        {teamLabel} — Öne Çıkanlar
      </h3>
      {performers.length === 0 ? (
        <p className="text-gray-600 text-xs">Yeterli veri yok</p>
      ) : (
        <div className="flex flex-col gap-3">
          {performers.map((p, i) => (
            <div key={p.player.id} className="flex items-center gap-3">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-black text-black shrink-0"
                style={{ backgroundColor: color }}
              >
                {i + 1}
              </div>
              <Avatar player={p.player} size="sm" />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{p.player.nickname}</div>
                <div className="text-xs text-gray-500">
                  {p.ppg.toFixed(1)} pt / {p.rpg.toFixed(1)} r / {p.apg.toFixed(1)} a
                </div>
              </div>
              <div
                className="text-sm font-black shrink-0"
                style={{ color }}
              >
                EFF {p.eff.toFixed(1)}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function KeyMatchupCard({
  profileA,
  profileB,
}: {
  profileA: PlayerSimProfile | null;
  profileB: PlayerSimProfile | null;
}) {
  if (!profileA || !profileB) return null;

  const StatRow = ({
    label,
    valA,
    valB,
    fmt = (v: number) => v.toFixed(1),
  }: {
    label: string;
    valA: number;
    valB: number;
    fmt?: (v: number) => string;
  }) => {
    const aWins = valA > valB;
    const bWins = valB > valA;
    return (
      <div className="flex items-center gap-2">
        <span
          className={`text-sm font-bold tabular-nums w-12 text-right ${aWins ? 'text-orange-400' : 'text-gray-400'}`}
        >
          {fmt(valA)}
        </span>
        <span className="text-xs text-gray-600 uppercase tracking-wider w-12 text-center shrink-0">
          {label}
        </span>
        <span
          className={`text-sm font-bold tabular-nums w-12 ${bWins ? 'text-blue-400' : 'text-gray-400'}`}
        >
          {fmt(valB)}
        </span>
      </div>
    );
  };

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
      <p className="text-xs text-gray-500 uppercase tracking-widest text-center mb-4">
        Kilit Karşılaşma
      </p>
      <div className="flex items-start gap-4">
        {/* Player A */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar player={profileA.player} size="lg" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{profileA.player.nickname}</div>
            <div className="text-xs text-gray-500">{profileA.gamesPlayed} maç</div>
          </div>
        </div>

        {/* Stats */}
        <div className="flex flex-col gap-1.5 justify-center py-2">
          <StatRow label="PPG" valA={profileA.ppg} valB={profileB.ppg} />
          <StatRow label="RPG" valA={profileA.rpg} valB={profileB.rpg} />
          <StatRow label="APG" valA={profileA.apg} valB={profileB.apg} />
          <StatRow label="EFF" valA={profileA.eff} valB={profileB.eff} />
          <StatRow
            label="2P%"
            valA={profileA.twoPct}
            valB={profileB.twoPct}
            fmt={(v) => `${v.toFixed(0)}%`}
          />
          <StatRow
            label="3P%"
            valA={profileA.threePct}
            valB={profileB.threePct}
            fmt={(v) => `${v.toFixed(0)}%`}
          />
        </div>

        {/* Player B */}
        <div className="flex flex-col items-center gap-2 flex-1">
          <Avatar player={profileB.player} size="lg" />
          <div className="text-center">
            <div className="text-sm font-bold text-white">{profileB.player.nickname}</div>
            <div className="text-xs text-gray-500">{profileB.gamesPlayed} maç</div>
          </div>
        </div>
      </div>
    </div>
  );
}

function XFactorCard({
  profile,
  color,
  teamLabel,
}: {
  profile: PlayerSimProfile | null;
  color: string;
  teamLabel: string;
}) {
  if (!profile) return null;
  return (
    <div
      className="flex-1 min-w-0 bg-gray-900 border rounded-xl p-4"
      style={{ borderColor: `${color}40` }}
    >
      <div className="flex items-center gap-2 mb-3">
        <span className="text-lg">⚡</span>
        <span className="text-xs font-bold uppercase tracking-widest" style={{ color }}>
          {teamLabel} — X Faktör
        </span>
      </div>
      <div className="flex items-center gap-3">
        <Avatar player={profile.player} size="md" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-white">{profile.player.nickname}</div>
          <div className="text-xs text-gray-500 mt-0.5">
            {profile.ppg.toFixed(1)} pt / {profile.rpg.toFixed(1)} r / {profile.apg.toFixed(1)} a
          </div>
          <div className="text-xs mt-1" style={{ color }}>
            Formuna girerse maçı değiştirebilir
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-xs text-gray-500 mb-0.5">Volatilite</div>
          <div className="text-base font-black" style={{ color }}>
            ±{profile.effStdDev.toFixed(1)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export const MatchSimulationPage = () => {
  const { players, loading: playersLoading } = usePlayers(true);
  const { simulate, reset, loading: simLoading, error: simError, result } = useMatchSimulation();

  const [teamA, setTeamA] = useState<Player[]>([]);
  const [teamB, setTeamB] = useState<Player[]>([]);
  const [search, setSearch] = useState('');

  const assignedSet = useMemo(() => {
    const map = new Map<string, 'A' | 'B'>();
    teamA.forEach((p) => map.set(p.id, 'A'));
    teamB.forEach((p) => map.set(p.id, 'B'));
    return map;
  }, [teamA, teamB]);

  const filteredPlayers = useMemo(() => {
    const q = search.toLowerCase();
    return players.filter((p) => p.nickname.toLowerCase().includes(q));
  }, [players, search]);

  const addToTeam = (player: Player, team: 'A' | 'B') => {
    if (team === 'A') setTeamA((prev) => [...prev, player]);
    else setTeamB((prev) => [...prev, player]);
  };

  const removeFromTeam = (id: string, team: 'A' | 'B') => {
    if (team === 'A') setTeamA((prev) => prev.filter((p) => p.id !== id));
    else setTeamB((prev) => prev.filter((p) => p.id !== id));
  };

  const handleSimulate = () => {
    simulate(teamA, teamB);
  };

  const handleReset = () => {
    reset();
    setTeamA([]);
    setTeamB([]);
    setSearch('');
  };

  // ── Loading ──────────────────────────────────────────────────────────────
  if (playersLoading) return <Loading />;

  if (simLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center gap-6">
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 border-4 border-orange-500/30 rounded-full" />
          <div className="absolute inset-0 border-4 border-transparent border-t-orange-500 rounded-full animate-spin" />
        </div>
        <div className="text-center">
          <p className="text-white font-bold text-lg">Simüle ediliyor...</p>
          <p className="text-gray-500 text-sm mt-1">Geçmiş veriler analiz ediliyor</p>
        </div>
      </div>
    );
  }

  // ── Results ──────────────────────────────────────────────────────────────
  if (result) {
    return (
      <div className="min-h-screen bg-black text-white">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-orange-600 uppercase tracking-wider">
                Simülasyon Sonuçları
              </h1>
              <p className="text-gray-500 text-sm mt-1">Tarihsel verilere dayalı tahmin</p>
            </div>
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-4 py-2 border border-orange-500/40 hover:border-orange-500 text-orange-400 text-sm font-semibold transition-all rounded"
            >
              ← Yeni Simülasyon
            </button>
          </div>

          <div className="flex flex-col gap-6">
            {/* AI Preview */}
            {result.aiPreview && (
              <div className="bg-gray-900 border border-orange-500/30 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span className="text-orange-400 text-lg">🤖</span>
                  <h2 className="text-sm font-bold text-orange-400 uppercase tracking-widest">
                    Maç Önizlemesi
                  </h2>
                </div>
                <MarkdownText text={result.aiPreview} />
                <p className="text-xs text-gray-600 mt-4 border-t border-gray-800 pt-3">
                  Bu önizleme OpenAI tarafından otomatik oluşturulmuştur.
                </p>
              </div>
            )}

            {/* Score Banner */}
            <ScoreBanner
              scoreA={result.projectedTeamAScore}
              scoreB={result.projectedTeamBScore}
              winPctA={result.teamAWinPct}
              winPctB={result.teamBWinPct}
            />

            {/* Stat comparison chart */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-5 text-center">
                Takım İstatistik Karşılaştırması (Tahmini)
              </h2>
              <TeamComparisonChart
                teamAPlayers={result.teamAChartStats}
                teamBPlayers={result.teamBChartStats}
                teamAName="Takım A"
                teamBName="Takım B"
                teamAColor={TEAM_A_COLOR}
                teamBColor={TEAM_B_COLOR}
              />
            </div>

            {/* Top performers */}
            <div className="flex flex-col sm:flex-row gap-4">
              <TopPerformersCard
                performers={result.teamATopPerformers}
                teamLabel="Takım A"
                color={TEAM_A_COLOR}
              />
              <TopPerformersCard
                performers={result.teamBTopPerformers}
                teamLabel="Takım B"
                color={TEAM_B_COLOR}
              />
            </div>

            {/* Full roster breakdown */}
            <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
              <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-4">
                Kadro Detayı
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="flex flex-col gap-2">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: TEAM_A_COLOR }}
                  >
                    Takım A
                  </p>
                  {result.teamAProfiles.map((p) => (
                    <ProfileBadge key={p.player.id} profile={p} color={TEAM_A_COLOR} />
                  ))}
                </div>
                <div className="flex flex-col gap-2">
                  <p
                    className="text-xs font-bold uppercase tracking-widest mb-1"
                    style={{ color: TEAM_B_COLOR }}
                  >
                    Takım B
                  </p>
                  {result.teamBProfiles.map((p) => (
                    <ProfileBadge key={p.player.id} profile={p} color={TEAM_B_COLOR} />
                  ))}
                </div>
              </div>
            </div>

            {/* Key matchup */}
            {result.keyMatchup.teamA && result.keyMatchup.teamB && (
              <KeyMatchupCard
                profileA={result.keyMatchup.teamA}
                profileB={result.keyMatchup.teamB}
              />
            )}

            {/* X-Factor */}
            {(result.xFactor.teamA || result.xFactor.teamB) && (
              <div className="flex flex-col sm:flex-row gap-4">
                <XFactorCard
                  profile={result.xFactor.teamA}
                  color={TEAM_A_COLOR}
                  teamLabel="Takım A"
                />
                <XFactorCard
                  profile={result.xFactor.teamB}
                  color={TEAM_B_COLOR}
                  teamLabel="Takım B"
                />
              </div>
            )}

            {/* Recommendations */}
            {result.recommendations.length > 0 && (
              <div className="bg-gray-900 border border-gray-800 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-4">
                  <span>💡</span>
                  <h2 className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                    Öneriler
                  </h2>
                </div>
                <ul className="flex flex-col gap-2.5">
                  {result.recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-orange-500 mt-0.5 shrink-0">›</span>
                      <span className="text-gray-300 text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {simError && (
              <div className="bg-red-900/20 border border-red-500/40 rounded-xl p-4 text-red-400 text-sm">
                {simError}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ── Squad Selection ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="container mx-auto px-4 py-8 max-w-5xl">
        {/* Page header */}
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-orange-500 to-orange-600 uppercase tracking-wider">
            Maç Simülasyonu
          </h1>
          <p className="text-gray-500 text-sm mt-2">
            İki kadro seç — geçmiş performansa dayalı sonuç tahmini al
          </p>
        </div>

        {/* Team panels */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <TeamPanel
            label="Takım A"
            color={TEAM_A_COLOR}
            players={teamA}
            onRemove={(id) => removeFromTeam(id, 'A')}
          />
          <TeamPanel
            label="Takım B"
            color={TEAM_B_COLOR}
            players={teamB}
            onRemove={(id) => removeFromTeam(id, 'B')}
          />
        </div>

        {/* Player pool */}
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest flex-1">
              Oyuncu Havuzu
            </h2>
            <input
              type="text"
              placeholder="İsim ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-gray-800 border border-gray-700 rounded px-3 py-1.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-orange-500 w-48"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-80 overflow-y-auto custom-scrollbar pr-1">
            {filteredPlayers.map((player) => (
              <PlayerPoolCard
                key={player.id}
                player={player}
                assignedTo={assignedSet.get(player.id) ?? null}
                onAddA={() => addToTeam(player, 'A')}
                onAddB={() => addToTeam(player, 'B')}
              />
            ))}
            {filteredPlayers.length === 0 && (
              <p className="text-gray-600 text-sm col-span-full text-center py-4">
                Sonuç bulunamadı
              </p>
            )}
          </div>
        </div>

        {/* Simulate button */}
        <div className="flex flex-col items-center gap-3">
          {(teamA.length === 0 || teamB.length === 0) && (
            <p className="text-gray-600 text-xs">Her iki takıma da en az bir oyuncu ekle</p>
          )}
          <button
            onClick={handleSimulate}
            disabled={teamA.length === 0 || teamB.length === 0}
            className="relative px-10 py-3.5 font-black text-sm uppercase tracking-widest border-2 border-orange-500 text-orange-400 hover:bg-orange-500/10 transition-all overflow-hidden group disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ clipPath: 'polygon(12px 0, 100% 0, 100% calc(100% - 12px), calc(100% - 12px) 100%, 0 100%, 0 12px)' }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/0 via-orange-500/20 to-orange-500/0 -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
            <span className="relative z-10">Simüle Et</span>
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-orange-300" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-orange-300" />
          </button>
        </div>
      </div>
    </div>
  );
};
