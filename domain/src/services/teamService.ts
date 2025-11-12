import { Team } from "../models/Team";
import { CreateTeamDto } from "../dtos/Team/CreateTeamDTO";
import { UpdateTeamDto } from "../dtos/Team/UpdateTeamDTO";
import { db } from "../config/firebase";
import { AppError } from "../middleware/errorHandler";
import { FieldValue } from "firebase-admin/firestore";

export class TeamService {
  private static collection = db.collection("teams");

  // Create team
  static async createTeam(data: CreateTeamDto): Promise<Team> {
    try {
      // Check if team already exists for this game and team type
      const existingSnapshot = await this.collection
        .where("gameId", "==", data.gameId)
        .where("teamType", "==", data.teamType)
        .limit(1)
        .get();

      if (!existingSnapshot.empty) {
        throw new AppError(
          "Bu maç için bu takım türü zaten mevcut",
          400
        );
      }

      const newTeamData = {
        ...data,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      const docRef = await this.collection.add(newTeamData);
      const doc = await docRef.get();
      const savedData = doc.data()!;

      return {
        id: doc.id,
        ...data,
        createdAt: savedData.createdAt?.toDate() || new Date(),
        updatedAt: savedData.updatedAt?.toDate() || new Date(),
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım oluşturulurken hata oluştu", 500);
    }
  }

  // Get team by ID
  static async getTeamById(id: string): Promise<Team> {
    try {
      const doc = await this.collection.doc(id).get();

      if (!doc.exists) {
        throw new AppError("Takım bulunamadı", 404);
      }

      const data = doc.data()!;
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
      } as Team;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım getirilirken hata oluştu", 500);
    }
  }

  // Get teams by game ID
  static async getTeamsByGameId(gameId: string): Promise<Team[]> {
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
        } as Team;
      });
    } catch (error) {
      throw new AppError("Takımlar getirilirken hata oluştu", 500);
    }
  }

  // Get specific team for a game
  static async getTeamForGame(
    gameId: string,
    teamType: "TEAM_A" | "TEAM_B"
  ): Promise<Team | null> {
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
      } as Team;
    } catch (error) {
      throw new AppError("Takım getirilirken hata oluştu", 500);
    }
  }

  // Update team
  static async updateTeam(id: string, data: UpdateTeamDto): Promise<Team> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Takım bulunamadı", 404);
      }

      const updateData = {
        ...data,
        updatedAt: FieldValue.serverTimestamp(),
      };

      await docRef.update(updateData);

      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Team;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım güncellenirken hata oluştu", 500);
    }
  }

  // Delete team
  static async deleteTeam(id: string): Promise<void> {
    try {
      const docRef = this.collection.doc(id);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Takım bulunamadı", 404);
      }

      await docRef.delete();
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Takım silinirken hata oluştu", 500);
    }
  }

  // Add player to team
  static async addPlayerToTeam(teamId: string, playerId: string): Promise<Team> {
    try {
      const docRef = this.collection.doc(teamId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Takım bulunamadı", 404);
      }

      const currentData = doc.data()!;
      const playerIds = currentData.playerIds || [];

      if (playerIds.includes(playerId)) {
        throw new AppError("Oyuncu zaten takımda", 400);
      }

      await docRef.update({
        playerIds: [...playerIds, playerId],
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Team;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu eklenirken hata oluştu", 500);
    }
  }

  // Remove player from team
  static async removePlayerFromTeam(
    teamId: string,
    playerId: string
  ): Promise<Team> {
    try {
      const docRef = this.collection.doc(teamId);
      const doc = await docRef.get();

      if (!doc.exists) {
        throw new AppError("Takım bulunamadı", 404);
      }

      const currentData = doc.data()!;
      const playerIds = currentData.playerIds || [];

      const updatedPlayerIds = playerIds.filter(
        (id: string) => id !== playerId
      );

      await docRef.update({
        playerIds: updatedPlayerIds,
        updatedAt: FieldValue.serverTimestamp(),
      });

      const updatedDoc = await docRef.get();
      const updatedData = updatedDoc.data()!;

      return {
        id: updatedDoc.id,
        ...updatedData,
        createdAt: updatedData.createdAt?.toDate() || new Date(),
        updatedAt: updatedData.updatedAt?.toDate() || new Date(),
      } as Team;
    } catch (error) {
      if (error instanceof AppError) throw error;
      throw new AppError("Oyuncu çıkarılırken hata oluştu", 500);
    }
  }
}
