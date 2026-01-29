import { Request, Response } from 'express';
import authService from '../services/authService';
import { LoginDto } from '../dtos/Auth/LoginDto';
import { ChangePasswordDto } from '../dtos/Auth/ChangePasswordDto';
import { RefreshTokenDto } from '../dtos/Auth/RefreshTokenDto';

class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    try {
      const loginDto: LoginDto = req.body;

      if (!loginDto.nickname || !loginDto.password) {
        res.status(400).json({
          success: false,
          message: 'Kullanıcı Adı ve şifre boş geçilemez',
        });
        return;
      }

      const authResponse = await authService.login(loginDto);

      res.status(200).json({
        success: true,
        data: authResponse,
        message: 'Giriş Başarılı',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Hatalı Giriş Denemesi',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
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
          message: 'Yetkiniz Yok',
        });
        return;
      }

      if (!changePasswordDto.newPassword) {
        res.status(400).json({
          success: false,
          message: 'Yeni şifre giriniz',
        });
        return;
      }

      await authService.changePassword(userId, changePasswordDto);

      res.status(200).json({
        success: true,
        message: 'Şifre Başarı ile güncellendi',
      });
    } catch (error) {
      console.error('Şifre değiştirme esnasında bir hata oluştu:', error);
      res.status(400).json({
        success: false,
        message: 'Şifre değiştirme esnasında bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen hata',
      });
    }
  }

  async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken }: RefreshTokenDto = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          message: 'Refresh token bulunamadı',
        });
        return;
      }

      const tokens = await authService.refreshAccessToken(refreshToken);

      res.status(200).json({
        success: true,
        data: tokens,
        message: 'Token başarı ile yenilendi',
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        message: 'Token yenilemesi hatalı',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
      });
    }
  }

  async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Yetkiniz yok',
        });
        return;
      }

      await authService.logout(userId);

      res.status(200).json({
        success: true,
        message: 'Çıkış Başarılı',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Çıkış yaparken hata ile karşılaşıldı',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
      });
    }
  }

  async getCurrentUser(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).userId;

      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Yetkiniz yok',
        });
        return;
      }

      const user = await authService.getCurrentUser(userId);

      if (!user) {
        res.status(404).json({
          success: false,
          message: 'Kullanıcı Bulunamadı',
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'User başarı ile eşleşti',
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'User eşleşme hatası',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata',
      });
    }
  }
}

export default new AuthController();
