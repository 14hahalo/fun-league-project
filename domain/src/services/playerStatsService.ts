import { PlayerStats } from "../models/PlayerStats";
import { CreatePlayerStatsDto } from "../dtos/PlayerStats/CreatePlayerStatsDTO";
import { UpdatePlayerStatsDto } from "../dtos/PlayerStats/UpdatePlayerStatsDTO";
import { db } from "../config/firebase";
import { AppError } from "../middleware/errorHandler";
import { FieldValue } from "firebase-admin/firestore";
import { cacheService, CacheKeys } from "./cacheService";

export class PlayerStatsService {
  private static collection = db.collection("playerStats");

  private static calculateStats(data: {
    twoPointAttempts: number;
    twoPointMade: number;
    threePointAttempts: number;
    threePointMade: number;
    defensiveRebounds: number;
    offensiveRebounds: number;
  }) {
    const twoPointPercentage =
      data.twoPointAttempts > 0
        ? (data.twoPointMade / data.twoPointAttempts) * 100
        : 0;

    const threePointPercentage =
      data.threePointAttempts > 0
        ? (data.threePointMade / data.threePointAttempts) * 100
        : 0;

    const totalRebounds = data.defensiveRebounds + data.offensiveRebounds;
    const totalPoints = data.twoPointMade * 2 + data.threePointMade * 3;

    return {
      twoPointPercentage,
      threePointPercentage,
      totalRebounds,
      totalPoints,
    };
  }

