import { Player, PlayerRole, DEFAULT_PLAYER_PASSWORD } from "../models/Player";
import { CreatePlayerDto } from "../dtos/Player/CreatePlayerDTO";
import { UpdatePlayerDto } from "../dtos/Player/UpdatePlayerDTO";
import { db } from "../config/firebase";
import { AppError } from "../middleware/errorHandler";
import { FieldValue } from "firebase-admin/firestore";
import { hashPassword } from "../utils/password";
import { cacheService, CacheKeys } from "./cacheService";

export class PlayerService {
  private static collection = db.collection("players");

  static async getAllPlayers(): Promise<Player[]> {
    try {
      const cacheKey = CacheKeys.allPlayers();
      const cached = await cacheService.get<Player[]>(cacheKey);
      if (cached) return cached;

      const snapshot = await this.collection.get();

      const players = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Player;
      });

      await cacheService.set(cacheKey, players, cacheService.getTTL('PLAYERS'));

      return players;
    } catch (error) {
      throw new AppError("Oyuncular getirilirken hata oluştu", 500);
    }
  }

  static async getActivePlayers(): Promise<Player[]> {
    try {
      const cacheKey = CacheKeys.activePlayers();
      const cached = await cacheService.get<Player[]>(cacheKey);
      if (cached) return cached;

      const snapshot = await this.collection
        .where("isActive", "==", true)
        .get();

      const players = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as Player;
      });

      await cacheService.set(cacheKey, players, cacheService.getTTL('PLAYERS'));

      return players;
    } catch (error) {
      throw new AppError("Aktif oyuncular getirilirken hata oluştu", 500);
    }
  }

  static async getPlayerById(id: string): Promise<Player> {
    try {
      const cacheKey = CacheKeys.player(id);
      const cached = await cacheService.get<Player>(cacheKey);
      if (cached) return cached;

      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      const data = doc.data()!;
      const player = {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Player;

      await cacheService.set(cacheKey, player, cacheService.getTTL('PLAYERS'));

      return player;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu getirilirken hata oluştu", 500);
    }
  }

  static async createPlayer(data: CreatePlayerDto): Promise<Player> {
    try {
      const nicknameSnapshot = await this.collection
        .where("nickname", "==", data.nickname)
        .limit(1)
        .get();

      if (!nicknameSnapshot.empty) {
        throw new AppError("Bu takma ad zaten kullanılıyor", 400);
      }

      const hashedPassword = await hashPassword(DEFAULT_PLAYER_PASSWORD||"aaasssddd");

      const newPlayerData = {
        nickname: data.nickname,
        password: hashedPassword,
        role: PlayerRole.PLAYER,
        needsPasswordChange: true, // Yeni oyuncular ilk girişte şifreyi değiştirmeli
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        jerseyNumber: data.jerseyNumber,
        position: data.position,
        isActive: true,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(newPlayerData);

      const doc = await docRef.get();
      const savedData = doc.data()!;

      const newPlayer = {
        id: doc.id,
        nickname: data.nickname,
        password: hashedPassword,
        role: PlayerRole.PLAYER,
        needsPasswordChange: true,
        firstName: data.firstName,
        lastName: data.lastName,
        photoUrl: data.photoUrl,
        jerseyNumber: data.jerseyNumber,
        position: data.position,
        isActive: true,
        createdAt: savedData.createdAt?.toDate() || new Date(),
        updatedAt: savedData.updatedAt?.toDate() || new Date(),
      };

      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());

      return newPlayer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu oluşturulurken hata oluştu", 500);
    }
  }

  static async updatePlayer(
    id: string,
    data: UpdatePlayerDto
  ): Promise<Player> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      if (data.nickname) {
        const existingSnapshot = await this.collection
          .where("nickname", "==", data.nickname)
          .limit(1)
          .get();

        if (!existingSnapshot.empty && existingSnapshot.docs[0].id !== id) {
          throw new AppError("Bu takma ad zaten kullanılıyor", 400);
        }
      }

      const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      const updatedPlayer = {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Player;

      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());

      return updatedPlayer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu güncellenirken hata oluştu", 500);
    }
  }

  static async deletePlayer(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      await docRef.update({
        isActive: false,
        updatedAt: FieldValue.serverTimestamp(),
      });

      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu silinirken hata oluştu", 500);
    }
  }

  static async permanentDeletePlayer(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      await docRef.delete();

      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu kalıcı olarak silinirken hata oluştu", 500);
    }
  }

  static async setPlayerPassword(id: string, newPassword: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }
      const hashedPassword = await hashPassword(newPassword);
      await docRef.update({
        password: hashedPassword,
        needsPasswordChange: false,
        updatedAt: FieldValue.serverTimestamp(),
      });
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Şifre ayarlanırken hata oluştu", 500);
    }
  }

  static async getPlayerByNickname(nickname: string): Promise<Player | null> {
    try {
      const snapshot = await this.collection
        .where("nickname", "==", nickname)
        .limit(1)
        .get();

      if (snapshot.empty) {
        return null;
      }

      const doc = snapshot.docs[0];
      const data = doc.data();

      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Player;
    } catch (error) {
      throw new AppError("Oyuncu aranırken hata oluştu", 500);
    }
  }
}