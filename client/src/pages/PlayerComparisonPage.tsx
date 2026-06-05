import React, { useState, useEffect, useMemo, useRef } from 'react';
import { usePlayers } from '../hooks/usePlayers';
import { Loading } from '../components/shared/Loading';
import { playerStatsApi } from '../api/playerStatsApi';
import { gameApi } from '../api/gameApi';
import { comparisonLogApi } from '../api/comparisonLogApi';
import { cache, CacheKeys } from '../utils/cache';
import type { Player } from '../types/player.types';
import type { PlayerStats, Game } from '../types/basketball.types';
import { PlayerRole } from '../types/player.types';

interface ComparisonStats {
  gamesPlayed: number;
  wins: number;
  losses: number;
  avgPoints: number;
  avg2pPct: number;
  avg3pPct: number;
  avgDefReb: number;
  avgOffReb: number;
  avgTotReb: number;
  avgAssists: number;
  avgEfficiency: number;
}

interface ComparisonResult {
  totalMutualGames: number;
  sameTeamGames: number;
  diffTeamGames: number;
  aStats: { sameTeam: ComparisonStats; diffTeam: ComparisonStats };
  bStats: { sameTeam: ComparisonStats; diffTeam: ComparisonStats };
}

// Canonical form stored in cache: first player is always the one with the lexicographically smaller ID
interface CachedComparison {
  canonicalFirstId: string;
  result: ComparisonResult;
}

const EMPTY_STATS: ComparisonStats = {
  gamesPlayed: 0, wins: 0, losses: 0, avgPoints: 0,
  avg2pPct: 0, avg3pPct: 0, avgDefReb: 0, avgOffReb: 0,
  avgTotReb: 0, avgAssists: 0, avgEfficiency: 0,
};

function calcStats(stats: PlayerStats[], gameMap: Map<string, Game>): ComparisonStats {
  const valid = stats.filter(s => gameMap.has(s.gameId));
  if (valid.length === 0) return EMPTY_STATS;
  const n = valid.length;
  let w = 0, l = 0, pts = 0, twoA = 0, twoM = 0, threeA = 0, threeM = 0, dReb = 0, oReb = 0, tReb = 0, ast = 0;
  for (const s of valid) {
    const g = gameMap.get(s.gameId)!;
    (s.teamType === 'TEAM_A' ? g.teamAScore > g.teamBScore : g.teamBScore > g.teamAScore) ? w++ : l++;
    pts += s.totalPoints;
    twoA += s.twoPointAttempts; twoM += s.twoPointMade;
    threeA += s.threePointAttempts; threeM += s.threePointMade;
    dReb += s.defensiveRebounds; oReb += s.offensiveRebounds; tReb += s.totalRebounds;
    ast += s.assists;
  }
  return {
    gamesPlayed: n, wins: w, losses: l,
    avgPoints: pts / n,
    avg2pPct: twoA > 0 ? (twoM / twoA) * 100 : 0,
    avg3pPct: threeA > 0 ? (threeM / threeA) * 100 : 0,
    avgDefReb: dReb / n, avgOffReb: oReb / n, avgTotReb: tReb / n,
    avgAssists: ast / n,
    avgEfficiency: (pts + 1.5 * ast + 0.8 * dReb + 1.2 * oReb -
      (0.8 * (twoA - twoM) + 1.2 * (threeA - threeM))) / n,
  };
}

interface StatRow {
  label: string;
  compareValue: (s: ComparisonStats) => number;
  render: (s: ComparisonStats) => React.ReactNode;
}

