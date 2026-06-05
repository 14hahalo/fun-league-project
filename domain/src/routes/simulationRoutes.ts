import { Router } from 'express';
import { simulationController } from '../controllers/simulationController';
import { authMiddleware } from '../middleware/authMiddleware';
import { requireAdmin } from '../middleware/roleMiddleware';

const router = Router();

router.post('/analyze', authMiddleware, requireAdmin, simulationController.analyze);

export default router;
