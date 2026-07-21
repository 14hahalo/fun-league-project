import { Request, Response, NextFunction } from 'express';
import { playerAnalysisService } from '../services/playerAnalysisService';

export class AdminAnalysisController {
  static async regeneratePlayer(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { playerId } = req.params;
      await playerAnalysisService.regenerateSinglePlayer(playerId);

      res.status(200).json({
        success: true,
        message: 'Oyuncu analizi yeniden oluşturuldu',
      });
    } catch (error) {
      next(error);
    }
  }

  static async regenerateAll(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      // Uzun sürebileceği için (her oyuncu için ayrı LLM çağrısı) isteği bloklamadan arka planda çalıştırılır
      playerAnalysisService.regenerateAllPlayers().catch((error) => {
        console.error('Toplu analiz yenileme başarısız:', error);
      });

      res.status(202).json({
        success: true,
        message: 'Tüm oyuncular için analiz yenileme işlemi arka planda başlatıldı',
      });
    } catch (error) {
      next(error);
    }
  }

  // One-off bulk backfill for players with match history but no analysis yet.
  // Awaited (not fire-and-forget) so the summary can be returned/logged for retries.
  static async backfill(_req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const summary = await playerAnalysisService.backfillMissingAnalyses();
      console.log('Analiz backfill tamamlandı:', summary);

      res.status(200).json({
        success: true,
        data: summary,
      });
    } catch (error) {
      next(error);
    }
  }
}
