import { Router } from 'express';
import { matchEventLogController } from '../controllers/matchEventLogController';

const router = Router();

router.post('/', matchEventLogController.save);
router.get('/game/:gameId', matchEventLogController.getByGameId);

export default router;
