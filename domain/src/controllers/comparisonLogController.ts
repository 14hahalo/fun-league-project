import { Request, Response } from 'express';
import { comparisonLogService } from '../services/comparisonLogService';

export const comparisonLogController = {
  async create(req: Request, res: Response) {
    try {
      const { playerAName, playerBName } = req.body;
      if (!playerAName || !playerBName) {
        res.status(400).json({ success: false, message: 'playerAName and playerBName are required' });
        return;
      }

      const forwarded = req.headers['x-forwarded-for'];
      const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) ?? req.ip ?? null;

      await comparisonLogService.log(playerAName, playerBName, ip);

      res.status(201).json({ success: true });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Internal server error' });
    }
  },
};
