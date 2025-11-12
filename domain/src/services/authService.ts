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
      // Find user by nickname
      const usersSnapshot = await db
        .collection(COLLECTION_NAME)
        .where('nickname', '==', loginDto.nickname)
        .get();

      if (usersSnapshot.empty) {
        throw new Error('Invalid nickname or password');
      }

      const playerDoc = usersSnapshot.docs[0];
      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      // Check if user is active
      if (!player.isActive) {
        throw new Error('Account is deactivated');
      }

      // Verify password
      const isPasswordValid = await comparePassword(loginDto.password, player.password);
      if (!isPasswordValid) {
        throw new Error('Invalid nickname or password');
      }

      // Generate tokens
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

      // Update refresh token in database
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
      throw new Error(`Login failed: ${error}`);
    }
  }

  async changePassword(userId: string, changePasswordDto: ChangePasswordDto): Promise<void> {
    try {
      console.log('authService.changePassword called with userId:', userId);
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        console.error('User not found:', userId);
        throw new Error('User not found');
      }

      console.log('User found, validating password...');

      // Validate new password
      if (changePasswordDto.newPassword.length < 6) {
        console.error('Password too short');
        throw new Error('New password must be at least 6 characters long');
      }

      console.log('Password valid, hashing...');
      // Hash new password
      const hashedNewPassword = await hashPassword(changePasswordDto.newPassword);
      console.log('Password hashed, updating database...');

      // Update password and clear needsPasswordChange flag
      await playerDoc.ref.update({
        password: hashedNewPassword,
        needsPasswordChange: false,
        updatedAt: new Date(),
      });

      console.log('Password updated successfully in database');
    } catch (error) {
      console.error('authService.changePassword error:', error);
      throw new Error(`Password change failed: ${error}`);
    }
  }

  async refreshAccessToken(oldRefreshToken: string): Promise<{ accessToken: string; refreshToken: string }> {
    try {
      // Verify refresh token
      const payload = verifyRefreshToken(oldRefreshToken);

      // Find user and verify refresh token matches
      const playerDoc = await db.collection(COLLECTION_NAME).doc(payload.userId).get();

      if (!playerDoc.exists) {
        throw new Error('User not found');
      }

      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      if (player.refreshToken !== oldRefreshToken) {
        throw new Error('Invalid refresh token');
      }

      if (!player.isActive) {
        throw new Error('Account is deactivated');
      }

      // Generate new tokens
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

      // Update refresh token in database
      await playerDoc.ref.update({
        refreshToken,
        updatedAt: new Date(),
      });

      return { accessToken, refreshToken };
    } catch (error) {
      throw new Error(`Token refresh failed: ${error}`);
    }
  }

  async logout(userId: string): Promise<void> {
    try {
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        throw new Error('User not found');
      }

      // Remove refresh token from database
      await playerDoc.ref.update({
        refreshToken: null,
        updatedAt: new Date(),
      });
    } catch (error) {
      throw new Error(`Logout failed: ${error}`);
    }
  }

  async getCurrentUser(userId: string): Promise<any> {
    try {
      const playerDoc = await db.collection(COLLECTION_NAME).doc(userId).get();

      if (!playerDoc.exists) {
        return null;
      }

      const player = { ...playerDoc.data(), id: playerDoc.id } as Player;

      // Return player without password and refreshToken
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
      throw new Error(`Failed to get current user: ${error}`);
    }
  }
}

export default new AuthService();
