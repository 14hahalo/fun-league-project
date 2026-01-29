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
  avgRebounds: number;
  avgAssists: number;
  twoPointPct: number;
  threePointPct: number;
}

interface TeamBuildResponse {
  teamA: string[];
  teamB: string[];
  analysis: string;
}

interface OpenAITeamBuildResult {
  teamA: string[];
  teamB: string[];
  analysis: string;
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
        `${p.id}|${p.name}|${p.position}|${p.height}cm|${p.gamesPlayed}g|${p.avgPoints.toFixed(1)}p|${p.avgRebounds.toFixed(1)}r|${p.avgAssists.toFixed(1)}a|2P:${p.twoPointPct.toFixed(0)}%|3P:${p.threePointPct.toFixed(0)}%|${p.badges.length > 0 ? p.badges.join(',') : '-'}`
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
            avgRebounds: 0,
            avgAssists: 0,
            twoPointPct: 0,
            threePointPct: 0,
          };
        }

        const totals = stats.reduce(
          (acc, s) => ({
            points: acc.points + (s.totalPoints || 0),
            rebounds: acc.rebounds + (s.totalRebounds || 0),
            assists: acc.assists + (s.assists || 0),
            twoPM: acc.twoPM + (s.twoPointMade || 0),
            twoPA: acc.twoPA + (s.twoPointAttempts || 0),
            threePM: acc.threePM + (s.threePointMade || 0),
            threePA: acc.threePA + (s.threePointAttempts || 0),
          }),
          { points: 0, rebounds: 0, assists: 0, twoPM: 0, twoPA: 0, threePM: 0, threePA: 0 }
        );

        return {
          id: playerIds[index],
          name: displayName,
          position: data?.position || 'N/A',
          height: data?.height || 0,
          badges: data?.badges || [],
          gamesPlayed,
          avgPoints: totals.points / gamesPlayed,
          avgRebounds: totals.rebounds / gamesPlayed,
          avgAssists: totals.assists / gamesPlayed,
          twoPointPct: totals.twoPA > 0 ? (totals.twoPM / totals.twoPA) * 100 : 0,
          threePointPct: totals.threePA > 0 ? (totals.threePM / totals.threePA) * 100 : 0,
        };
      });

      const playerDataStr = buildPlayerDataString(playerProfiles);

      const nameToIdMap = new Map<string, string>();
      playerProfiles.forEach((p) => {
        nameToIdMap.set(p.name.toLowerCase(), p.id);
        nameToIdMap.set(p.id.toLowerCase(), p.id);
      });

      const systemPrompt = `Basketbol kadro uzmanısın. Sadece JSON yanıt ver, başka metin ekleme. Markdown kullanma.`;

      const userPrompt = `10 oyuncuyu 2 dengeli takıma ayır. Her takım 5 kişi.

Kriterler (önem sırasıyla): skor kapasitesi, pozisyon dengesi, boy dengesi, rozetler.

OYUNCU_ID | İsim | Poz | Boy | Maç | Sayı | Rib | Ast | 2P% | 3P% | Rozetler
${playerDataStr}

ÖNEMLİ: Yanıtta SADECE ilk sütundaki OYUNCU_ID değerlerini kullan. İsim kullanma!

Yanıt formatı (sadece JSON, markdown yok):
{"teamA":["OYUNCU_ID_1","OYUNCU_ID_2","OYUNCU_ID_3","OYUNCU_ID_4","OYUNCU_ID_5"],"teamB":["OYUNCU_ID_6","OYUNCU_ID_7","OYUNCU_ID_8","OYUNCU_ID_9","OYUNCU_ID_10"],"analysis":"Kısa analiz"}`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.3,
        max_tokens: 400,
        response_format: { type: 'json_object' },
      });

      const responseContent = completion.choices[0]?.message?.content;
      const parsed = safeParseJSON<OpenAITeamBuildResult>(responseContent);

      let resolvedResult: OpenAITeamBuildResult | null = null;
      if (parsed && Array.isArray(parsed.teamA) && Array.isArray(parsed.teamB)) {
        const resolvedTeamA = parsed.teamA.map((val: string) => nameToIdMap.get(val.toLowerCase()) || val);
        const resolvedTeamB = parsed.teamB.map((val: string) => nameToIdMap.get(val.toLowerCase()) || val);
        resolvedResult = { teamA: resolvedTeamA, teamB: resolvedTeamB, analysis: parsed.analysis || '' };
      }

      if (!resolvedResult || !validateTeamBuildResult(resolvedResult, playerIds)) {
        console.error('Geçersiz OpenAI cevabı:', responseContent);

        const sorted = [...playerProfiles].sort((a, b) => b.avgPoints - a.avgPoints);
        const fallbackTeamA: string[] = [];
        const fallbackTeamB: string[] = [];

        sorted.forEach((p, i) => {
          if (i % 2 === 0) fallbackTeamA.push(p.id);
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

  async generateMatchAnalysis(gameId: string): Promise<string> {
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

      const userPrompt = `Maç Analizi Yaz.

Maç: #${gameData?.gameNumber} (${gameDate})
Skor: A ${gameData?.teamAScore} - ${gameData?.teamBScore} B

Takımlar: ${teamStatsStr}

Oyuncular:
${playerStatsStr}

Markdown formatında yaz. Başlıklar:
1. Maç Özeti (1-2 paragraf)
2. Öne Çıkan Oyuncular (2-3 kişi, MVP seç)
3. Takım Değerlendirmesi
4. Stratejik Notlar (2 madde)

Max 400 kelime. Verilere dayan.`;

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.6,
        max_tokens: 800,
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
