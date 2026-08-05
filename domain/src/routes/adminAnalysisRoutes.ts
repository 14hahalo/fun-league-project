import { Router } from 'express';
import { AdminAnalysisController } from '../controllers/adminAnalysisController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();

router.post('/backfill', authMiddleware, requireAdmin, AdminAnalysisController.backfill);
router.post('/regenerate/all', authMiddleware, requireAdmin, AdminAnalysisController.regenerateAll);
router.get('/failures', authMiddleware, requireAdmin, AdminAnalysisController.getFailures);
router.post('/regenerate/:playerId', authMiddleware, requireAdmin, AdminAnalysisController.regeneratePlayer);

export default router;
