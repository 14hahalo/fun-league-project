import { Request, Response } from 'express';
import authService from '../services/authService';
import { LoginDto } from '../dtos/Auth/LoginDto';
import { ChangePasswordDto } from '../dtos/Auth/ChangePasswordDto';
import { RefreshTokenDto } from '../dtos/Auth/RefreshTokenDto';

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginDto: LoginDto = req.body;

      // Validate required fields
      if (!loginDto.nickname || !loginDto.password) {
        res.status(400).json({
          success: false,
          message: 'Nickname and password are required',
        });
        return;
      }

      const authResponse = await authService.login(loginDto);

      res.status(200).json({
        success: true,
        data: authResponse,
        message: 'Login successful',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Login failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;
      const changePasswordDto: ChangePasswordDto = req.body;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      // Validate required fields
      if (!changePasswordDto.newPassword) {
        res.status(400).json({
          success: false,
          message: 'New password is required',
        });
        return;
      }

      await authService.changePassword(userId, changePasswordDto);

      res.status(200).json({
        success: true,
        message: 'Password changed successfully',
      });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(400).json({
        success: false,
        message: 'Password change failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token is required',
        });
        return;
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: tokens,
        message: 'Token refreshed successfully',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token refresh failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      // userId is added by auth middleware
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      await authService.logout(userId);

      res.status(200).json({
        success: true,
        message: 'Logout successful',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Logout failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      // userId is added by auth middleware
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized',
        });
        return;
      }

      const user = await authService.getCurrentUser(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'User not found',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User retrieved successfully',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to get current user',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }
}

export default new AuthController();
