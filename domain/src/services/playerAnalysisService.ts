import OpenAI from 'openai';
import { db } from '../config/firebase';
import { AppError } from '../middleware/errorHandler';
import { FieldValue, FieldPath } from 'firebase-admin/firestore';
import { cacheService, CacheKeys } from './cacheService';
import { PlayerAnalysis, StructuredInsights } from '../models/PlayerAnalysis';
import { PlayerStatsService } from './playerStatsService';

const ANALYSIS_MODEL = 'gpt-4o-mini';
const MAX_RETRIES = 2;

interface MatchSummary {
  date: string;
  result: 'W' | 'L' | '?';
  pts: number;
  reb: number;
  offReb: number;
  defReb: number;
  ast: number;
  eff: number;
  twoP: string;
  threeP: string;
}

interface CompactPlayerSummary {
  name: string;
  position: string;
  height: number;
  career: {
    games: number;
    avgPts: number;
    avgReb: number;
    avgAst: number;
    avgEff: number;
    twoPct: number;
    threePct: number;
    last5Results: string;
    winStreak: number;
    winPct: number;
  };
  last5Matches: MatchSummary[];
  last10Aggregate: {
    games: number;
    avgPts: number;
    avgReb: number;
    avgAst: number;
    avgEff: number;
  };
  bestGame: MatchSummary | null;
  worstGame: MatchSummary | null;
  trendVsCareer: {
    ptsDelta: number;
    rebDelta: number;
    astDelta: number;
    effDelta: number;
  };
  attendance: {
    daysSinceLastMatch: number;
    avgGapDays: number;
    longestGapDays: number;
    longestGapPeriod: string | null;
    attendanceRatePct: number;
    recentAttendance: string;
  };
}

function calculateEfficiency(stat: {
  twoPointMade: number;
  twoPointAttempts: number;
  threePointMade: number;
  threePointAttempts: number;
  assists: number;
  defensiveRebounds: number;
  offensiveRebounds: number;
}): number {
  const missed2P = stat.twoPointAttempts - stat.twoPointMade;
  const missed3P = stat.threePointAttempts - stat.threePointMade;

  return (
    2 * stat.twoPointMade +
    3 * stat.threePointMade +
    1.5 * stat.assists +
    0.8 * stat.defensiveRebounds +
    1.2 * stat.offensiveRebounds -
    (0.8 * missed2P + 1.2 * missed3P)
  );
}

function round1(n: number): number {
  return Math.round(n * 10) / 10;
}

