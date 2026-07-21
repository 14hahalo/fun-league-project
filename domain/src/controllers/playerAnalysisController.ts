import { Request, Response, NextFunction } from 'express';
import { playerAnalysisService } from '../services/playerAnalysisService';

export class PlayerAnalysisController {
  static async getActiveAnalysis(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const analysis = await playerAnalysisService.getActiveAnalysis(id);

      res.status(200).json({
        success: true,
        data: analysis,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getAnalysisHistory(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { id } = req.params;
      const page = req.query.page ? parseInt(req.query.page as string) : 1;
      const pageSize = req.query.pageSize ? parseInt(req.query.pageSize as string) : 10;

      const history = await playerAnalysisService.getAnalysisHistory(id, page, pageSize);

      res.status(200).json({
        success: true,
        data: history,
      });
    } catch (error) {
      next(error);
    }
  }
}
