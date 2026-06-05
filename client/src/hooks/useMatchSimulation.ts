import { useState, useCallback } from 'react';
import { playerStatsApi } from '../api/playerStatsApi';
import { simulationApi } from '../api/simulationApi';
import type { Player } from '../types/player.types';
import type { PlayerStats } from '../types/basketball.types';
import { TeamType } from '../types/basketball.types';
import type { PlayerStatsWithInfo } from './useMatchDetails';

export interface PlayerSimProfile {
  player: Player;
  gamesPlayed: number;
  ppg: number;
  rpg: number;
  apg: number;
  offRpg: number;
  defRpg: number;
  eff: number;
  effStdDev: number;
  twoPct: number;
  threePct: number;
  twoPMpg: number;
  twoPApg: number;
  threePMpg: number;
  threePApg: number;
  hasInsufficientData: boolean;
}

export interface SimulationResult {
  teamAProfiles: PlayerSimProfile[];
  teamBProfiles: PlayerSimProfile[];
  projectedTeamAScore: number;
  projectedTeamBScore: number;
  teamAWinPct: number;
  teamBWinPct: number;
  teamATopPerformers: PlayerSimProfile[];
  teamBTopPerformers: PlayerSimProfile[];
  teamAChartStats: PlayerStatsWithInfo[];
  teamBChartStats: PlayerStatsWithInfo[];
  keyMatchup: { teamA: PlayerSimProfile | null; teamB: PlayerSimProfile | null };
  xFactor: { teamA: PlayerSimProfile | null; teamB: PlayerSimProfile | null };
  recommendations: string[];
  aiPreview: string | null;
}

function calcEff(s: PlayerStats): number {
  return (
    2 * s.twoPointMade +
    3 * s.threePointMade +
    1.5 * s.assists +
    0.8 * s.defensiveRebounds +
    1.2 * s.offensiveRebounds -
    (0.8 * (s.twoPointAttempts - s.twoPointMade) +
      1.2 * (s.threePointAttempts - s.threePointMade))
  );
}

function buildProfile(player: Player, stats: PlayerStats[]): PlayerSimProfile {
  const n = stats.length;

  if (n === 0) {
    return {
      player,
      gamesPlayed: 0,
      ppg: 0, rpg: 0, apg: 0, offRpg: 0, defRpg: 0,
      eff: 0, effStdDev: 0,
      twoPct: 0, threePct: 0,
      twoPMpg: 0, twoPApg: 0, threePMpg: 0, threePApg: 0,
      hasInsufficientData: true,
    };
  }

  let pts = 0, reb = 0, oReb = 0, dReb = 0, ast = 0;
  let twoPM = 0, twoPA = 0, threePM = 0, threePA = 0;

  for (const s of stats) {
    pts += s.totalPoints;
    reb += s.totalRebounds;
    oReb += s.offensiveRebounds;
    dReb += s.defensiveRebounds;
    ast += s.assists;
    twoPM += s.twoPointMade;
    twoPA += s.twoPointAttempts;
    threePM += s.threePointMade;
    threePA += s.threePointAttempts;
  }

  const perGameEff = stats.map(calcEff);
  const avgEff = perGameEff.reduce((a, b) => a + b, 0) / n;
  const variance = perGameEff.reduce((sum, e) => sum + (e - avgEff) ** 2, 0) / n;
  const effStdDev = Math.sqrt(variance);

  return {
    player,
    gamesPlayed: n,
    ppg: pts / n,
    rpg: reb / n,
    apg: ast / n,
    offRpg: oReb / n,
    defRpg: dReb / n,
    eff: avgEff,
    effStdDev,
    twoPct: twoPA > 0 ? (twoPM / twoPA) * 100 : 0,
    threePct: threePA > 0 ? (threePM / threePA) * 100 : 0,
    twoPMpg: twoPM / n,
    twoPApg: twoPA / n,
    threePMpg: threePM / n,
    threePApg: threePA / n,
    hasInsufficientData: n < 3,
  };
}

