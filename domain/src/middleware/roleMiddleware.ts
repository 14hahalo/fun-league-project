import { Request, Response, NextFunction } from 'express';
import { PlayerRole } from '../models/Player';

export const requireRole = (...allowedRoles: PlayerRole[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const userRole = (req as any).userRole;

    if (!userRole) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - No role found',
      });
      return;
    }

    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        message: 'Forbidden - Insufficient permissions',
      });
      return;
    }

    next();
  };
};

// Convenience middleware for admin-only routes
export const requireAdmin = requireRole(PlayerRole.ADMIN);
