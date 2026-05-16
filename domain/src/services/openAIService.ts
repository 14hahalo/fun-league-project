import OpenAI from 'openai';
import { db } from '../config/firebase';

interface PlayerProfile {
  id: string;
  name: string;
  position: string;
  height: number;
  badges: string[];
  gamesPlayed: number;
  avgPoints: number;
  avgOffRebounds: number;
  avgDefRebounds: number;
  avgAssists: number;
  twoPointPct: number;
  threePointPct: number;
}

interface PlayerPeriodStats {
  playerNickname: string;
  teamType: string;
  twoPointMade: number;
  twoPointAttempts: number;
  threePointMade: number;
  threePointAttempts: number;
  offensiveRebounds: number;
  defensiveRebounds: number;
  totalRebounds: number;
  assists: number;
  points: number;
}

interface PeriodStats {
  period: string;
  teamA: PlayerPeriodStats[];
  teamB: PlayerPeriodStats[];
}

interface LogEvent {
  period: string;
  actor: string;
  event: string;
}

interface MatchLogContext {
  events: LogEvent[];
  periodStats: PeriodStats[];
  totalStats: { teamA: PlayerPeriodStats[]; teamB: PlayerPeriodStats[] };
}

interface TeamBuildPair {
  rank: number;
  teamA: string;
  teamB: string;
  swapReason?: string;
}

interface TeamBuildResponse {
  teamA: string[];
  teamB: string[];
  analysis: string;
  pairs?: TeamBuildPair[];
}

interface OpenAITeamBuildResult {
  teamA: string[];
  teamB: string[];
  analysis: string;
  pairs?: TeamBuildPair[];
}

export class OpenAIQuotaError extends Error {
  constructor(message = 'OpenAI API kotası bitmiş.') {
    super(message);
    this.name = 'OpenAIQuotaError';
  }
}

export class OpenAIRateLimitError extends Error {
  constructor(message = 'OpenAI API kullanım sınırına ulaşıldı, sonra tekrar deneyebilirsin.') {
    super(message);
    this.name = 'OpenAIRateLimitError';
  }
}

export class OpenAIServiceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OpenAIServiceError';
  }
}

export class TeamBuildError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'TeamBuildError';
  }
}

const apiKey = process.env.OPENAI_API_KEY;

if (!apiKey) {
  console.warn('OPENAI_API_KEY bulunamadı.');
}

const openai = new OpenAI({
  apiKey: apiKey || '',
});

function handleOpenAIError(error: unknown): never {
  if (error instanceof OpenAI.APIError) {
    const statusCode = error.status;
    const errorCode = (error as { code?: string }).code;

    if (statusCode === 429 && errorCode === 'insufficient_quota') {
      throw new OpenAIQuotaError();
    }

    if (statusCode === 429) {
      throw new OpenAIRateLimitError();
    }

    if (statusCode === 401) {
      throw new OpenAIServiceError('Geçersiz OpenAI API key');
    }

    if (statusCode && statusCode >= 500) {
      throw new OpenAIServiceError('OpenAI servisine ulaşılamıyor');
    }

    throw new OpenAIServiceError(`OpenAI API hatası: ${error.message}`);
  }

  if (error instanceof Error) {
    throw new OpenAIServiceError(error.message);
  }

  throw new OpenAIServiceError('Bilinmeyen OpenAI servis hatası');
}

function safeParseJSON<T>(content: string | null): T | null {
  if (!content) return null;

  try {
    const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (codeBlockMatch) {
      return JSON.parse(codeBlockMatch[1].trim()) as T;
    }

    return JSON.parse(content.trim()) as T;
  } catch {
    return null;
  }
}

function validateTeamBuildResult(
  result: unknown,
  validPlayerIds: string[]
): result is OpenAITeamBuildResult {
  if (!result || typeof result !== 'object') return false;

  const obj = result as Record<string, unknown>;

  if (!Array.isArray(obj.teamA) || !Array.isArray(obj.teamB)) return false;
  if (typeof obj.analysis !== 'string') return false;
  if (obj.teamA.length !== 5 || obj.teamB.length !== 5) return false;

  const allIds = [...obj.teamA, ...obj.teamB] as string[];
  const validSet = new Set(validPlayerIds);

  for (const id of allIds) {
    if (typeof id !== 'string' || !validSet.has(id)) return false;
  }

  const uniqueIds = new Set(allIds);
  if (uniqueIds.size !== 10) return false;

  return true;
}

