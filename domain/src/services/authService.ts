import { db } from '../config/firebase';
import { Player } from '../models/Player';
import { LoginDto } from '../dtos/Auth/LoginDto';
import { AuthResponse } from '../dtos/Auth/AuthResponse';
import { ChangePasswordDto } from '../dtos/Auth/ChangePasswordDto';
import { hashPassword, comparePassword } from '../utils/password';
import { generateAccessToken, generateRefreshToken, verifyRefreshToken } from '../utils/jwt';

const COLLECTION_NAME = 'players';

class AuthService {
  async login(loginDto: LoginDto): Promise<AuthResponse> {
    try {
      const usersSnapshot = await db
        .collection(COLLECTION_NAME)
        .where('nickname', '==', loginDto.nickname)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Geçersiz kullanıcı adı veya şifre');
      }

      const playerDoc = usersSnapshot.docs[0];
      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      if (!player.isActive) {
        throw new Error('Kullanıcı pasif statüsünde !');
      }

      const isPasswordValid = await comparePassword(loginDto.password, player.password);
      if (!isPasswordValid) {
        throw new Error('Geçersiz kullanıcı adı veya şifre');
      }

      const accessToken = generateAccessToken({
        userId: player.id,
        email: '',
        role: player.role,
      });

      const refreshToken = generateRefreshToken({
        userId: player.id,
        email: '',
        role: player.role,
      });

      await playerDoc.ref.update({
        refreshToken,
        updatedAt: new Date(),
      });

      return {
        accessToken,
        refreshToken,
        needsPasswordChange: player.needsPasswordChange || false,
        player: {
          id: player.id,
          nickname: player.nickname,
          role: player.role,
          firstName: player.firstName,
          lastName: player.lastName,
          photoUrl: player.photoUrl,
          jerseyNumber: player.jerseyNumber,
        },
      };
    } catch (error) {
      throw new Error(`Giriş Hatalı : ${error}`);
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        throw new Error('Kullanıcı Bulunamadı');
      }

      if (changePasswordDto.newPassword.length < 6) {
        throw new Error('Yeni şifresiniz en az 6 karakter uzunluğunda olmalı');
      }

      const hashedNewPassword = await hashPassword(changePasswordDto.newPassword);

      await playerDoc.ref.update({
        password: hashedNewPassword,
        needsPasswordChange: false,
        updatedAt: new Date(),
      });

    } catch (error) {
      throw new Error(`Parola değiştirme hatası : ${error}`);
    }
  }

  async refreshAccessToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      const payload = verifyRefreshToken(oldRefreshToken);

      const playerDoc = await db.collection(COLLECTION_NAME).doc(payload.userId).get();

      if (!playerDoc.exists) {
        throw new Error('Kullanıcı Bulunamadı');
      }

      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      if (player.refreshToken !== oldRefreshToken) {
        throw new Error('Geçersiz refresh token');
      }

      if (!player.isActive) {
        throw new Error('Kullanıcı aktif değildir !');
      }

      const accessToken = generateAccessToken({
        userId: player.id,
        email: '',
        role: player.role,
      });

      const refreshToken = generateRefreshToken({
        userId: player.id,
        email: '',
        role: player.role,
      });

      await playerDoc.ref.update({
        refreshToken,
        updatedAt: new Date(),
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Token yenilenirken hata oluştu: ${error}`);
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        throw new Error('Kullanıcı Bulunamadı');
      }

      await playerDoc.ref.update({
        refreshToken: null,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error(`Giriş hatalı: ${error}`);
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    try {
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        return null;
      }

      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      return {
        id: player.id,
        nickname: player.nickname,
        role: player.role,
        needsPasswordChange: player.needsPasswordChange,
        firstName: player.firstName,
        lastName: player.lastName,
        photoUrl: player.photoUrl,
        jerseyNumber: player.jerseyNumber,
        position: player.position,
        isActive: player.isActive,
      };
    } catch (error) {
      throw new Error(`Güncel oyuncu bilgileri çekilirken hata oluştu: ${error}`);
    }
  }
}

export default new AuthService();
