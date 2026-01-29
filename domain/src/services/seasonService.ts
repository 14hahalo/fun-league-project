import { db } from "../config/firebase";
import { Season } from "../models/Season";
import { CreateSeasonDto } from "../dtos/Season/CreateSeasonDto";
import { UpdateSeasonDto } from "../dtos/Season/UpdateSeasonDto";
import { cacheService, CacheKeys } from "./cacheService";

const COLLECTION_NAME = "seasons";

export const seasonService = {

  async createSeason(seasonData: CreateSeasonDto): Promise<Season> {
    const seasonRef = db.collection(COLLECTION_NAME).doc();

    if (seasonData.isActive) {
      await db.runTransaction(async (transaction) => {
        const activeSeasonsSnapshot = await transaction.get(
          db.collection(COLLECTION_NAME).where("isActive", "==", true)
        );

        activeSeasonsSnapshot.docs.forEach((doc) => {
          transaction.update(doc.ref, { isActive: false, updatedAt: new Date() });
        });

        const season: Season = {
          id: seasonRef.id,
          name: seasonData.name,
          beginDate: seasonData.beginDate,
          finishDate: seasonData.finishDate || null,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        transaction.set(seasonRef, season);
      });
    } else {
      const season: Season = {
        id: seasonRef.id,
        name: seasonData.name,
        beginDate: seasonData.beginDate,
        finishDate: seasonData.finishDate || null,
        isActive: seasonData.isActive || false,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await seasonRef.set(season);
    }

    await cacheService.invalidate(CacheKeys.allSeasons());
    await cacheService.invalidate(CacheKeys.activeSeason());

    const doc = await seasonRef.get();
    const data = doc.data();
    return {
      ...data,
      beginDate: data?.beginDate?.toDate ? data.beginDate.toDate() : new Date(data?.beginDate),
      finishDate: data?.finishDate?.toDate ? data.finishDate.toDate() : (data?.finishDate ? new Date(data.finishDate) : null),
      createdAt: data?.createdAt?.toDate ? data.createdAt.toDate() : new Date(data?.createdAt),
      updatedAt: data?.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data?.updatedAt),
    } as Season;
  },

  async getAllSeasons(): Promise<Season[]> {
    const cacheKey = CacheKeys.allSeasons();
    const cached = await cacheService.get<Season[]>(cacheKey);
    if (cached) return cached;

    const snapshot = await db.collection(COLLECTION_NAME).orderBy("beginDate", "desc").get();
    const seasons = snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id, 
        beginDate: data.beginDate?.toDate ? data.beginDate.toDate() : new Date(data.beginDate),
        finishDate: data.finishDate?.toDate ? data.finishDate.toDate() : (data.finishDate ? new Date(data.finishDate) : null),
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Season;
    });

    await cacheService.set(cacheKey, seasons, cacheService.getTTL('SEASONS'));

    return seasons;
  },


  async getActiveSeason(): Promise<Season | null> {
    const cacheKey = CacheKeys.activeSeason();
    const cached = await cacheService.get<Season | null>(cacheKey);
    if (cached !== null) return cached;

    const snapshot = await db.collection(COLLECTION_NAME).where("isActive", "==", true).limit(1).get();

    if (snapshot.empty) {
      await cacheService.set(cacheKey, null, cacheService.getTTL('SEASONS'));
      return null;
    }

    const doc = snapshot.docs[0];
    const data = doc.data();
    const season = {
      ...data,
      id: doc.id, 
      beginDate: data.beginDate?.toDate ? data.beginDate.toDate() : new Date(data.beginDate),
      finishDate: data.finishDate?.toDate ? data.finishDate.toDate() : (data.finishDate ? new Date(data.finishDate) : null),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Season;

    await cacheService.set(cacheKey, season, cacheService.getTTL('SEASONS'));

    return season;
  },


  async getSeasonById(id: string): Promise<Season | null> {
    const cacheKey = CacheKeys.season(id);
    const cached = await cacheService.get<Season>(cacheKey);
    if (cached) return cached;

    const doc = await db.collection(COLLECTION_NAME).doc(id).get();

    if (!doc.exists) {
      return null;
    }

    const data = doc.data();
    if (!data) return null;

    const season = {
      ...data,
      id: doc.id, 
      beginDate: data.beginDate?.toDate ? data.beginDate.toDate() : new Date(data.beginDate),
      finishDate: data.finishDate?.toDate ? data.finishDate.toDate() : (data.finishDate ? new Date(data.finishDate) : null),
      createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
      updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
    } as Season;

    await cacheService.set(cacheKey, season, cacheService.getTTL('SEASONS'));
    return season;
  },

  async updateSeason(id: string, updateData: UpdateSeasonDto): Promise<Season> {
    if (updateData.isActive === true) {
      await db.runTransaction(async (transaction) => {
        const activeSeasonsSnapshot = await transaction.get(
          db.collection(COLLECTION_NAME).where("isActive", "==", true)
        );

        activeSeasonsSnapshot.docs.forEach((doc) => {
          if (doc.id !== id) {
            transaction.update(doc.ref, { isActive: false, updatedAt: new Date() });
          }
        });

        const seasonRef = db.collection(COLLECTION_NAME).doc(id);
        transaction.update(seasonRef, {
          ...updateData,
          updatedAt: new Date(),
        });
      });
    } else {
      await db.collection(COLLECTION_NAME).doc(id).update({
        ...updateData,
        updatedAt: new Date(),
      });
    }

    await cacheService.invalidate(CacheKeys.season(id));
    await cacheService.invalidate(CacheKeys.allSeasons());
    await cacheService.invalidate(CacheKeys.activeSeason());

    const season = await this.getSeasonById(id);
    if (!season) throw new Error("Sezon bulunamadı");

    return season;
  },

  async deleteSeason(id: string): Promise<void> {
    const season = await this.getSeasonById(id);
    if (!season) {
      throw new Error("Sezon bulunamadı");
    }

    if (season.isActive) {
      throw new Error("Aktif sezonlar silinemez. Öncelikle sezonu pasife alın");
    }

    const batchSize = 500;

    const gamesSnapshot = await db.collection("games").where("seasonId", "==", id).get();
    if (!gamesSnapshot.empty) {
      for (let i = 0; i < gamesSnapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = gamesSnapshot.docs.slice(i, i + batchSize);
        batchDocs.forEach((doc) => {
          batch.update(doc.ref, { seasonId: null });
        });
        await batch.commit();
      }
    }

    const playerStatsSnapshot = await db.collection("playerStats").where("seasonId", "==", id).get();
    if (!playerStatsSnapshot.empty) {
      for (let i = 0; i < playerStatsSnapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = playerStatsSnapshot.docs.slice(i, i + batchSize);
        batchDocs.forEach((doc) => {
          batch.update(doc.ref, { seasonId: null });
        });
        await batch.commit();
      }
    }

    const teamStatsSnapshot = await db.collection("teamStats").where("seasonId", "==", id).get();
    if (!teamStatsSnapshot.empty) {
      for (let i = 0; i < teamStatsSnapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = teamStatsSnapshot.docs.slice(i, i + batchSize);
        batchDocs.forEach((doc) => {
          batch.update(doc.ref, { seasonId: null });
        });
        await batch.commit();
      }
    }

    const playerRatingsSnapshot = await db.collection("playerRatings").where("seasonId", "==", id).get();
    if (!playerRatingsSnapshot.empty) {
      for (let i = 0; i < playerRatingsSnapshot.docs.length; i += batchSize) {
        const batch = db.batch();
        const batchDocs = playerRatingsSnapshot.docs.slice(i, i + batchSize);
        batchDocs.forEach((doc) => {
          batch.update(doc.ref, { seasonId: null });
        });
        await batch.commit();
      }
    }

    await db.collection(COLLECTION_NAME).doc(id).delete();

    await cacheService.invalidate(CacheKeys.season(id));
    await cacheService.invalidate(CacheKeys.allSeasons());
    await cacheService.invalidate(CacheKeys.activeSeason());
  },
};
