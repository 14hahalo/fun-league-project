import { db } from "../config/firebase";
import { PlayerRating } from "../models/PlayerRating";
import { CreatePlayerRatingDTO } from "../dtos/PlayerRating/CreatePlayerRatingDTO";
import { PlayerRatingAverageDTO, GameRatingsDTO } from "../dtos/PlayerRating/PlayerRatingAverageDTO";
import { PlayerStats } from "../models/PlayerStats";
import { Player } from "../models/Player";

export const playerRatingService = {

  async submitRating(data: CreatePlayerRatingDTO): Promise<PlayerRating> {
    if (data.rank < 1) {
      throw new Error("Pozitif seçim şart");
    }

    if (data.voterId === data.ratedPlayerId) {
      throw new Error("Kendine oy atma ula");
    }

    const ratedPlayerStatsSnapshot = await db
      .collection("playerStats")
      .where("gameId", "==", data.gameId)
      .where("playerId", "==", data.ratedPlayerId)
      .get();

    if (ratedPlayerStatsSnapshot.empty) {
      throw new Error("Maçta oynamamış oyuncuya oy verilemez");
    }

    const existingRatingSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", data.gameId)
      .where("voterId", "==", data.voterId)
      .where("ratedPlayerId", "==", data.ratedPlayerId)
      .get();

    if (!existingRatingSnapshot.empty) {
      const existingRatingDoc = existingRatingSnapshot.docs[0];
      await existingRatingDoc.ref.update({
        rank: data.rank,
      });

      const updatedDoc = await existingRatingDoc.ref.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as PlayerRating;
    }

    const ratingRef = await db.collection("playerRatings").add({
      gameId: data.gameId,
      voterId: data.voterId,
      ratedPlayerId: data.ratedPlayerId,
      rank: data.rank,
      createdAt: new Date(),
    });

    const ratingDoc = await ratingRef.get();
    return { id: ratingDoc.id, ...ratingDoc.data() } as PlayerRating;
  },


  async getGameRatings(gameId: string): Promise<GameRatingsDTO> {

    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .get();

    const playerStatsSnapshot = await db
      .collection("playerStats")
      .where("gameId", "==", gameId)
      .get();

    const playerIds = playerStatsSnapshot.docs.map(
      (doc) => (doc.data() as PlayerStats).playerId
    );

    if (playerIds.length === 0) {
      return {
        gameId,
        ratings: [],
        mvp: null,
        totalVoters: 0,
        totalPlayers: 0,
      };
    }

    const playersMap = new Map<string, Player>();
    for (const playerId of playerIds) {
      const playerDoc = await db.collection("players").doc(playerId).get();
      if (playerDoc.exists) {
        playersMap.set(playerId, {
          id: playerDoc.id,
          ...playerDoc.data(),
        } as Player);
      }
    }

    const playerRatingsMap = new Map<string, { total: number; count: number }>();

    ratingsSnapshot.docs.forEach((doc) => {
      const rating = doc.data() as PlayerRating;
      const current = playerRatingsMap.get(rating.ratedPlayerId) || {
        total: 0,
        count: 0,
      };
      playerRatingsMap.set(rating.ratedPlayerId, {
        total: current.total + rating.rank,
        count: current.count + 1,
      });
    });

    const uniqueVoters = new Set(
      ratingsSnapshot.docs.map((doc) => (doc.data() as PlayerRating).voterId)
    );

    const ratings: PlayerRatingAverageDTO[] = [];
    playerIds.forEach((playerId) => {
      const player = playersMap.get(playerId);
      if (!player) {
        return;
      }

      const ratingData = playerRatingsMap.get(playerId);
      const averageRank = ratingData
        ? ratingData.total / ratingData.count
        : 999; 
      const totalVotes = ratingData ? ratingData.count : 0;

      ratings.push({
        playerId,
        playerName: player.nickname || "Bilinmiyor",
        averageRating: Math.round(averageRank * 100) / 100, 
        totalVotes,
        isMVP: false,
      });
    });

    ratings.sort((a, b) => a.averageRating - b.averageRating);

    let mvp: PlayerRatingAverageDTO | null = null;
    if (ratings.length > 0 && ratings[0].totalVotes > 0) {
      ratings[0].isMVP = true;
      mvp = ratings[0];
    } 

    return {
      gameId,
      ratings,
      mvp,
      totalVoters: uniqueVoters.size,
      totalPlayers: playerIds.length,
    };
  },

  async getPlayerRatingsForGame(
    gameId: string,
    playerId: string
  ): Promise<PlayerRating[]> {
    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .where("ratedPlayerId", "==", playerId)
      .get();

    return ratingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PlayerRating[];
  },

  async getVoterRatingsForGame(
    gameId: string,
    voterId: string
  ): Promise<PlayerRating[]> {
    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .where("voterId", "==", voterId)
      .get();

    return ratingsSnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as PlayerRating[];
  },

  async deleteGameRatings(gameId: string): Promise<void> {
    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .get();

    const deletePromises = ratingsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);
  },
};
