import { db } from "../config/firebase";
import { Game } from "../models/Game";
import { CreateGameDto } from "../dtos/Game/CreateGameDto";
import { UpdateGameDto } from "../dtos/Game/UpdateGameDto";
import { GameStatus } from "../enums/GameStatus";
import { openAIService } from "./openAIService";
import { cacheService, CacheKeys } from "./cacheService";

const COLLECTION_NAME = "games";

export const gameService = {
  /**
   * Create a new game
   */
  async createGame(gameData: CreateGameDto): Promise<Game> {
    const gameRef = db.collection(COLLECTION_NAME).doc();

    const game: Game = {
      id: gameRef.id,
      gameNumber: gameData.gameNumber,
      date: gameData.date,
      status: gameData.status || GameStatus.SCHEDULED,
      teamAScore: 0,
      teamBScore: 0,
      teamSize: gameData.teamSize,
      notes: gameData.notes,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await gameRef.set(game);

    // Invalidate games cache
    await cacheService.invalidate(CacheKeys.allGames());

    return game;
  },

  /**
   * Get all games
   */
  async getAllGames(): Promise<Game[]> {
    // Check cache first
    const cacheKey = CacheKeys.allGames();
    const cached = await cacheService.get<Game[]>(cacheKey);
    if (cached) return cached;

    // Fetch from Firebase
    const snapshot = await db.collection(COLLECTION_NAME).orderBy("date", "desc").get();
    const games = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Game;
    });

    // Cache the result
    await cacheService.set(cacheKey, games, cacheService.getTTL('GAMES'));

    return games;
  },

  /**
   * Get game by ID
   */
  async getGameById(id: string): Promise<Game | null> {
    // Check cache first
    const cacheKey = CacheKeys.game(id);
    const cached = await cacheService.get<Game>(cacheKey);
    if (cached) return cached;

    // Fetch from Firebase
    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    const game = {
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Game;

    // Cache the result
    await cacheService.set(cacheKey, game, cacheService.getTTL('GAMES'));

    return game;
  },

  /**
   * Update game
   */
  async updateGame(id: string, updateData: UpdateGameDto): Promise<Game> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Game not found");
    }

    const updatedGame = {
      ...updateData,
      updatedAt: new Date(),
    };

    await gameRef.update(updatedGame);

    const updatedDoc = await gameRef.get();
    const data = updatedDoc.data();
    if (!data) {
      throw new Error("Failed to retrieve updated game");
    }

    const game = {
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Game;

    // Invalidate caches
    await cacheService.invalidate(CacheKeys.game(id));
    await cacheService.invalidate(CacheKeys.allGames());

    return game;
  },

  /**
   * Manually generate AI analysis for a game (useful for existing games or retry)
   */
  async generateAnalysis(id: string): Promise<Game> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Game not found");
    }

    console.log(`🤖 Manually generating AI analysis for game ${id}...`);

    try {
      const analysis = await openAIService.generateMatchAnalysis(id);
      await gameRef.update({
        aiAnalysis: analysis,
        updatedAt: new Date()
      });
      console.log(`✅ AI analysis generated and saved for game ${id}`);

      const updatedDoc = await gameRef.get();
      const data = updatedDoc.data();
      if (!data) {
        throw new Error("Failed to retrieve updated game");
      }

      const game = {
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Game;

      // Invalidate caches after AI analysis
      await cacheService.invalidate(CacheKeys.game(id));
      await cacheService.invalidate(CacheKeys.allGames());

      return game;
    } catch (error) {
      console.error(`❌ Failed to generate AI analysis for game ${id}:`, error);
      throw error;
    }
  },

  /**
   * Delete game with cascade delete (removes related playerStats, teamStats, teams, videos, and game)
   */
  async deleteGame(id: string): Promise<void> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Game not found");
    }

    console.log(`🗑️ Starting cascade delete for game ${id}...`);

    // CASCADE DELETE: Delete all related data

    // 1. Delete all player stats for this game
    const playerStatsSnapshot = await db.collection("playerStats")
      .where("gameId", "==", id)
      .get();

    console.log(`   Deleting ${playerStatsSnapshot.size} player stats...`);
    const playerStatsDeletePromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(playerStatsDeletePromises);

    // 2. Delete all team stats for this game
    const teamStatsSnapshot = await db.collection("teamStats")
      .where("gameId", "==", id)
      .get();

    console.log(`   Deleting ${teamStatsSnapshot.size} team stats...`);
    const teamStatsDeletePromises = teamStatsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(teamStatsDeletePromises);

    // 3. Delete all teams for this game
    const teamsSnapshot = await db.collection("teams")
      .where("gameId", "==", id)
      .get();

    console.log(`   Deleting ${teamsSnapshot.size} teams...`);
    const teamsDeletePromises = teamsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(teamsDeletePromises);

    // 4. Delete all videos for this game
    const videosSnapshot = await db.collection("videos")
      .where("gameId", "==", id)
      .get();

    console.log(`   Deleting ${videosSnapshot.size} videos...`);
    const videosDeletePromises = videosSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(videosDeletePromises);

    // Note: Player ratings are NOT deleted when a game is deleted
    // They are preserved as historical data for the players

    // 5. Finally, delete the game itself
    await gameRef.delete();

    // Invalidate all related caches
    await cacheService.invalidate(CacheKeys.game(id));
    await cacheService.invalidate(CacheKeys.allGames());
    await cacheService.invalidatePattern('stats:'); // All stats related to this game
    await cacheService.invalidatePattern('videos:'); // All videos related to this game
    await cacheService.invalidatePattern('teams:'); // All teams related to this game

    console.log(`✅ Game ${id} and all related data deleted successfully`);
    console.log(`   Summary: ${playerStatsSnapshot.size} player stats, ${teamStatsSnapshot.size} team stats, ${teamsSnapshot.size} teams, ${videosSnapshot.size} videos`);
  },

  /**
   * Get games by status
   */
  async getGamesByStatus(status: GameStatus): Promise<Game[]> {
    const snapshot = await db
      .collection(COLLECTION_NAME)
      .where("status", "==", status)
      .orderBy("date", "desc")
      .get();

    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Game;
    });
  },
};
