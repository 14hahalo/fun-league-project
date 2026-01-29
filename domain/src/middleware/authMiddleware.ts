import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';

export const authMiddleware = (req: Request, res: Response, next: NextFunction): void => {
  try {
    // Authorization header'dan token'ı al
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Token bilgisi eksik',
      });
      return;
    }

    const token = authHeader.substring(7); // 'Bearer ' önekini kaldır

    // Token'ı doğrula
    const payload = verifyAccessToken(token);

    // Kullanıcı bilgilerini request nesnesine ekle
    (req as any).userId = payload.userId;
    (req as any).userEmail = payload.email;
    (req as any).userRole = payload.role;

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Geçersiz token',
      error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
    });
  }
};
