import { Router } from 'express';
import { comparisonLogController } from '../controllers/comparisonLogController';

const router = Router();

router.post('/', comparisonLogController.create);

export default router;
