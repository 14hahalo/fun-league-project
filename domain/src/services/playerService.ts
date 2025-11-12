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

  // Tüm oyuncuları getir
  static async getAllPlayers(): Promise<Player[]> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.allPlayers();
      const cached = await cacheService.get<Player[]>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
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

      // Cache the result
      await cacheService.set(cacheKey, players, cacheService.getTTL('PLAYERS'));

      return players;
    } catch (error) {
      throw new AppError("Oyuncular getirilirken hata oluştu", 500);
    }
  }

  // Aktif oyuncuları getir
  static async getActivePlayers(): Promise<Player[]> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.activePlayers();
      const cached = await cacheService.get<Player[]>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
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

      // Cache the result
      await cacheService.set(cacheKey, players, cacheService.getTTL('PLAYERS'));

      return players;
    } catch (error) {
      throw new AppError("Aktif oyuncular getirilirken hata oluştu", 500);
    }
  }

  // ID'ye göre oyuncu getir
  static async getPlayerById(id: string): Promise<Player> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.player(id);
      const cached = await cacheService.get<Player>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
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

      // Cache the result
      await cacheService.set(cacheKey, player, cacheService.getTTL('PLAYERS'));

      return player;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu getirilirken hata oluştu", 500);
    }
  }

  // Yeni oyuncu oluştur
  static async createPlayer(data: CreatePlayerDto): Promise<Player> {
    try {
      // Aynı nickname kontrolü
      const nicknameSnapshot = await this.collection
        .where("nickname", "==", data.nickname)
        .limit(1)
        .get();

      if (!nicknameSnapshot.empty) {
        throw new AppError("Bu takma ad zaten kullanılıyor", 400);
      }

      // Hash default password
      const hashedPassword = await hashPassword(DEFAULT_PLAYER_PASSWORD);

      const newPlayerData = {
        nickname: data.nickname,
        password: hashedPassword,
        role: PlayerRole.PLAYER,
        needsPasswordChange: true, // New players must change password on first login
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

      // Yeni eklenen dokümanı getir
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

      // Invalidate all players cache
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());

      return newPlayer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu oluşturulurken hata oluştu", 500);
    }
  }

  // Oyuncu güncelle
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

      // Nickname güncelleniyorsa, benzersizlik kontrolü
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

      // Güncellenmiş dokümanı getir
      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      const updatedPlayer = {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Player;

      // Invalidate caches
      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());

      return updatedPlayer;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu güncellenirken hata oluştu", 500);
    }
  }

  // Oyuncu sil (soft delete)
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

      // Invalidate caches
      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu silinirken hata oluştu", 500);
    }
  }

  // Oyuncu kalıcı olarak sil (hard delete)
  static async permanentDeletePlayer(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      await docRef.delete();

      // Invalidate caches
      await cacheService.invalidate(CacheKeys.player(id));
      await cacheService.invalidate(CacheKeys.allPlayers());
      await cacheService.invalidate(CacheKeys.activePlayers());
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu kalıcı olarak silinirken hata oluştu", 500);
    }
  }

  // Admin sets player password
  static async setPlayerPassword(id: string, newPassword: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu bulunamadı", 404);
      }

      // Hash the new password
      const hashedPassword = await hashPassword(newPassword);

      // Update password and clear needsPasswordChange flag
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

  // Bonus: Nickname'e göre arama (case-insensitive için normalize edilmiş alan kullanabilirsiniz)
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