function buildPlayerDataString(players: PlayerProfile[]): string {
  return players
    .map(
      (p) =>
        `${p.id} | ${p.name} | ${p.position} | ${p.height} | ${p.gamesPlayed} | ${p.avgPoints.toFixed(2)} | ${p.avgOffRebounds.toFixed(2)} | ${p.avgDefRebounds.toFixed(2)} | ${p.avgAssists.toFixed(2)} | ${p.twoPointPct.toFixed(1)} | ${p.threePointPct.toFixed(1)} | ${p.badges.length > 0 ? p.badges.join(',') : 'none'} | ${p.badges.length}`
    )
    .join('\n');
}

export const openAIService = {
  async buildBalancedTeams(playerIds: string[]): Promise<TeamBuildResponse> {
    if (playerIds.length !== 10) {
      throw new TeamBuildError('10 oyuncu seçilmesi gerekmektedir');
    }

    if (!apiKey) {
      throw new OpenAIServiceError('OpenAI API key bulunamadı');
    }

    try {
      const [playerDocs, playerStatsSnapshots] = await Promise.all([
        Promise.all(playerIds.map((id) => db.collection('players').doc(id).get())),
        Promise.all(playerIds.map((id) => db.collection('playerStats').where('playerId', '==', id).get())),
      ]);

      const playerProfiles: PlayerProfile[] = playerDocs.map((doc, index) => {
        if (!doc.exists) {
          throw new TeamBuildError(`Oyuncu bulunamadı: ${playerIds[index]}`);
        }

        const data = doc.data();
        const fullName = `${data?.firstName || ''} ${data?.lastName || ''}`.trim();
        const displayName = data?.nickname || fullName || 'Bilinmiyor';

        const stats = playerStatsSnapshots[index].docs.map((d) => d.data());
        const gamesPlayed = stats.length;

        if (gamesPlayed === 0) {
          return {
            id: playerIds[index],
            name: displayName,
            position: data?.position || 'N/A',
            height: data?.height || 0,
            badges: data?.badges || [],
            gamesPlayed: 0,
            avgPoints: 0,
            avgOffRebounds: 0,
            avgDefRebounds: 0,
            avgAssists: 0,
            twoPointPct: 0,
            threePointPct: 0,
          };
        }

        const totals = stats.reduce(
          (acc, s) => ({
            points: acc.points + (s.totalPoints || 0),
            offReb: acc.offReb + (s.offensiveRebounds || 0),
            defReb: acc.defReb + (s.defensiveRebounds || 0),
            assists: acc.assists + (s.assists || 0),
            twoPM: acc.twoPM + (s.twoPointMade || 0),
            twoPA: acc.twoPA + (s.twoPointAttempts || 0),
            threePM: acc.threePM + (s.threePointMade || 0),
            threePA: acc.threePA + (s.threePointAttempts || 0),
          }),
          { points: 0, offReb: 0, defReb: 0, assists: 0, twoPM: 0, twoPA: 0, threePM: 0, threePA: 0 }
        );

        return {
          id: playerIds[index],
          name: displayName,
          position: data?.position || 'N/A',
          height: data?.height || 0,
          badges: data?.badges || [],
          gamesPlayed,
          avgPoints: totals.points / gamesPlayed,
          avgOffRebounds: totals.offReb / gamesPlayed,
          avgDefRebounds: totals.defReb / gamesPlayed,
          avgAssists: totals.assists / gamesPlayed,
          twoPointPct: totals.twoPA > 0 ? (totals.twoPM / totals.twoPA) * 100 : 0,
          threePointPct: totals.threePA > 0 ? (totals.threePM / totals.threePA) * 100 : 0,
        };
      });

      // Replace real Firestore IDs with short labels so the AI can't confuse an ID with a player name
      const labelToIdMap = new Map<string, string>();
      const labeledProfiles = playerProfiles.map((p, i) => {
        const label = `P${i + 1}`;
        labelToIdMap.set(label, p.id);
        return { ...p, id: label };
      });
      const playerDataStr = buildPlayerDataString(labeledProfiles);

      // Fallback name map in case the AI returns a player name instead of a label
      const validIdSet = new Set(playerIds);
      const nameToIdMap = new Map<string, string>();
      playerProfiles.forEach((p) => {
        nameToIdMap.set(p.name.toLowerCase().replace(/\s+/g, ''), p.id);
      });
      playerProfiles.forEach((p) => {
        nameToIdMap.set(p.name.toLowerCase(), p.id);
      });

      const systemPrompt = `You are a basketball roster balancing engine. Your only job is to split players into two teams as evenly as possible based on their statistics. Always respond with valid JSON only — no markdown, no explanation outside the JSON.`;

      const userPrompt = `Split the following 10 basketball players into 2 perfectly balanced teams of 5.

Balancing Algorithm (follow these steps in order)

Step 1 — Compute a composite score for each player: compositeScore = (avgPoints × 0.3) + (avgOffReb × 0.15) + (avgDefReb × 0.12) + (avgAssists × 0.22) + (twoPointPct × 0.10) + (threePointPct × 0.10) + (badgeCount × 0.05)

For players with 0 games played, treat compositeScore as the league median (assume 1.00)

Step 2 — Sort players by compositeScore descending.

Step 3 — Apply snake draft assignment: Pick 1 → Team A Pick 2 → Team B Pick 3 → Team B Pick 4 → Team A Pick 5 → Team A Pick 6 → Team B Pick 7 → Team B Pick 8 → Team A Pick 9 → Team A Pick 10 → Team B

Step 4 — Check position balance. Each team should have at least 1 guard (PG or SG) and 1 big (C or PF). If not, swap the lowest-impact player that fixes the imbalance between the two teams.

Step 5 — Check badge distribution. If one team has more than 2 extra badges than the other, swap the badge-heaviest player with the closest compositeScore match on the other team.

Step 6 — Skill archetype tagging & distribution check.
Tag each player with their dominant archetype(s):

SHOOTER: 3PPct ≥ 30
REBOUNDER: (avgOffReb + avgDefReb) ≥ 9
PLAYMAKER: avgAssists ≥ 4
SCORER: avgPoints ≥ 14

Then count each archetype per team. If any archetype has a 2+ difference between teams, swap the lightest-impact player carrying that archetype with the closest compositeScore match on the other team.

Step 7 — Guard playmaker balance.
If both primary playmakers (players with avgAssists ≥ 4 AND position = PG or SG) are on the same team, forcibly swap one with the closest compositeScore player on the opposing team — regardless of position.

Step 8 — Three-point threat balance.
Count players with 3PPct ≥ 30 per team. If difference ≥ 2, swap the shooter with lowest compositeScore to the other team, replacing closest compositeScore match.

Player Data

PLAYER_ID | Name | Position | Height | Games | AvgPoints | AvgOffReb | AvgDefReb | AvgAssists | 2PPct | 3PPct | Badges | BadgeCount
${playerDataStr}

Rules

Use ONLY the PLAYER_ID values from the first column in your response. Never use names.

Every player must appear in exactly one team. No player can be in both or neither.

teamA and teamB must each have exactly 5 players.

The analysis field must include: Team A composite total, Team B composite total, and the difference.

Response format (JSON only, no markdown):

{ "teamA": ["P_ID", "P_ID", "P_ID", "P_ID", "P_ID"], "teamB": ["P_ID", "P_ID", "P_ID", "P_ID", "P_ID"], "pairs": [ { "rank": 1, "teamA": "P_ID (compositeScore)", "teamB": "P_ID (compositeScore)" }, { "rank": 2, "teamA": "P_ID (compositeScore)", "teamB": "P_ID (compositeScore)" }, { "rank": 3, "teamA": "P_ID (compositeScore)", "teamB": "P_ID (compositeScore)" }, { "rank": 4, "teamA": "P_ID (compositeScore)", "teamB": "P_ID (compositeScore)" }, { "rank": 5, "teamA": "P_ID (compositeScore)", "teamB": "P_ID (compositeScore)" } ], "analysis": "Team A composite: X.XX | Team B composite: X.XX | Difference: X.XX | Position balance: OK/ADJUSTED | Badge balance: OK/ADJUSTED | Archetype balance: A[Shooter:X Rebounder:X Playmaker:X Scorer:X] vs B[Shooter:X Rebounder:X Playmaker:X Scorer:X]" }

Pairs field rules:
- rank 1: Pick 1 (A) paired with Pick 2 (B)
- rank 2: Pick 3 (B) paired with Pick 4 (A)
- rank 3: Pick 5 (A) paired with Pick 6 (B)
- rank 4: Pick 7 (B) paired with Pick 8 (A)
- rank 5: Pick 9 (A) paired with Pick 10 (B)
- Always show the stronger player of each pair first within the pair object.
- If any swap occurred in Steps 4–8, reflect the FINAL assignment (post-swap) in pairs.
- For every pair affected by a swap, add a "swapReason" field explaining why: "swapReason": "ADJUSTED — [reason]". Possible reasons: "Position imbalance: needed guard/big on TeamX (Step 4)", "Badge imbalance: redistributed badge-heavy player (Step 5)", "Archetype imbalance: [SHOOTER/REBOUNDER/PLAYMAKER/SCORER] clustered on TeamX (Step 6)", "Guard playmaker imbalance: both primary playmakers were on TeamX (Step 7)", "Three-point threat imbalance: shooters clustered on TeamX (Step 8)".
- For pairs with no swap, omit the swapReason field entirely.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.0,
        max_tokens: 1200,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      const parsed = safeParseJSON<OpenAITeamBuildResult>(responseContent);

      const resolveId = (val: string): string => {
        const trimmed = val.trim();
        if (labelToIdMap.has(trimmed)) return labelToIdMap.get(trimmed)!;
        if (validIdSet.has(trimmed)) return trimmed;
        return nameToIdMap.get(trimmed.toLowerCase()) || trimmed;
      };

      const resolvePairEntry = (entry: string): string =>
        entry.replace(/\b(P\d+)\b/g, (label) => labelToIdMap.get(label) || label);

      let resolvedResult: OpenAITeamBuildResult | null = null;
      if (parsed && Array.isArray(parsed.teamA) && Array.isArray(parsed.teamB)) {
        const resolvedTeamA = parsed.teamA.map(resolveId);
        const resolvedTeamB = parsed.teamB.map(resolveId);
        const resolvedPairs = Array.isArray(parsed.pairs)
          ? parsed.pairs.map((pair: TeamBuildPair) => ({
              ...pair,
              teamA: resolvePairEntry(pair.teamA),
              teamB: resolvePairEntry(pair.teamB),
            }))
          : undefined;
        resolvedResult = { teamA: resolvedTeamA, teamB: resolvedTeamB, analysis: parsed.analysis || '', pairs: resolvedPairs };
      }

      if (!resolvedResult || !validateTeamBuildResult(resolvedResult, playerIds)) {
        console.error('Geçersiz OpenAI cevabı:', responseContent);

        const sorted = [...playerProfiles].sort((a, b) => b.avgPoints - a.avgPoints);
        const fallbackTeamA: string[] = [];
        const fallbackTeamB: string[] = [];

        const snakePattern = [0, 1, 1, 0, 0, 1, 1, 0, 0, 1];
        sorted.forEach((p, i) => {
          if (snakePattern[i] === 0) fallbackTeamA.push(p.id);
          else fallbackTeamB.push(p.id);
        });

        return {
          teamA: fallbackTeamA,
          teamB: fallbackTeamB,
          analysis: 'AI yanıtı işlenemedi. Sayı ortalamasına göre basit dağıtım yapıldı.',
        };
      }

      return {
        teamA: resolvedResult.teamA,
        teamB: resolvedResult.teamB,
        analysis: resolvedResult.analysis,
        pairs: resolvedResult.pairs,
      };
    } catch (error) {
      if (
        error instanceof OpenAIQuotaError ||
        error instanceof OpenAIRateLimitError ||
        error instanceof OpenAIServiceError ||
        error instanceof TeamBuildError
      ) {
        throw error;
      }

      handleOpenAIError(error);
    }
  },

  async generateMatchAnalysis(gameId: string, logContext?: MatchLogContext): Promise<string> {
    if (!apiKey) {
      throw new OpenAIServiceError('OpenAI API bulunamadı');
    }

    try {
      const [playerStatsSnap, teamStatsSnap, gameDoc] = await Promise.all([
        db.collection('playerStats').where('gameId', '==', gameId).get(),
        db.collection('teamStats').where('gameId', '==', gameId).get(),
        db.collection('games').doc(gameId).get(),
      ]);

      if (!gameDoc.exists) {
        throw new OpenAIServiceError('Maç bilgisi bulunamadı');
      }

      const gameData = gameDoc.data();
      const playerIds = playerStatsSnap.docs.map((doc) => doc.data().playerId);

      const playerDocs = await Promise.all(
        playerIds.map((id) => db.collection('players').doc(id).get())
      );

      const playerNameMap = new Map<string, string>();
      playerDocs.forEach((doc, index) => {
        if (doc.exists) {
          const data = doc.data();
          const fullName = `${data?.firstName || ''} ${data?.lastName || ''}`.trim();
          playerNameMap.set(playerIds[index], data?.nickname || fullName || 'Bilinmiyor');
        } else {
          playerNameMap.set(playerIds[index], 'Bilinmiyor');
        }
      });

      const playerStatsStr = playerStatsSnap.docs
        .map((doc) => {
          const d = doc.data();
          const name = playerNameMap.get(d.playerId) || 'N/A';
          return `${name}(${d.teamType}):${d.totalPoints}p,${d.totalRebounds}r(${d.offensiveRebounds}o/${d.defensiveRebounds}d),${d.assists}a,2P:${d.twoPointMade}/${d.twoPointAttempts},3P:${d.threePointMade}/${d.threePointAttempts}`;
        })
        .join('\n');

      const teamStatsStr = teamStatsSnap.docs
        .map((doc) => {
          const d = doc.data();
          return `${d.teamType}:${d.totalPoints}p,${d.totalRebounds}r,${d.assists}a,2P%:${d.twoPointPercentage?.toFixed(1)},3P%:${d.threePointPercentage?.toFixed(1)}`;
        })
        .join(' | ');

      const gameDate = new Date(gameData?.date?.toDate?.() || gameData?.date).toLocaleDateString(
        'tr-TR'
      );

      const systemPrompt = `Profesyonel basketbol maç analizcisisin. Türkçe yaz.`;

      let userPrompt = `Maç Analizi Yaz.

Maç: #${gameData?.gameNumber} (${gameDate})
Skor: A ${gameData?.teamAScore} - ${gameData?.teamBScore} B

Takımlar: ${teamStatsStr}

Oyuncular:
${playerStatsStr}`;

      if (logContext && logContext.periodStats?.length > 0) {
        const pct = (m: number, a: number) => a > 0 ? `${((m / a) * 100).toFixed(0)}%` : '-';
        const fmtPlayer = (p: PlayerPeriodStats) =>
          `${p.playerNickname}:${p.points}p,${p.totalRebounds}r,${p.assists}a,2P:${p.twoPointMade}/${p.twoPointAttempts}(${pct(p.twoPointMade, p.twoPointAttempts)}),3P:${p.threePointMade}/${p.threePointAttempts}(${pct(p.threePointMade, p.threePointAttempts)})`;

        const periodSummary = logContext.periodStats.map(ps => {
          const aLine = ps.teamA.map(fmtPlayer).join(' | ');
          const bLine = ps.teamB.map(fmtPlayer).join(' | ');
          const aTotal = ps.teamA.reduce((s, p) => s + p.points, 0);
          const bTotal = ps.teamB.reduce((s, p) => s + p.points, 0);
          return `${ps.period} (A:${aTotal} - B:${bTotal})\n  A: ${aLine}\n  B: ${bLine}`;
        }).join('\n\n');

        userPrompt += `\n\nPERİYOT BAZLI İSTATİSTİKLER:\n${periodSummary}`;
      }

      userPrompt += `

Markdown formatında yaz. Başlıklar:
1. Maç Özeti (1-2 paragraf)
2. Periyot Analizi${logContext?.periodStats?.length ? ' (her periyot için momentum ve öne çıkan oyuncular)' : ''}
3. Öne Çıkan Oyuncular (2-3 kişi, MVP seç)
4. Takım Değerlendirmesi (ribaund hakimiyeti, şut verimliliği)
5. Stratejik Notlar (2 madde)

Max ${logContext ? 600 : 400} kelime. Verilere dayan.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: logContext ? 1200 : 800,
      });

      const analysis = completion.choices[0]?.message?.content;

      if (!analysis) {
        throw new OpenAIServiceError('Analiz oluşturulamadı');
      }

      return analysis;
    } catch (error) {
      if (
        error instanceof OpenAIQuotaError ||
        error instanceof OpenAIRateLimitError ||
        error instanceof OpenAIServiceError
      ) {
        throw error;
      }

      handleOpenAIError(error);
    }
  },
};
