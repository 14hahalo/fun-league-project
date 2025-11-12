import { TeamStats } from "../models/TeamStats";
import { PlayerStats } from "../models/PlayerStats";
import { db } from "../config/firebase";
import { AppError } from "../middleware/errorHandler";
import { FieldValue } from "firebase-admin/firestore";
import { PlayerStatsService } from "./playerStatsService";

export class TeamStatsService {
  private static collection = db.collection("teamStats");

  // Helper: Calculate team stats from player stats
  private static calculateTeamStats(playerStats: PlayerStats[]) {
    const totals = playerStats.reduce(
      (acc, stats) => ({
        twoPointAttempts: acc.twoPointAttempts + stats.twoPointAttempts,
        twoPointMade: acc.twoPointMade + stats.twoPointMade,
        threePointAttempts: acc.threePointAttempts + stats.threePointAttempts,
        threePointMade: acc.threePointMade + stats.threePointMade,
        defensiveRebounds: acc.defensiveRebounds + stats.defensiveRebounds,
        offensiveRebounds: acc.offensiveRebounds + stats.offensiveRebounds,
        assists: acc.assists + stats.assists,
      }),
      {
        twoPointAttempts: 0,
        twoPointMade: 0,
        threePointAttempts: 0,
        threePointMade: 0,
        defensiveRebounds: 0,
        offensiveRebounds: 0,
        assists: 0,
      }
    );

    const twoPointPercentage =
      totals.twoPointAttempts > 0
        ? (totals.twoPointMade / totals.twoPointAttempts) * 100
        : 0;

    const threePointPercentage =
      totals.threePointAttempts > 0
        ? (totals.threePointMade / totals.threePointAttempts) * 100
        : 0;

    const totalRebounds = totals.defensiveRebounds + totals.offensiveRebounds;
    const totalPoints = totals.twoPointMade * 2 + totals.threePointMade * 3;

    return {
      ...totals,
      twoPointPercentage,
      threePointPercentage,
      totalRebounds,
      totalPoints,
    };
  }

  // Generate or update team stats based on player stats
  static async generateTeamStats(
    gameId: string,
    teamType: "TEAM_A" | "TEAM_B"
  ): Promise<TeamStats> {
    try {
      // Get all player stats for this team in this game
      const allPlayerStats = await PlayerStatsService.getPlayerStatsByGameId(
        gameId
      );
      const teamPlayerStats = allPlayerStats.filter(
        (stats) => stats.teamType === teamType
      );

      if (teamPlayerStats.length === 0) {
        throw new AppError(
          "Bu takım için oyuncu istatistiği bulunamadı",
          404
        );
      }

      const calculatedStats = this.calculateTeamStats(teamPlayerStats);

      // Check if team stats already exist
      const existingSnapshot = await this.collection
        .where("gameId", "==", gameId)
        .where("teamType", "==", teamType)
        .limit(1)
        .get();

      let docRef;
      if (!existingSnapshot.empty) {
        // Update existing
        docRef = existingSnapshot.docs[0].ref;
        await docRef.update({
          ...calculatedStats,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        // Create new
        const newStatsData = {
          gameId,
          teamType,
          ...calculatedStats,
          createdAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        };
        docRef = await this.collection.add(newStatsData);
      }

      const doc = await docRef.get();
      const savedData = doc.data()!;

      return {
        id: doc.id,
        gameId,
        teamType,
        ...calculatedStats,
        createdAt: savedData.createdAt?.toDate() || new Date(),
        updatedAt: savedData.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım istatistikleri oluşturulurken hata oluştu", 500);
    }
  }

  // Get team stats by ID
  static async getTeamStatsById(id: string): Promise<TeamStats> {
    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new AppError("Takım istatistikleri bulunamadı", 404);
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as TeamStats;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Get team stats for a specific game
  static async getTeamStatsByGameId(gameId: string): Promise<TeamStats[]> {
    try {
      const snapshot = await this.collection
        .where("gameId", "==", gameId)
        .get();

      return snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
        } as TeamStats;
      });
    } catch (error) {
      throw new AppError("Takım istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Get specific team stats for a game
  static async getTeamStatsForGame(
    gameId: string,
    teamType: "TEAM_A" | "TEAM_B"
  ): Promise<TeamStats | null> {
    try {
      const snapshot = await this.collection
        .where("gameId", "==", gameId)
        .where("teamType", "==", teamType)
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
      } as TeamStats;
    } catch (error) {
      throw new AppError("Takım istatistikleri getirilirken hata oluştu", 500);
    }
  }

  // Delete team stats
  static async deleteTeamStats(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Takım istatistikleri bulunamadı", 404);
      }

      await docRef.delete();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım istatistikleri silinirken hata oluştu", 500);
    }
  }

  // Recalculate team stats (useful after player stats update)
  static async recalculateTeamStats(
    gameId: string,
    teamType: "TEAM_A" | "TEAM_B"
  ): Promise<TeamStats> {
    return this.generateTeamStats(gameId, teamType);
  }
}
