import { Router } from 'express';
import videoController from '../controllers/videoController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();

// Public routes - anyone can view videos
router.get('/', videoController.getAllVideos);
router.get('/game/:gameId', videoController.getVideosByGameId);
router.get('/player/:playerId', videoController.getVideosByPlayerId);
router.get('/:id', videoController.getVideoById);

// Admin only routes - manage videos
router.post('/', authMiddleware, requireAdmin, videoController.createVideo);
router.put('/:id', authMiddleware, requireAdmin, videoController.updateVideo);
router.delete('/:id', authMiddleware, requireAdmin, videoController.deleteVideo);

export default router;
