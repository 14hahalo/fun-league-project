import { Router } from 'express';
import playerRoutes from './playerRoutes';

const router = Router();

router.use('/players', playerRoutes);

export default router;