function makeChartStats(profile: PlayerSimProfile, teamType: TeamType): PlayerStatsWithInfo {
  return {
    id: `sim-${profile.player.id}`,
    gameId: 'simulation',
    playerId: profile.player.id,
    teamType,
    twoPointAttempts: profile.twoPApg,
    twoPointMade: profile.twoPMpg,
    twoPointPercentage: profile.twoPct,
    threePointAttempts: profile.threePApg,
    threePointMade: profile.threePMpg,
    threePointPercentage: profile.threePct,
    defensiveRebounds: profile.defRpg,
    offensiveRebounds: profile.offRpg,
    totalRebounds: profile.rpg,
    assists: profile.apg,
    totalPoints: profile.ppg,
    createdAt: new Date(),
    updatedAt: new Date(),
    player: profile.player,
  };
}

function calcTeamStrength(profiles: PlayerSimProfile[]): number {
  const valid = profiles.filter((p) => !p.hasInsufficientData);
  if (valid.length === 0) return 0.001;

  const totalEff = valid.reduce((s, p) => s + p.eff, 0);
  const totalReb = valid.reduce((s, p) => s + p.rpg, 0);
  const twoPM = valid.reduce((s, p) => s + p.twoPMpg, 0);
  const twoPA = valid.reduce((s, p) => s + p.twoPApg, 0);
  const threePM = valid.reduce((s, p) => s + p.threePMpg, 0);
  const threePA = valid.reduce((s, p) => s + p.threePApg, 0);
  const twoPct = twoPA > 0 ? (twoPM / twoPA) * 100 : 0;
  const threePct = threePA > 0 ? (threePM / threePA) * 100 : 0;
  const shootingScore = twoPct * 0.6 + threePct * 0.4;

  return totalEff * 0.5 + totalReb * 0.3 + shootingScore * 0.2;
}

function generateRecommendations(
  profileA: PlayerSimProfile[],
  profileB: PlayerSimProfile[]
): string[] {
  const validA = profileA.filter((p) => !p.hasInsufficientData);
  const validB = profileB.filter((p) => !p.hasInsufficientData);
  if (validA.length === 0 || validB.length === 0) return [];

  const recs: string[] = [];

  const rebA = validA.reduce((s, p) => s + p.rpg, 0);
  const rebB = validB.reduce((s, p) => s + p.rpg, 0);
  if (rebA < rebB - 3)
    recs.push('Takım A ribaund dezavantajını kapatmak için hızlı geçiş hücumu geliştirmeli');
  if (rebB < rebA - 3)
    recs.push('Takım B ribaund dezavantajını kapatmak için hızlı geçiş hücumu geliştirmeli');

  const threePA = validA.reduce((s, p) => s + p.threePApg, 0);
  const threePMA = validA.reduce((s, p) => s + p.threePMpg, 0);
  const threePctA = threePA > 0 ? (threePMA / threePA) * 100 : 0;
  if (threePctA < 25)
    recs.push('Takım A 3 sayı atış verimliliğini artırmak için daha açık pozisyon aramalı');

  const threePB = validB.reduce((s, p) => s + p.threePApg, 0);
  const threePMB = validB.reduce((s, p) => s + p.threePMpg, 0);
  const threePctB = threePB > 0 ? (threePMB / threePB) * 100 : 0;
  if (threePctB < 25)
    recs.push('Takım B 3 sayı atış verimliliğini artırmak için daha açık pozisyon aramalı');

  const effA = validA.reduce((s, p) => s + p.eff, 0) / validA.length;
  const effB = validB.reduce((s, p) => s + p.eff, 0) / validB.length;
  if (effA > effB)
    recs.push("Takım B, Takım A'nın yıldız oyuncularını çift marke ile durdurmaya çalışmalı");
  else
    recs.push("Takım A, Takım B'nin yıldız oyuncularını çift marke ile durdurmaya çalışmalı");

  const xA = [...validA].sort((a, b) => b.effStdDev - a.effStdDev)[0];
  const xB = [...validB].sort((a, b) => b.effStdDev - a.effStdDev)[0];
  if (xA && xA.effStdDev > 3)
    recs.push(`${xA.player.nickname} formunu yakalayabilirse Takım A için belirleyici olabilir`);
  if (xB && xB.effStdDev > 3)
    recs.push(`${xB.player.nickname} formunu yakalayabilirse Takım B için belirleyici olabilir`);

  return recs.slice(0, 5);
}

