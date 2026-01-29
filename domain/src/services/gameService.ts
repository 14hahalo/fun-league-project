import { db } from "../config/firebase";
import { Game } from "../models/Game";
import { CreateGameDto } from "../dtos/Game/CreateGameDto";
import { UpdateGameDto } from "../dtos/Game/UpdateGameDto";
import { GameStatus } from "../enums/GameStatus";
import { openAIService } from "./openAIService";
import { cacheService, CacheKeys } from "./cacheService";

const COLLECTION_NAME = "games";

export const gameService = {
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
      seasonId: gameData.seasonId,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await gameRef.set(game);
    await cacheService.invalidate(CacheKeys.allGames());
    return game;
  },

  async getAllGames(): Promise<Game[]> {
    const cacheKey = CacheKeys.allGames();
    const cached = await cacheService.get<Game[]>(cacheKey);
    if (cached) return cached;

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

    await cacheService.set(cacheKey, games, cacheService.getTTL('GAMES'));

    return games;
  },

  async getGameById(id: string): Promise<Game | null> {
    const cacheKey = CacheKeys.game(id);
    const cached = await cacheService.get<Game>(cacheKey);
    if (cached) return cached;

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

    await cacheService.set(cacheKey, game, cacheService.getTTL('GAMES'));
    return game;
  },

  async updateGame(id: string, updateData: UpdateGameDto): Promise<Game> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Maç bilgisi bulunamadı");
    }

    const updatedGame = {
      ...updateData,
      updatedAt: new Date(),
    };

    await gameRef.update(updatedGame);

    const updatedDoc = await gameRef.get();
    const data = updatedDoc.data();
    if (!data) {
      throw new Error("Güncellenen maç bilgisi getirilirken hata oluştu");
    }

    const game = {
      ...data,
      date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Game;

    await cacheService.invalidate(CacheKeys.game(id));
    await cacheService.invalidate(CacheKeys.allGames());

    return game;
  },

  async generateAnalysis(id: string): Promise<Game> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Maç bilgisi bulunamadı ");
    }


    try {
      const analysis = await openAIService.generateMatchAnalysis(id);
      await gameRef.update({
        aiAnalysis: analysis,
        updatedAt: new Date()
      });

      const updatedDoc = await gameRef.get();
      const data = updatedDoc.data();
      if (!data) {
        throw new Error("Güncellenmiş maç bilgisi getirilirken hata oluştu");
      }

      const game = {
        ...data,
        date: data.date?.toDate ? data.date.toDate() : new Date(data.date),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Game;

      await cacheService.invalidate(CacheKeys.game(id));
      await cacheService.invalidate(CacheKeys.allGames());

      return game;
    } catch (error) {
      console.error(`❌ Oyun ${id} için AI analizi oluşturulamadı:`, error);
      throw error;
    }
  },

  // Maç detayı silinirken, oluşturulmuş bağlantılı tüm data'nın silinmesi gerekiyor
  async deleteGame(id: string): Promise<void> {
    const gameRef = db.collection(COLLECTION_NAME).doc(id);
    const gameDoc = await gameRef.get();

    if (!gameDoc.exists) {
      throw new Error("Maç bilgisi bulunamadı");
    }


    // Bu maçtaki tüm oyuncu istatistiklerini sil
    const playerStatsSnapshot = await db.collection("playerStats")
      .where("gameId", "==", id)
      .get();

    const playerStatsDeletePromises = playerStatsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(playerStatsDeletePromises);

    //  Bu maçtaki tüm takım istatistiklerini sil
    const teamStatsSnapshot = await db.collection("teamStats")
      .where("gameId", "==", id)
      .get();

    const teamStatsDeletePromises = teamStatsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(teamStatsDeletePromises);

    //  Bu maçın takım bilgilerini sil
    const teamsSnapshot = await db.collection("teams")
      .where("gameId", "==", id)
      .get();

    const teamsDeletePromises = teamsSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(teamsDeletePromises);

    //  Bu maçın tüm videolarını sil
    const videosSnapshot = await db.collection("videos")
      .where("gameId", "==", id)
      .get();

    const videosDeletePromises = videosSnapshot.docs.map(doc => doc.ref.delete());
    await Promise.all(videosDeletePromises);


    //  Son olarak, oyunun kendisini sil
    await gameRef.delete();

    // Tüm ilgili önbellekleri geçersiz kıl
    await cacheService.invalidate(CacheKeys.game(id));
    await cacheService.invalidate(CacheKeys.allGames());
    await cacheService.invalidatePattern('stats:'); 
    await cacheService.invalidatePattern('videos:'); 
    await cacheService.invalidatePattern('teams:'); 

   },

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
