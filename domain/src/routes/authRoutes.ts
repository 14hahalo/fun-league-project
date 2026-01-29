import { Router } from 'express';
import authController from '../controllers/authController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

router.post('/login', authController.login);
router.post('/refresh', authController.refreshToken);

router.post('/logout', authMiddleware, authController.logout);
router.post('/change-password', authMiddleware, authController.changePassword);
router.get('/me', authMiddleware, authController.getCurrentUser);

export default router;