export const useMatchSimulation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<SimulationResult | null>(null);

  const simulate = useCallback(async (teamA: Player[], teamB: Player[]) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const allIds = [...teamA, ...teamB].map((p) => p.id);
      const bulkStats = await playerStatsApi.getBulkPlayerStats(allIds);

      const profilesA = teamA.map((p) => buildProfile(p, bulkStats[p.id] ?? []));
      const profilesB = teamB.map((p) => buildProfile(p, bulkStats[p.id] ?? []));

      const validA = profilesA.filter((p) => !p.hasInsufficientData);
      const validB = profilesB.filter((p) => !p.hasInsufficientData);

      const projectedA = validA.reduce((s, p) => s + p.ppg, 0);
      const projectedB = validB.reduce((s, p) => s + p.ppg, 0);

      const strengthA = calcTeamStrength(profilesA);
      const strengthB = calcTeamStrength(profilesB);
      const totalStrength = strengthA + strengthB || 0.002;
      const winPctA = strengthA / totalStrength;
      const winPctB = strengthB / totalStrength;

      const topA = [...validA].sort((a, b) => b.eff - a.eff).slice(0, 3);
      const topB = [...validB].sort((a, b) => b.eff - a.eff).slice(0, 3);

      const chartA = profilesA.map((p) => makeChartStats(p, TeamType.TEAM_A));
      const chartB = profilesB.map((p) => makeChartStats(p, TeamType.TEAM_B));

      const keyA = validA.length > 0 ? [...validA].sort((a, b) => b.eff - a.eff)[0] : null;
      const keyB = validB.length > 0 ? [...validB].sort((a, b) => b.eff - a.eff)[0] : null;

      const xFactorA =
        validA.filter((p) => p.gamesPlayed >= 3).sort((a, b) => b.effStdDev - a.effStdDev)[0] ?? null;
      const xFactorB =
        validB.filter((p) => p.gamesPlayed >= 3).sort((a, b) => b.effStdDev - a.effStdDev)[0] ?? null;

      const recommendations = generateRecommendations(profilesA, profilesB);

      let aiPreview: string | null = null;
      try {
        aiPreview = await simulationApi.analyze({
          teamAPlayers: validA.map((p) => ({
            name: p.player.nickname,
            ppg: p.ppg,
            rpg: p.rpg,
            apg: p.apg,
            eff: p.eff,
            twoPct: p.twoPct,
            threePct: p.threePct,
            gamesPlayed: p.gamesPlayed,
          })),
          teamBPlayers: validB.map((p) => ({
            name: p.player.nickname,
            ppg: p.ppg,
            rpg: p.rpg,
            apg: p.apg,
            eff: p.eff,
            twoPct: p.twoPct,
            threePct: p.threePct,
            gamesPlayed: p.gamesPlayed,
          })),
          projectedTeamAScore: projectedA,
          projectedTeamBScore: projectedB,
          teamAWinPct: winPctA,
          teamBWinPct: winPctB,
        });
      } catch {
        // AI preview is optional — swallow the error
      }

      setResult({
        teamAProfiles: profilesA,
        teamBProfiles: profilesB,
        projectedTeamAScore: projectedA,
        projectedTeamBScore: projectedB,
        teamAWinPct: winPctA,
        teamBWinPct: winPctB,
        teamATopPerformers: topA,
        teamBTopPerformers: topB,
        teamAChartStats: chartA,
        teamBChartStats: chartB,
        keyMatchup: { teamA: keyA, teamB: keyB },
        xFactor: { teamA: xFactorA, teamB: xFactorB },
        recommendations,
        aiPreview,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Simülasyon sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { simulate, reset, loading, error, result };
};
