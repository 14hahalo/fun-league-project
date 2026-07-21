import { Router } from 'express';
import { AdminAnalysisController } from '../controllers/adminAnalysisController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();

router.post('/backfill', authMiddleware, requireAdmin, AdminAnalysisController.backfill);
router.post('/regenerate/all', authMiddleware, requireAdmin, AdminAnalysisController.regenerateAll);
router.post('/regenerate/:playerId', authMiddleware, requireAdmin, AdminAnalysisController.regeneratePlayer);

export default router;
