import OpenAI from 'openai';
import { OpenAIServiceError, OpenAIQuotaError, OpenAIRateLimitError } from './openAIService';

const apiKey = process.env.OPENAI_API_KEY;
const openai = new OpenAI({ apiKey: apiKey || '' });

export interface SimPlayerProfile {
  name: string;
  ppg: number;
  rpg: number;
  apg: number;
  eff: number;
  twoPct: number;
  threePct: number;
  gamesPlayed: number;
}

export interface SimulationAnalysisRequest {
  teamAPlayers: SimPlayerProfile[];
  teamBPlayers: SimPlayerProfile[];
  projectedTeamAScore: number;
  projectedTeamBScore: number;
  teamAWinPct: number;
  teamBWinPct: number;
}

function handleOpenAIError(error: unknown): never {
  if (error instanceof OpenAI.APIError) {
    const code = (error as { code?: string }).code;
    if (error.status === 429 && code === 'insufficient_quota') throw new OpenAIQuotaError();
    if (error.status === 429) throw new OpenAIRateLimitError();
    throw new OpenAIServiceError(`OpenAI API hatası: ${error.message}`);
  }
  if (error instanceof Error) throw new OpenAIServiceError(error.message);
  throw new OpenAIServiceError('Bilinmeyen hata');
}

export const simulationService = {
  async generatePreview(req: SimulationAnalysisRequest): Promise<string> {
    if (!apiKey) throw new OpenAIServiceError('OpenAI API key bulunamadı');

    const fmtTeam = (players: SimPlayerProfile[]) =>
      players
        .map(
          (p) =>
            `${p.name}: ${p.ppg.toFixed(1)}pt/${p.rpg.toFixed(1)}r/${p.apg.toFixed(1)}a EFF:${p.eff.toFixed(1)} 2P%:${p.twoPct.toFixed(0)}% 3P%:${p.threePct.toFixed(0)}% (${p.gamesPlayed} maç)`
        )
        .join('\n');

    const prompt = `Aşağıdaki iki takım arasında oynanacak simülasyon maçı için kısa bir Türkçe maç önizlemesi yaz.

Takım A — Tahmini: ${Math.round(req.projectedTeamAScore)} sayı | Kazanma ihtimali: %${Math.round(req.teamAWinPct * 100)}
${fmtTeam(req.teamAPlayers)}

Takım B — Tahmini: ${Math.round(req.projectedTeamBScore)} sayı | Kazanma ihtimali: %${Math.round(req.teamBWinPct * 100)}
${fmtTeam(req.teamBPlayers)}

Şu başlıkları kullanarak yaz:
**Takım Analizi** — Hangi takım avantajlı ve neden (2-3 cümle)
**İzlenmesi Gereken Oyuncular** — Her takımdan birer oyuncu ve kısa gerekçe
**Tahmini Skor** — Skor tahmini ve kısa gerekçe
**Sürpriz Senaryosu** — Beklenmedik bir senaryo

Max 320 kelime. Heyecanlı ve analitik yaz.`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'Profesyonel basketbol analizcisisin. Her zaman Türkçe yaz.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 650,
      });

      const analysis = completion.choices[0]?.message?.content;
      if (!analysis) throw new OpenAIServiceError('Önizleme oluşturulamadı');
      return analysis;
    } catch (error) {
      if (
        error instanceof OpenAIQuotaError ||
        error instanceof OpenAIRateLimitError ||
        error instanceof OpenAIServiceError
      )
        throw error;
      handleOpenAIError(error);
    }
  },
};