const STAT_ROWS: StatRow[] = [
  {
    label: 'W-L Rekoru',
    compareValue: s => s.gamesPlayed > 0 ? s.wins / s.gamesPlayed : -Infinity,
    render: s => s.gamesPlayed > 0
      ? <span><span className="text-green-400 font-bold">{s.wins}W</span><span className="text-gray-500"> – </span><span className="text-red-400 font-bold">{s.losses}L</span></span>
      : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. Sayı',
    compareValue: s => s.gamesPlayed > 0 ? s.avgPoints : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgPoints.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. 2P%',
    compareValue: s => s.gamesPlayed > 0 ? s.avg2pPct : -Infinity,
    render: s => s.gamesPlayed > 0 ? `${s.avg2pPct.toFixed(1)}%` : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. 3P%',
    compareValue: s => s.gamesPlayed > 0 ? s.avg3pPct : -Infinity,
    render: s => s.gamesPlayed > 0 ? `${s.avg3pPct.toFixed(1)}%` : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. dRib',
    compareValue: s => s.gamesPlayed > 0 ? s.avgDefReb : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgDefReb.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. hRib',
    compareValue: s => s.gamesPlayed > 0 ? s.avgOffReb : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgOffReb.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. Rib',
    compareValue: s => s.gamesPlayed > 0 ? s.avgTotReb : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgTotReb.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. Asist',
    compareValue: s => s.gamesPlayed > 0 ? s.avgAssists : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgAssists.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
  {
    label: 'Ort. Eff',
    compareValue: s => s.gamesPlayed > 0 ? s.avgEfficiency : -Infinity,
    render: s => s.gamesPlayed > 0 ? s.avgEfficiency.toFixed(1) : <span className="text-gray-600 text-xs">N/A</span>,
  },
];

interface DropdownProps {
  players: Player[];
  selected: Player | null;
  onSelect: (p: Player | null) => void;
  label: string;
  excludeId?: string;
  accent?: 'orange' | 'cyan';
}

const PlayerSearchDropdown: React.FC<DropdownProps> = ({ players, selected, onSelect, label, excludeId, accent = 'orange' }) => {
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = useMemo(() =>
    players
      .filter(p => p.id !== excludeId)
      .filter(p => {
        const q = search.toLowerCase();
        return (
          p.nickname.toLowerCase().includes(q) ||
          (p.firstName?.toLowerCase().includes(q) ?? false) ||
          (p.lastName?.toLowerCase().includes(q) ?? false)
        );
      }),
    [players, search, excludeId]
  );

  const gradient = accent === 'cyan' ? 'from-cyan-500 to-teal-500' : 'from-orange-500 to-amber-500';
  const avatarRing = accent === 'cyan' ? 'border-cyan-500/40' : 'border-orange-500/40';

  return (
    <div ref={ref} className="relative w-full">
      <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 text-center">{label}</p>
      <div className={`relative p-[1px] rounded-xl bg-gradient-to-r ${gradient}`}>
        <div className="bg-gray-900 rounded-xl min-h-[64px]">
          {selected ? (
            <div className="flex items-center gap-3 px-4 py-3">
              <div className={`w-12 h-12 rounded-lg ${avatarRing} border overflow-hidden flex-shrink-0 bg-gray-800`}>
                {selected.photoUrl ? (
                  <img src={selected.photoUrl} alt={selected.nickname} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-bold text-xl text-gray-300">
                    {selected.nickname.charAt(0)}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-white truncate">{selected.nickname}</div>
                <div className="text-xs text-gray-400">{selected.position || '-'}</div>
              </div>
              <button
                onClick={() => onSelect(null)}
                className="text-gray-500 hover:text-red-400 transition-colors text-lg leading-none ml-1 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          ) : (
            <div className="px-4 py-3.5">
              <input
                type="text"
                value={search}
                onChange={e => { setSearch(e.target.value); setOpen(true); }}
                onFocus={() => setOpen(true)}
                placeholder="Oyuncu ara..."
                className="bg-transparent text-white placeholder-gray-500 text-sm w-full focus:outline-none"
              />
            </div>
          )}
        </div>
      </div>

      {open && !selected && (
        <div className="absolute z-50 mt-1 w-full bg-gray-900 border border-orange-500/30 rounded-xl shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
          {filtered.length === 0 ? (
            <div className="py-6 text-center text-gray-500 text-sm">Oyuncu bulunamadı</div>
          ) : (
            filtered.map(p => (
              <div
                key={p.id}
                onClick={() => { onSelect(p); setSearch(''); setOpen(false); }}
                className="flex items-center gap-3 px-4 py-2.5 hover:bg-orange-500/10 cursor-pointer transition-colors border-b border-gray-800/50 last:border-0"
              >
                <div className="w-9 h-9 rounded-lg bg-gray-800 border border-gray-700 overflow-hidden flex-shrink-0">
                  {p.photoUrl ? (
                    <img src={p.photoUrl} alt={p.nickname} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-sm">
                      {p.nickname.charAt(0)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-white truncate">{p.nickname}</div>
                  {(p.firstName || p.lastName) && (
                    <div className="text-xs text-gray-500 truncate">{[p.firstName, p.lastName].filter(Boolean).join(' ')}</div>
                  )}
                </div>
                {p.jerseyNumber !== undefined && (
                  <div className="text-xs font-bold text-gray-500 flex-shrink-0">#{p.jerseyNumber}</div>
                )}
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

function PlayerAvatar({ player, accent = 'orange' }: { player: Player; accent?: 'orange' | 'cyan' }) {
  const gradient = accent === 'cyan'
    ? 'from-cyan-400 to-teal-600'
    : 'from-orange-400 to-amber-600';
  return (
    <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${gradient} p-0.5 flex-shrink-0`}>
      <div className="w-full h-full rounded-[10px] bg-gray-800 overflow-hidden flex items-center justify-center">
        {player.photoUrl ? (
          <img src={player.photoUrl} alt={player.nickname} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xl font-bold text-gray-300">{player.nickname.charAt(0)}</span>
        )}
      </div>
    </div>
  );
}

export const PlayerComparisonPage = () => {
  const { players: allPlayers, loading: playersLoading } = usePlayers(false);
  const [playerA, setPlayerA] = useState<Player | null>(null);
  const [playerB, setPlayerB] = useState<Player | null>(null);
  const [comparison, setComparison] = useState<ComparisonResult | null>(null);
  const [compLoading, setCompLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [noMutual, setNoMutual] = useState(false);

  const players = useMemo(
    () => allPlayers.filter(p => p.isActive && (p.role === PlayerRole.PLAYER || !p.role)),
    [allPlayers]
  );

  useEffect(() => {
    if (!playerA || !playerB) {
      setComparison(null);
      setNoMutual(false);
      setError(null);
      return;
    }

    const run = async () => {
      setCompLoading(true);
      setComparison(null);
      setNoMutual(false);
      setError(null);
      try {
        const cacheKey = CacheKeys.playerComparison(playerA.id, playerB.id);
        const cached = cache.get<CachedComparison>(cacheKey);
        if (cached) {
          // Swap aStats/bStats if the selection order differs from the canonical order
          const result = cached.canonicalFirstId === playerA.id
            ? cached.result
            : { ...cached.result, aStats: cached.result.bStats, bStats: cached.result.aStats };
          setComparison(result);
          return;
        }

        // Fire-and-forget log — do not await so it never blocks the UI
        comparisonLogApi.log(playerA.nickname, playerB.nickname).catch(() => {});

        const [statsA, statsB, allGames] = await Promise.all([
          playerStatsApi.getAllStatsForPlayer(playerA.id),
          playerStatsApi.getAllStatsForPlayer(playerB.id),
          gameApi.getAllGames(),
        ]);

        const mapA = new Map<string, PlayerStats>(statsA.map((s: PlayerStats) => [s.gameId, s]));
        const mapB = new Map<string, PlayerStats>(statsB.map((s: PlayerStats) => [s.gameId, s]));

        const mutualIds = [...mapA.keys()].filter(id => mapB.has(id));

        if (mutualIds.length === 0) {
          setNoMutual(true);
          return;
        }

        const gameMap = new Map<string, Game>(
          (allGames as Game[]).filter(g => g.countInStats !== false).map(g => [g.id, g])
        );

        const sameA: PlayerStats[] = [], sameB: PlayerStats[] = [];
        const diffA: PlayerStats[] = [], diffB: PlayerStats[] = [];

        for (const id of mutualIds) {
          const sa = mapA.get(id)!;
          const sb = mapB.get(id)!;
          if (sa.teamType === sb.teamType) {
            sameA.push(sa); sameB.push(sb);
          } else {
            diffA.push(sa); diffB.push(sb);
          }
        }

        const result: ComparisonResult = {
          totalMutualGames: mutualIds.length,
          sameTeamGames: sameA.length,
          diffTeamGames: diffA.length,
          aStats: { sameTeam: calcStats(sameA, gameMap), diffTeam: calcStats(diffA, gameMap) },
          bStats: { sameTeam: calcStats(sameB, gameMap), diffTeam: calcStats(diffB, gameMap) },
        };

        // Store canonically: first player is the one whose ID sorts first
        const canonicalFirstId = [playerA.id, playerB.id].sort()[0];
        const canonicalResult = canonicalFirstId === playerA.id
          ? result
          : { ...result, aStats: result.bStats, bStats: result.aStats };
        cache.set<CachedComparison>(cacheKey, { canonicalFirstId, result: canonicalResult }, cache.getTTL('comparison'));

        setComparison(result);
      } catch {
        setError('Karşılaştırma verileri yüklenirken bir hata oluştu.');
      } finally {
        setCompLoading(false);
      }
    };

    run();
  }, [playerA, playerB]);

  if (playersLoading) return <Loading />;

  const as = comparison?.aStats.sameTeam ?? EMPTY_STATS;
  const ad = comparison?.aStats.diffTeam ?? EMPTY_STATS;
  const bs = comparison?.bStats.sameTeam ?? EMPTY_STATS;
  const bd = comparison?.bStats.diffTeam ?? EMPTY_STATS;

  return (
    <div className="min-h-screen py-6 md:py-10 px-2 md:px-4 bg-gradient-to-br from-gray-900 via-gray-800 to-black">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-500 to-cyan-400 mb-3 tracking-tight">
            Oyuncu Karşılaştırma
          </h1>
          <p className="text-sm text-gray-500">İki oyuncunun birlikte oynadığı maçlar üzerinden karşılaştırma</p>
        </div>

        {/* Player selectors */}
        <div className="relative p-[1px] rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-cyan-500 mb-8">
          <div className="bg-gray-900 rounded-2xl px-4 py-6 md:px-8">
            <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
              <div className="w-full md:flex-1">
                <PlayerSearchDropdown
                  players={players}
                  selected={playerA}
                  onSelect={setPlayerA}
                  label="Oyuncu A"
                  excludeId={playerB?.id}
                  accent="orange"
                />
              </div>

              <div className="flex-shrink-0 text-center">
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-orange-500 to-cyan-500 flex items-center justify-center shadow-[0_0_20px_rgba(249,115,22,0.4)]">
                    <span className="text-white font-black text-sm md:text-base tracking-widest">VS</span>
                  </div>
                </div>
              </div>

              <div className="w-full md:flex-1">
                <PlayerSearchDropdown
                  players={players}
                  selected={playerB}
                  onSelect={setPlayerB}
                  label="Oyuncu B"
                  excludeId={playerA?.id}
                  accent="cyan"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        {!playerA || !playerB ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <div className="text-5xl mb-4">⚔️</div>
            <p className="text-lg text-gray-400 font-semibold">Karşılaştırmak için iki oyuncu seçin</p>
            <p className="text-sm text-gray-600 mt-2">Sadece birlikte oynadıkları maçlar değerlendirmeye alınır</p>
          </div>
        ) : compLoading ? (
          <Loading />
        ) : error ? (
          <div className="text-center py-12 bg-red-500/10 rounded-2xl border border-red-500/30">
            <div className="text-4xl mb-3">⚠️</div>
            <p className="text-red-400 font-semibold">{error}</p>
          </div>
        ) : noMutual ? (
          <div className="text-center py-16 bg-gray-800/30 rounded-2xl border border-gray-700/50">
            <div className="text-5xl mb-4">🔍</div>
            <p className="text-lg text-gray-400 font-semibold">Ortak maç bulunamadı</p>
            <p className="text-sm text-gray-600 mt-2">
              <span className="text-orange-400">{playerA.nickname}</span> ile <span className="text-cyan-400">{playerB.nickname}</span> henüz aynı maçta oynamamış
            </p>
          </div>
        ) : comparison ? (
          <>
            {/* Summary badges */}
            <div className="flex flex-wrap justify-center gap-3 mb-6">
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-gray-700">
                <span className="text-xs text-gray-400 uppercase tracking-wider">Ortak Maç</span>
                <span className="text-sm font-bold text-white">{comparison.totalMutualGames}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-green-500/30">
                <span className="w-2 h-2 rounded-full bg-green-400 flex-shrink-0"></span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Aynı Takım</span>
                <span className="text-sm font-bold text-green-400">{comparison.sameTeamGames}</span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 rounded-full border border-red-500/30">
                <span className="w-2 h-2 rounded-full bg-red-400 flex-shrink-0"></span>
                <span className="text-xs text-gray-400 uppercase tracking-wider">Farklı Takım</span>
                <span className="text-sm font-bold text-red-400">{comparison.diffTeamGames}</span>
              </div>
            </div>

            {/* Comparison table */}
            <div className="relative p-[1px] rounded-xl bg-gradient-to-br from-orange-500 via-amber-500 to-cyan-500">
              <div className="bg-gray-900 rounded-xl overflow-hidden">
                <div className="overflow-x-auto custom-scrollbar">
                  <table className="w-full text-sm">
                    <thead>
                      {/* Group header row */}
                      <tr className="bg-gray-800/60 border-b border-gray-700">
                        <th className="sticky left-0 z-10 bg-gray-800 px-4 py-3 w-[120px] min-w-[120px]"></th>
                        <th colSpan={2} className="px-4 py-3 text-center border-r border-gray-700">
                          <span className="text-xs font-black uppercase tracking-widest text-green-400">Aynı Takım</span>
                        </th>
                        <th colSpan={2} className="px-4 py-3 text-center">
                          <span className="text-xs font-black uppercase tracking-widest text-red-400">Farklı Takım</span>
                        </th>
                      </tr>
                      {/* Player name row */}
                      <tr className="bg-gray-800/40 border-b border-gray-700">
                        <th className="sticky left-0 z-10 bg-gray-800 px-4 py-2.5 text-left text-[10px] font-bold text-gray-500 uppercase tracking-wider w-[120px] min-w-[120px]">
                          İstatistik
                        </th>
                        <th className="px-4 py-2.5 text-center min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            {playerA && <PlayerAvatar player={playerA} accent="orange" />}
                            <div className="text-left">
                              <div className="text-xs font-black text-orange-400">{playerA?.nickname}</div>
                              <div className="text-[10px] text-gray-500">{playerA?.position || '-'}</div>
                            </div>
                          </div>
                        </th>
                        <th className="px-4 py-2.5 text-center min-w-[120px] border-r border-gray-700">
                          <div className="flex items-center justify-center gap-2">
                            {playerB && <PlayerAvatar player={playerB} accent="cyan" />}
                            <div className="text-left">
                              <div className="text-xs font-black text-cyan-400">{playerB?.nickname}</div>
                              <div className="text-[10px] text-gray-500">{playerB?.position || '-'}</div>
                            </div>
                          </div>
                        </th>
                        <th className="px-4 py-2.5 text-center min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            {playerA && <PlayerAvatar player={playerA} accent="orange" />}
                            <div className="text-left">
                              <div className="text-xs font-black text-orange-400">{playerA?.nickname}</div>
                              <div className="text-[10px] text-gray-500">{playerA?.position || '-'}</div>
                            </div>
                          </div>
                        </th>
                        <th className="px-4 py-2.5 text-center min-w-[120px]">
                          <div className="flex items-center justify-center gap-2">
                            {playerB && <PlayerAvatar player={playerB} accent="cyan" />}
                            <div className="text-left">
                              <div className="text-xs font-black text-cyan-400">{playerB?.nickname}</div>
                              <div className="text-[10px] text-gray-500">{playerB?.position || '-'}</div>
                            </div>
                          </div>
                        </th>
                      </tr>
                      {/* Game count row */}
                      <tr className="bg-gray-800/20 border-b border-gray-700/50">
                        <td className="sticky left-0 z-10 bg-gray-900 px-4 py-2 text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                          Maç Sayısı
                        </td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">{as.gamesPlayed > 0 ? as.gamesPlayed : '-'}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400 border-r border-gray-700/50">{bs.gamesPlayed > 0 ? bs.gamesPlayed : '-'}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">{ad.gamesPlayed > 0 ? ad.gamesPlayed : '-'}</td>
                        <td className="px-4 py-2 text-center text-xs text-gray-400">{bd.gamesPlayed > 0 ? bd.gamesPlayed : '-'}</td>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-800/50">
                      {STAT_ROWS.map((row, idx) => {
                        const vals = [row.compareValue(as), row.compareValue(bs), row.compareValue(ad), row.compareValue(bd)];
                        const sameMax = Math.max(...[vals[0], vals[1]].filter(v => v > -Infinity));
                        const diffMax = Math.max(...[vals[2], vals[3]].filter(v => v > -Infinity));
                        const isWinner = (v: number, groupMax: number) => v > -Infinity && v === groupMax;

                        return (
                          <tr
                            key={idx}
                            className="transition-all hover:bg-orange-500/5"
                          >
                            <td className="sticky left-0 z-10 bg-gray-900 px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider whitespace-nowrap">
                              {row.label}
                            </td>
                            <td className={`px-4 py-3 text-center text-sm ${isWinner(vals[0], sameMax) ? 'text-orange-400 font-bold bg-orange-500/5' : 'text-gray-300'}`}>
                              {row.render(as)}
                            </td>
                            <td className={`px-4 py-3 text-center text-sm border-r border-gray-700/50 ${isWinner(vals[1], sameMax) ? 'text-orange-400 font-bold bg-orange-500/5' : 'text-gray-300'}`}>
                              {row.render(bs)}
                            </td>
                            <td className={`px-4 py-3 text-center text-sm ${isWinner(vals[2], diffMax) ? 'text-orange-400 font-bold bg-orange-500/5' : 'text-gray-300'}`}>
                              {row.render(ad)}
                            </td>
                            <td className={`px-4 py-3 text-center text-sm ${isWinner(vals[3], diffMax) ? 'text-orange-400 font-bold bg-orange-500/5' : 'text-gray-300'}`}>
                              {row.render(bd)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};
