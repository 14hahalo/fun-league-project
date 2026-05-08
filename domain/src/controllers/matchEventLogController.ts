import { Request, Response } from 'express';
import { matchEventLogService } from '../services/matchEventLogService';

export const matchEventLogController = {
  async save(req: Request, res: Response): Promise<void> {
    try {
      const { gameId, events, playerTeams } = req.body;
      if (!gameId || !events || !playerTeams) {
        res.status(400).json({ success: false, message: 'gameId, events ve playerTeams zorunludur' });
        return;
      }
      const log = await matchEventLogService.save(gameId, events, playerTeams);
      res.status(201).json({ success: true, data: log });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Maç event logu kaydedilemedi',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
      });
    }
  },

  async getByGameId(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const log = await matchEventLogService.getByGameId(gameId);
      if (!log) {
        res.status(404).json({ success: false, message: 'Event log bulunamadı' });
        return;
      }
      res.status(200).json({ success: true, data: log });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Event log getirilirken hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
      });
    }
  },
};
