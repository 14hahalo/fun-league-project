import { Request, Response } from 'express';
import { simulationService } from '../services/simulationService';
import { OpenAIQuotaError, OpenAIRateLimitError, OpenAIServiceError } from '../services/openAIService';

export const simulationController = {
  async analyze(req: Request, res: Response): Promise<void> {
    try {
      const analysis = await simulationService.generatePreview(req.body);
      res.json({ success: true, data: analysis });
    } catch (error) {
      if (error instanceof OpenAIQuotaError) {
        res.status(503).json({ success: false, message: error.message });
      } else if (error instanceof OpenAIRateLimitError) {
        res.status(429).json({ success: false, message: error.message });
      } else if (error instanceof OpenAIServiceError) {
        res.status(500).json({ success: false, message: error.message });
      } else {
        res.status(500).json({ success: false, message: 'Simülasyon analizi oluşturulamadı' });
      }
    }
  },
};