function avg(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((s, n) => s + n, 0) / nums.length;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function computeAttendance(ascendingDates: Date[]): CompactPlayerSummary['attendance'] {
  const first = ascendingDates[0];
  const last = ascendingDates[ascendingDates.length - 1];

  const daysSinceLastMatch = Math.floor((Date.now() - last.getTime()) / DAY_MS);

  const gaps: number[] = [];
  let longestGapDays = 0;
  let longestGapStart: Date | null = null;
  let longestGapEnd: Date | null = null;

  for (let i = 1; i < ascendingDates.length; i++) {
    const gapDays = Math.round((ascendingDates[i].getTime() - ascendingDates[i - 1].getTime()) / DAY_MS);
    gaps.push(gapDays);
    if (gapDays > longestGapDays) {
      longestGapDays = gapDays;
      longestGapStart = ascendingDates[i - 1];
      longestGapEnd = ascendingDates[i];
    }
  }

  const longestGapPeriod =
    longestGapStart && longestGapEnd
      ? `${longestGapStart.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })} - ${longestGapEnd.toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}`
      : null;

  const totalSpanDays = Math.max(1, Math.round((last.getTime() - first.getTime()) / DAY_MS));
  const weeksElapsed = Math.max(1, totalSpanDays / 7);
  const attendanceRatePct = round1(Math.min(1, ascendingDates.length / weeksElapsed) * 100);

  const recentWindowWeeks = 8;
  const recentWindowDays = recentWindowWeeks * 7;
  const matchesInRecentWindow = ascendingDates.filter((d) => Date.now() - d.getTime() <= recentWindowDays * DAY_MS).length;

  return {
    daysSinceLastMatch,
    avgGapDays: gaps.length > 0 ? round1(avg(gaps)) : 0,
    longestGapDays,
    longestGapPeriod,
    attendanceRatePct,
    recentAttendance: `${matchesInRecentWindow}/${recentWindowWeeks}`,
  };
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

function isValidInsights(val: unknown): val is StructuredInsights {
  if (!val || typeof val !== 'object') return false;
  const obj = val as Record<string, unknown>;
  return (
    typeof obj.summary === 'string' &&
    Array.isArray(obj.strengths) &&
    Array.isArray(obj.weaknesses) &&
    typeof obj.trend === 'string' &&
    typeof obj.attendance === 'string' &&
    typeof obj.advice === 'string'
  );
}

async function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const playerAnalysisService = {
  async buildCompactSummary(playerId: string): Promise<CompactPlayerSummary | null> {
    const playerDoc = await db.collection('players').doc(playerId).get();
    if (!playerDoc.exists) {
      throw new AppError('Oyuncu bulunamadı', 404);
    }
    const playerData = playerDoc.data()!;
    const fullName = `${playerData.firstName || ''} ${playerData.lastName || ''}`.trim();
    const name = playerData.nickname || fullName || 'Bilinmiyor';

    const allStats = await PlayerStatsService.getAllStatsForPlayer(playerId);
    if (allStats.length === 0) return null;

    const gameIds = [...new Set(allStats.map((s) => s.gameId))];
    const gameDocs: FirebaseFirestore.QueryDocumentSnapshot[] = [];
    const batchSize = 10;
    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batchIds = gameIds.slice(i, i + batchSize);
      const snap = await db.collection('games').where(FieldPath.documentId(), 'in', batchIds).get();
      gameDocs.push(...snap.docs);
    }

    const gameMap = new Map(gameDocs.map((d) => [d.id, d.data()]));

    const enriched = allStats
      .filter((s) => {
        const game = gameMap.get(s.gameId);
        return game && game.countInStats !== false;
      })
      .map((s) => {
        const game = gameMap.get(s.gameId)!;
        const teamAScore = game.teamAScore ?? 0;
        const teamBScore = game.teamBScore ?? 0;
        const isTeamA = s.teamType === 'TEAM_A';
        const result: 'W' | 'L' =
          isTeamA ? (teamAScore > teamBScore ? 'W' : 'L') : teamBScore > teamAScore ? 'W' : 'L';
        const date = game.date?.toDate ? game.date.toDate() : new Date(game.date);

        return {
          sortDate: date.getTime(),
          match: {
            date: date.toISOString().slice(0, 10),
            result,
            pts: s.totalPoints,
            reb: s.totalRebounds,
            offReb: s.offensiveRebounds,
            defReb: s.defensiveRebounds,
            ast: s.assists,
            eff: round1(calculateEfficiency(s)),
            twoP: `${s.twoPointMade}/${s.twoPointAttempts}`,
            threeP: `${s.threePointMade}/${s.threePointAttempts}`,
          } as MatchSummary,
        };
      })
      .sort((a, b) => b.sortDate - a.sortDate);

    const matches: MatchSummary[] = enriched.map((entry) => entry.match);

    if (matches.length === 0) return null;

    const ascendingDates = enriched.map((entry) => new Date(entry.sortDate)).reverse();
    const attendance = computeAttendance(ascendingDates);

    const gamesPlayed = matches.length;
    const avgPts = avg(matches.map((m) => m.pts));
    const avgReb = avg(matches.map((m) => m.reb));
    const avgAst = avg(matches.map((m) => m.ast));
    const avgEff = avg(matches.map((m) => m.eff));

    const totalTwo = matches.reduce(
      (acc, m) => {
        const [made, att] = m.twoP.split('/').map(Number);
        return { made: acc.made + made, att: acc.att + att };
      },
      { made: 0, att: 0 }
    );
    const totalThree = matches.reduce(
      (acc, m) => {
        const [made, att] = m.threeP.split('/').map(Number);
        return { made: acc.made + made, att: acc.att + att };
      },
      { made: 0, att: 0 }
    );

    let winStreak = 0;
    for (const m of matches) {
      if (m.result === 'W') winStreak++;
      else break;
    }
    const totalWins = matches.filter((m) => m.result === 'W').length;

    const last5 = matches.slice(0, 5);
    const last10 = matches.slice(0, 10);

    const bestGame = matches.reduce((best, m) => (!best || m.eff > best.eff ? m : best), null as MatchSummary | null);
    const worstGame = matches.reduce((worst, m) => (!worst || m.eff < worst.eff ? m : worst), null as MatchSummary | null);

    return {
      name,
      position: playerData.position || 'N/A',
      height: playerData.height || 0,
      career: {
        games: gamesPlayed,
        avgPts: round1(avgPts),
        avgReb: round1(avgReb),
        avgAst: round1(avgAst),
        avgEff: round1(avgEff),
        twoPct: totalTwo.att > 0 ? round1((totalTwo.made / totalTwo.att) * 100) : 0,
        threePct: totalThree.att > 0 ? round1((totalThree.made / totalThree.att) * 100) : 0,
        last5Results: last5.map((m) => m.result).join(''),
        winStreak,
        winPct: round1((totalWins / gamesPlayed) * 100),
      },
      last5Matches: last5,
      last10Aggregate: {
        games: last10.length,
        avgPts: round1(avg(last10.map((m) => m.pts))),
        avgReb: round1(avg(last10.map((m) => m.reb))),
        avgAst: round1(avg(last10.map((m) => m.ast))),
        avgEff: round1(avg(last10.map((m) => m.eff))),
      },
      bestGame,
      worstGame,
      trendVsCareer: {
        ptsDelta: round1(avg(last5.map((m) => m.pts)) - avgPts),
        rebDelta: round1(avg(last5.map((m) => m.reb)) - avgReb),
        astDelta: round1(avg(last5.map((m) => m.ast)) - avgAst),
        effDelta: round1(avg(last5.map((m) => m.eff)) - avgEff),
      },
      attendance,
    };
  },

  async callOpenAIWithRetry(summary: CompactPlayerSummary): Promise<StructuredInsights> {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError('OpenAI API key bulunamadı', 500);
    }
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `Eğlenceli, enerjik ve samimi bir amatör basketbol ligi spikerisin. Sana verilen istatistiklere dayanarak bir oyuncu için kısa bir performans analizi yazacaksın. Sadece verilen sayılara dayan, uydurma yorum ekleme. Bu lig normalde HAFTALIK oynanır; sana verilen "attendance" verisi oyuncunun maçlara katılım/devamlılık durumunu gösterir ve performans kadar önemlidir. Katılım durumunu MUTLAKA yorumla: uzun bir aradan (örn. longestGapDays büyükse) yeni dönen bir oyuncu için bunu belirt ve bunun ritim kaybına yol açabileceğini söyle; hiç maç kaçırmayan veya düzenli oynayan oyuncuyu istikrar/güvenilirlik için takdir et. Performans trendini (trend) katılım durumuyla BİRLİKTE yorumla: uzun bir aradan hemen sonraki bir düşüş ile her hafta oynarken yaşanan bir düşüş farklı şeylerdir, bunu ayırt et. Türkçe yaz. Yanıtını SADECE geçerli JSON olarak ver, başka hiçbir metin ekleme.`;

    const userPrompt = `Aşağıdaki oyuncu istatistik özetine göre analiz yaz.

${JSON.stringify(summary)}

"attendance" alanındaki bilgiler: daysSinceLastMatch (son maçtan bu yana geçen gün), avgGapDays (maçlar arası ortalama gün), longestGapDays ve longestGapPeriod (en uzun aranın uzunluğu ve hangi dönemde olduğu), attendanceRatePct (yaklaşık katılım oranı), recentAttendance (son 8 haftada kaç maça çıktığı, "x/8" formatında).

Şu JSON formatında yanıt ver:
{
  "summary": "1-2 cümlelik eğlenceli, spiker tonunda genel özet. Somut sayılara referans ver.",
  "strengths": ["güçlü yön 1", "güçlü yön 2"],
  "weaknesses": ["gelişime açık yön 1", "gelişime açık yön 2"],
  "trend": "son 5 maç career ortalamasına göre nasıl (yükseliş/düşüş/stabil), sayılarla açıkla",
  "attendance": "katılım/devamlılık yorumu, somut gün/hafta sayılarıyla (örn. 'Nisan'dan beri sahalarda yoktu' tarzı)",
  "advice": "1 cümlelik samimi tavsiye"
}`;

    let lastError: unknown;
    for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
      try {
        const completion = await openai.chat.completions.create({
          model: ANALYSIS_MODEL,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          temperature: 0.8,
          max_tokens: 700,
          response_format: { type: 'json_object' },
        });

        const content = completion.choices[0]?.message?.content;
        const parsed = safeParseJSON<StructuredInsights>(content);

        if (parsed && isValidInsights(parsed)) {
          return parsed;
        }

        lastError = new Error('AI yanıtı geçersiz JSON formatında');
      } catch (error) {
        lastError = error;
      }

      if (attempt < MAX_RETRIES) {
        await sleep(500 * Math.pow(3, attempt));
      }
    }

    throw lastError instanceof Error ? lastError : new Error('Analiz oluşturulamadı');
  },

  // Idempotent write of a new analysis doc; returns whether a doc was actually written
  // (false = skipped because lastMatchId already matches active doc, or no stats to summarize).
  // Throws on LLM/Firestore failure so callers that need per-player failure reporting (backfill) can catch it.
  async _generateAndWrite(playerId: string, lastMatchId: string | null, force: boolean): Promise<boolean> {
    const activeSnap = await db
      .collection('playerAnalysis')
      .where('playerId', '==', playerId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    const activeDoc = activeSnap.empty ? null : activeSnap.docs[0];

    if (!force && activeDoc && activeDoc.data().lastMatchId === lastMatchId) {
      return false;
    }

    const summary = await this.buildCompactSummary(playerId);
    if (!summary) return false;

    const insights = await this.callOpenAIWithRetry(summary);

    return db.runTransaction(async (tx) => {
      const freshActiveSnap = await tx.get(
        db.collection('playerAnalysis').where('playerId', '==', playerId).where('isActive', '==', true).limit(1)
      );
      const freshActiveDoc = freshActiveSnap.empty ? null : freshActiveSnap.docs[0];

      if (!force && freshActiveDoc && freshActiveDoc.data().lastMatchId === lastMatchId) {
        return false;
      }

      if (freshActiveDoc) {
        tx.update(freshActiveDoc.ref, { isActive: false });
      }

      const newDocRef = db.collection('playerAnalysis').doc();
      tx.set(newDocRef, {
        playerId,
        analysisText: insights.summary,
        structuredInsights: insights,
        generatedAt: FieldValue.serverTimestamp(),
        basedOnMatchCount: summary.career.games,
        lastMatchId,
        isActive: true,
        model: ANALYSIS_MODEL,
        createdAt: FieldValue.serverTimestamp(),
      });

      return true;
    });
  },

  async generateAnalysis(playerId: string, lastMatchId: string | null, force: boolean = false): Promise<void> {
    try {
      const wrote = await this._generateAndWrite(playerId, lastMatchId, force);
      if (wrote) {
        await cacheService.invalidate(CacheKeys.playerAnalysis(playerId));
      }
    } catch (error) {
      console.error(`Oyuncu analizi oluşturulamadı (playerId=${playerId}):`, error);
    }
  },

  async getLatestMatchIdForPlayer(playerId: string): Promise<string | null> {
    const statsSnap = await db.collection('playerStats').where('playerId', '==', playerId).get();
    if (statsSnap.empty) return null;

    const latest = statsSnap.docs
      .map((d) => d.data())
      .sort((a, b) => {
        const aTime = a.createdAt?.toMillis?.() || 0;
        const bTime = b.createdAt?.toMillis?.() || 0;
        return bTime - aTime;
      })[0];

    return latest?.gameId || null;
  },

  async regenerateSinglePlayer(playerId: string): Promise<void> {
    const lastMatchId = await this.getLatestMatchIdForPlayer(playerId);
    if (!lastMatchId) {
      throw new AppError('Bu oyuncu için istatistik bulunamadı', 404);
    }
    await this.generateAnalysis(playerId, lastMatchId, true);
  },

  async regenerateAllPlayers(): Promise<{ triggered: number }> {
    const playersSnap = await db.collection('players').where('isActive', '==', true).get();
    let triggered = 0;

    for (const doc of playersSnap.docs) {
      const lastMatchId = await this.getLatestMatchIdForPlayer(doc.id);
      if (!lastMatchId) continue;

      await this.generateAnalysis(doc.id, lastMatchId, true);
      triggered++;
    }

    return { triggered };
  },

  // One-time backfill: generates an initial analysis for every player who has at least
  // one playerStats entry but no analysis document yet. Safe to re-run — players that
  // already have an analysis (from a prior run or a live trigger) are skipped.
  async backfillMissingAnalyses(): Promise<{
    processed: number;
    skipped: number;
    failed: { playerId: string; error: string }[];
  }> {
    const playersSnap = await db.collection('players').where('isActive', '==', true).get();

    const candidates: string[] = [];
    let skipped = 0;

    for (const doc of playersSnap.docs) {
      const playerId = doc.id;
      const [statsSnap, analysisSnap] = await Promise.all([
        db.collection('playerStats').where('playerId', '==', playerId).limit(1).get(),
        db.collection('playerAnalysis').where('playerId', '==', playerId).limit(1).get(),
      ]);

      if (statsSnap.empty || !analysisSnap.empty) {
        skipped++;
        continue;
      }
      candidates.push(playerId);
    }

    let processed = 0;
    const failed: { playerId: string; error: string }[] = [];
    const CONCURRENCY = 3;
    const DELAY_MS = 500;

    for (let i = 0; i < candidates.length; i += CONCURRENCY) {
      const chunk = candidates.slice(i, i + CONCURRENCY);
      const results = await Promise.allSettled(
        chunk.map(async (playerId) => {
          // Backfill runs have no triggering match, per spec lastMatchId is null here.
          const wrote = await this._generateAndWrite(playerId, null, false);
          if (wrote) {
            await cacheService.invalidate(CacheKeys.playerAnalysis(playerId));
          }
          return wrote;
        })
      );

      results.forEach((result, idx) => {
        const playerId = chunk[idx];
        if (result.status === 'fulfilled') {
          if (result.value) {
            processed++;
          } else {
            skipped++;
          }
        } else {
          const reason = result.reason;
          const message = reason instanceof Error ? reason.message : String(reason);
          failed.push({ playerId, error: message });
          console.error(`Backfill başarısız (playerId=${playerId}):`, reason);
        }
      });

      if (i + CONCURRENCY < candidates.length) {
        await sleep(DELAY_MS);
      }
    }

    return { processed, skipped, failed };
  },

  async getActiveAnalysis(playerId: string): Promise<PlayerAnalysis | null> {
    const cacheKey = CacheKeys.playerAnalysis(playerId);
    const cached = await cacheService.get<PlayerAnalysis>(cacheKey);
    if (cached) return cached;

    const snap = await db
      .collection('playerAnalysis')
      .where('playerId', '==', playerId)
      .where('isActive', '==', true)
      .limit(1)
      .get();

    if (snap.empty) return null;

    const doc = snap.docs[0];
    const data = doc.data();
    const result: PlayerAnalysis = {
      id: doc.id,
      ...data,
      generatedAt: data.generatedAt?.toDate() || new Date(),
      createdAt: data.createdAt?.toDate() || new Date(),
    } as PlayerAnalysis;

    await cacheService.set(cacheKey, result, cacheService.getTTL('ANALYSIS'));
    return result;
  },

  async getAnalysisHistory(
    playerId: string,
    page: number = 1,
    pageSize: number = 10
  ): Promise<{ items: PlayerAnalysis[]; page: number; pageSize: number }> {
    const snap = await db
      .collection('playerAnalysis')
      .where('playerId', '==', playerId)
      .orderBy('generatedAt', 'desc')
      .offset((page - 1) * pageSize)
      .limit(pageSize)
      .get();

    const items = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        generatedAt: data.generatedAt?.toDate() || new Date(),
        createdAt: data.createdAt?.toDate() || new Date(),
      } as PlayerAnalysis;
    });

    return { items, page, pageSize };
  },
};
