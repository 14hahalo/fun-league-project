import { Request, Response, NextFunction } from 'express';
import { PlayerRole } from '../models/Player';

export const requireRole = (...allowedRoles: PlayerRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).userRole;

    if (!userRole) {
      res.status(401).json({
        success: false,
        message: 'Yetkiniz yok - No role found',
      });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Yetersiz yetki',
      });
      return;
    }

    next();
  };
};
export const requireAdmin = requireRole(PlayerRole.ADMIN);
