import { Router } from 'express';
import authRoutes from './authRoutes';
import playerRoutes from './playerRoutes';
import teamRoutes from './teamRoutes';
import playerStatsRoutes from './playerStatsRoutes';
import teamStatsRoutes from './teamStatsRoutes';
import gameRoutes from './gameRoutes';
import videoRoutes from './videoRoutes';
import playerRatingRoutes from './playerRatingRoutes';
import seasonRoutes from './seasonRoutes';

const router = Router();

router.use('/auth', authRoutes);
router.use('/players', playerRoutes);
router.use('/teams', teamRoutes);
router.use('/player-stats', playerStatsRoutes);
router.use('/team-stats', teamStatsRoutes);
router.use('/games', gameRoutes);
router.use('/videos', videoRoutes);
router.use('/player-ratings', playerRatingRoutes);
router.use('/seasons', seasonRoutes);

export default router;