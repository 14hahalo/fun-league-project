import { PlayerStats } from "../models/PlayerStats";
import { CreatePlayerStatsDto } from "../dtos/PlayerStats/CreatePlayerStatsDTO";
import { UpdatePlayerStatsDto } from "../dtos/PlayerStats/UpdatePlayerStatsDTO";
import { db } from "../config/firebase";
import { AppError } from "../middleware/errorHandler";
import { FieldValue } from "firebase-admin/firestore";
import { cacheService, CacheKeys } from "./cacheService";

export class PlayerStatsService {
  private static collection = db.collection("playerStats");

  // Helper: Calculate percentages and totals
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

  // Create player stats
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

      // Invalidate related caches
      await cacheService.invalidatePattern('stats:');
      await cacheService.invalidate(CacheKeys.playerStats(data.playerId));
      await cacheService.invalidate(CacheKeys.gameStats(data.gameId));

      return newStats;
    } catch (error) {
      throw new AppError("Oyuncu istatistikleri oluşturulurken hata oluştu", 500);
    }
  }

  // Get player stats by ID
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

  // Get all player stats for a game
  static async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.gameStats(gameId);
      const cached = await cacheService.get<PlayerStats[]>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
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

      // Cache the result
      await cacheService.set(cacheKey, stats, cacheService.getTTL('STATS'));

      return stats;
    } catch (error) {
      throw new AppError("Maç istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Get stats for a specific player in a specific game
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

  // Update player stats
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

      // Invalidate related caches
      await cacheService.invalidatePattern('stats:');
      await cacheService.invalidate(CacheKeys.playerStats(currentData.playerId));
      await cacheService.invalidate(CacheKeys.gameStats(currentData.gameId));

      return updatedStats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu istatistikleri güncellenirken hata oluştu", 500);
    }
  }

  // Delete player stats
  static async deletePlayerStats(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Oyuncu istatistikleri bulunamadı", 404);
      }

      const data = doc.data() as PlayerStats;
      await docRef.delete();

      // Invalidate related caches
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

  // Get all stats for a specific player across all games
  static async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.playerStats(playerId);
      const cached = await cacheService.get<PlayerStats[]>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
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

      // Cache the result
      await cacheService.set(cacheKey, stats, cacheService.getTTL('STATS'));

      return stats;
    } catch (error) {
      throw new AppError("Oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Get stats for multiple players at once (BULK ENDPOINT for performance)
  static async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    try {
      // Check cache first
      const cacheKey = CacheKeys.bulkPlayerStats(playerIds);
      const cached = await cacheService.get<Record<string, PlayerStats[]>>(cacheKey);
      if (cached) return cached;

      // Fetch from Firebase
      const result: Record<string, PlayerStats[]> = {};

      // Firestore has a limit of 10 items in 'in' queries, so we need to batch
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

      // Cache the result
      await cacheService.set(cacheKey, result, cacheService.getTTL('STATS'));

      return result;
    } catch (error) {
      throw new AppError("Toplu oyuncu istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Helper method to calculate top players from a list of game IDs
  private static async calculateTopPlayersFromGames(gameIds: string[], cacheKey: string) {
    if (gameIds.length === 0) {
      return {
        topScorer: null,
        bestShooter: null,
        mostRebounds: null,
        mostAssists: null,
      };
    }

    // Get all player stats for these games
    // Note: Firestore has a limit of 10 items in 'in' queries, so we need to batch
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

    // Aggregate stats by player
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

    // Find top performers
    const aggregatesArray = Array.from(playerAggregates.values());

    // Top scorer - most total points
    const topScorer = aggregatesArray.reduce((prev, current) =>
      current.totalPoints > prev.totalPoints ? current : prev
    , aggregatesArray[0]);

    // Best shooter - highest overall shooting percentage (minimum 10 attempts)
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

    // Most rebounds
    const mostRebounds = aggregatesArray.reduce((prev, current) =>
      current.totalRebounds > prev.totalRebounds ? current : prev
    , aggregatesArray[0]);

    // Most assists
    const mostAssists = aggregatesArray.reduce((prev, current) =>
      current.totalAssists > prev.totalAssists ? current : prev
    , aggregatesArray[0]);

    const topPlayersData = {
      topScorer,
      bestShooter,
      mostRebounds,
      mostAssists,
      allPlayerAggregates: aggregatesArray, // Include all player aggregates for efficiency ranking
    };

    // Cache the result (shorter TTL for top players as it changes more frequently)
    await cacheService.set(cacheKey, topPlayersData, cacheService.getTTL('TOP_PLAYERS'));

    return topPlayersData;
  }

  // Get top players by various stats
  static async getTopPlayers(daysBack: number = 30, endDate?: Date) {
    try {
      // Check cache first
      const cacheKey = endDate
        ? `${CacheKeys.topPlayers(daysBack)}:${endDate.toISOString()}`
        : CacheKeys.topPlayers(daysBack);
      const cached = await cacheService.get(cacheKey);
      if (cached) return cached;

      // Calculate the date threshold
      const dateThreshold = new Date();
      dateThreshold.setDate(dateThreshold.getDate() - daysBack);

      // Get all player stats from recent games
      const gamesCollection = db.collection("games");
      let query = gamesCollection.where("date", ">=", dateThreshold);

      // If endDate is provided, filter games up to that date
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