  static async createPlayerStats(
    data: CreatePlayerStatsDto
  ): Promise<PlayerStats> {
    try {
      const calculatedStats = this.calculateStats(data);

      const newStatsData = {
        ...data,
        ...calculatedStats,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(newStatsData);
      const doc = await docRef.get();
      const savedData = doc.data()!;

      const newStats = {
        id: doc.id,
        ...data,
        ...calculatedStats,
        createdAt: savedData.createdAt?.toDate() || new Date(),
        updatedAt: savedData.updatedAt?.toDate() || new Date(),
      };

      await cacheService.invalidatePattern('stats:');
      await cacheService.invalidate(CacheKeys.playerStats(data.playerId));
      await cacheService.invalidate(CacheKeys.gameStats(data.gameId));

      return newStats;
    } catch (error) {
      throw new AppError("Oyuncu istatistikleri oluşturulurken hata oluştu", 500);
    }
  }

  static async getPlayerStatsById(id: string): Promise<PlayerStats> {
    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new AppError("Oyuncu istatistikleri bulunamadı", 404);
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as PlayerStats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  static async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    try {
      const cacheKey = CacheKeys.gameStats(gameId);
      const cached = await cacheService.get<PlayerStats[]>(cacheKey);
      if (cached) return cached;

      const snapshot = await this.collection
        .where("gameId", "==", gameId)
        .get();

      const stats = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PlayerStats;
      });

      await cacheService.set(cacheKey, stats, cacheService.getTTL('STATS'));

      return stats;
    } catch (error) {
      throw new AppError("Maç istatistikleri getirilirken hata oluştu", 500);
    }
  }

  static async getPlayerStatsForGame(
    gameId: string,
    playerId: string
  ): Promise<PlayerStats | null> {
    try {
      const snapshot = await this.collection
        .where("gameId", "==", gameId)
        .where("playerId", "==", playerId)
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
      } as PlayerStats;
    } catch (error) {
      throw new AppError("Oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  static async updatePlayerStats(
    id: string,
    data: UpdatePlayerStatsDto
  ): Promise<PlayerStats> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu istatistikleri bulunamadı", 404);
      }

      const currentData = doc.data()! as PlayerStats;
      const mergedData = { ...currentData, ...data };

      const calculatedStats = this.calculateStats({
        twoPointAttempts: mergedData.twoPointAttempts ?? currentData.twoPointAttempts,
        twoPointMade: mergedData.twoPointMade ?? currentData.twoPointMade,
        threePointAttempts: mergedData.threePointAttempts ?? currentData.threePointAttempts,
        threePointMade: mergedData.threePointMade ?? currentData.threePointMade,
        defensiveRebounds: mergedData.defensiveRebounds ?? currentData.defensiveRebounds,
        offensiveRebounds: mergedData.offensiveRebounds ?? currentData.offensiveRebounds,
      });

      const updateData = {
        ...data,
        ...calculatedStats,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      const updatedStats = {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as PlayerStats;

      await cacheService.invalidatePattern('stats:');
      await cacheService.invalidate(CacheKeys.playerStats(currentData.playerId));
      await cacheService.invalidate(CacheKeys.gameStats(currentData.gameId));

      return updatedStats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu istatistikleri güncellenirken hata oluştu", 500);
    }
  }

  static async deletePlayerStats(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu istatistikleri bulunamadı", 404);
      }

      const data = doc.data() as PlayerStats;
      await docRef.delete();

      await cacheService.invalidatePattern('stats:');
      if (data.playerId) {
        await cacheService.invalidate(CacheKeys.playerStats(data.playerId));
      }
      if (data.gameId) {
        await cacheService.invalidate(CacheKeys.gameStats(data.gameId));
      }
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu istatistikleri silinirken hata oluştu", 500);
    }
  }

  static async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    try {
      const cacheKey = CacheKeys.playerStats(playerId);
      const cached = await cacheService.get<PlayerStats[]>(cacheKey);
      if (cached) return cached;

      const snapshot = await this.collection
        .where("playerId", "==", playerId)
        .get();

      const stats = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PlayerStats;
      });

      await cacheService.set(cacheKey, stats, cacheService.getTTL('STATS'));

      return stats;
    } catch (error) {
      throw new AppError("Oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  static async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    try {
      const cacheKey = CacheKeys.bulkPlayerStats(playerIds);
      const cached = await cacheService.get<Record<string, PlayerStats[]>>(cacheKey);
      if (cached) return cached;

      const result: Record<string, PlayerStats[]> = {};

      // Firestore'da 'in' sorgularında 10 öğe sınırı var, bu yüzden gruplamamız gerekiyor
      const batchSize = 10;

      for (let i = 0; i < playerIds.length; i += batchSize) {
        const batchPlayerIds = playerIds.slice(i, i + batchSize);

        const snapshot = await this.collection
          .where("playerId", "in", batchPlayerIds)
          .get();

        snapshot.docs.forEach((doc) => {
          const data = doc.data();
          const playerStats: PlayerStats = {
            id: doc.id,
            ...data,
            createdAt: data.createdAt?.toDate() || new Date(),
            updatedAt: data.updatedAt?.toDate() || new Date(),
          } as PlayerStats;

          if (!result[playerStats.playerId]) {
            result[playerStats.playerId] = [];
          }
          result[playerStats.playerId].push(playerStats);
        });
      }

      await cacheService.set(cacheKey, result, cacheService.getTTL('STATS'));

      return result;
    } catch (error) {
      throw new AppError("Toplu oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  private static async calculateTopPlayersFromGames(gameIds: string[], cacheKey: string) {
    if (gameIds.length === 0) {
      return {
        topScorer: null,
        bestShooter: null,
        mostRebounds: null,
        mostAssists: null,
      };
    }
    const allStats: PlayerStats[] = [];
    const batchSize = 10;

    for (let i = 0; i < gameIds.length; i += batchSize) {
      const batchGameIds = gameIds.slice(i, i + batchSize);
      const snapshot = await this.collection
        .where("gameId", "in", batchGameIds)
        .get();

      snapshot.docs.forEach((doc) => {
        const data = doc.data();
        allStats.push({
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as PlayerStats);
      });
    }

    const playerAggregates = new Map<string, {
      playerId: string;
      totalPoints: number;
      totalRebounds: number;
      totalAssists: number;
      twoPointMade: number;
      twoPointAttempts: number;
      threePointMade: number;
      threePointAttempts: number;
      gamesPlayed: number;
    }>();

    allStats.forEach(stat => {
      const current = playerAggregates.get(stat.playerId) || {
        playerId: stat.playerId,
        totalPoints: 0,
        totalRebounds: 0,
        totalAssists: 0,
        twoPointMade: 0,
        twoPointAttempts: 0,
        threePointMade: 0,
        threePointAttempts: 0,
        gamesPlayed: 0,
      };

      playerAggregates.set(stat.playerId, {
        playerId: stat.playerId,
        totalPoints: current.totalPoints + stat.totalPoints,
        totalRebounds: current.totalRebounds + stat.totalRebounds,
        totalAssists: current.totalAssists + stat.assists,
        twoPointMade: current.twoPointMade + stat.twoPointMade,
        twoPointAttempts: current.twoPointAttempts + stat.twoPointAttempts,
        threePointMade: current.threePointMade + stat.threePointMade,
        threePointAttempts: current.threePointAttempts + stat.threePointAttempts,
        gamesPlayed: current.gamesPlayed + 1,
      });
    });

    const aggregatesArray = Array.from(playerAggregates.values());

    const topScorer = aggregatesArray.reduce((prev, current) =>
      current.totalPoints > prev.totalPoints ? current : prev
    , aggregatesArray[0]);

    const eligibleShooters = aggregatesArray.filter(p =>
      (p.twoPointAttempts + p.threePointAttempts) >= 10
    );
    const bestShooter = eligibleShooters.length > 0
      ? eligibleShooters.reduce((prev, current) => {
          const prevPct = (prev.twoPointMade + prev.threePointMade) / (prev.twoPointAttempts + prev.threePointAttempts);
          const currentPct = (current.twoPointMade + current.threePointMade) / (current.twoPointAttempts + current.threePointAttempts);
          return currentPct > prevPct ? current : prev;
        })
      : null;

    const mostRebounds = aggregatesArray.reduce((prev, current) =>
      current.totalRebounds > prev.totalRebounds ? current : prev
    , aggregatesArray[0]);

    const mostAssists = aggregatesArray.reduce((prev, current) =>
      current.totalAssists > prev.totalAssists ? current : prev
    , aggregatesArray[0]);

    const topPlayersData = {
      topScorer,
      bestShooter,
      mostRebounds,
      mostAssists,
      allPlayerAggregates: aggregatesArray, 
    };

    await cacheService.set(cacheKey, topPlayersData, cacheService.getTTL('TOP_PLAYERS'));

    return topPlayersData;
  }

  static async getTopPlayers(daysBack: number = 30, endDate?: Date) {
    try {
      const cacheKey = endDate
        ? `${CacheKeys.topPlayers(daysBack)}:${endDate.toISOString()}`
        : CacheKeys.topPlayers(daysBack);
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);

      const gamesCollection = db.collection("games");
      let query = gamesCollection.where("date", ">=", dateThreshold);

      if (endDate) {
        const recentGames = await query.get();
        const filteredGames = recentGames.docs.filter(doc => {
          const gameDate = doc.data().date.toDate();
          return gameDate <= endDate;
        });
        const gameIds = filteredGames.map(doc => doc.id);

        return await this.calculateTopPlayersFromGames(gameIds, cacheKey);
      }

      const recentGames = await query.get();
      const gameIds = recentGames.docs.map(doc => doc.id);

      return await this.calculateTopPlayersFromGames(gameIds, cacheKey);
    } catch (error) {
      throw new AppError("Top oyuncular getirilirken hata oluştu", 500);
    }
  }
}
