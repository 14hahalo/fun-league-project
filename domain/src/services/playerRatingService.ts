import { db } from "../config/firebase";
import { PlayerRating } from "../models/PlayerRating";
import { CreatePlayerRatingDTO } from "../dtos/PlayerRating/CreatePlayerRatingDTO";
import { PlayerRatingAverageDTO, GameRatingsDTO } from "../dtos/PlayerRating/PlayerRatingAverageDTO";
import { PlayerStats } from "../models/PlayerStats";
import { Player } from "../models/Player";

export const playerRatingService = {
  /**
   * Submit a ranking for a player
   */
  async submitRating(data: CreatePlayerRatingDTO): Promise<PlayerRating> {
    // Validate rank is positive
    if (data.rank < 1) {
      throw new Error("Rank must be at least 1");
    }

    // Check if voter is trying to rate themselves
    if (data.voterId === data.ratedPlayerId) {
      throw new Error("Players cannot rate themselves");
    }

    // Check if voter played in this game
    const voterStatsSnapshot = await db
      .collection("playerStats")
      .where("gameId", "==", data.gameId)
      .where("playerId", "==", data.voterId)
      .get();

    if (voterStatsSnapshot.empty) {
      throw new Error("Only players who played in this match can vote");
    }

    // Check if rated player played in this game
    const ratedPlayerStatsSnapshot = await db
      .collection("playerStats")
      .where("gameId", "==", data.gameId)
      .where("playerId", "==", data.ratedPlayerId)
      .get();

    if (ratedPlayerStatsSnapshot.empty) {
      throw new Error("Cannot rate a player who did not play in this match");
    }

    // Check if voter already rated this player in this game
    const existingRatingSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", data.gameId)
      .where("voterId", "==", data.voterId)
      .where("ratedPlayerId", "==", data.ratedPlayerId)
      .get();

    if (!existingRatingSnapshot.empty) {
      // Update existing ranking
      const existingRatingDoc = existingRatingSnapshot.docs[0];
      await existingRatingDoc.ref.update({
        rank: data.rank,
      });

      const updatedDoc = await existingRatingDoc.ref.get();
      return { id: updatedDoc.id, ...updatedDoc.data() } as PlayerRating;
    }

    // Create new ranking
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

  /**
   * Get all ratings for a specific game with averages and MVP
   */
  async getGameRatings(gameId: string): Promise<GameRatingsDTO> {

    // Get all ratings for this game
    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .get();


    // Get all players who played in this game
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

    // Get player details
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

    // Calculate average rankings for each player (lower is better)
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

    // Count unique voters
    const uniqueVoters = new Set(
      ratingsSnapshot.docs.map((doc) => (doc.data() as PlayerRating).voterId)
    );

    // Build ranking averages
    const ratings: PlayerRatingAverageDTO[] = [];
    playerIds.forEach((playerId) => {
      const player = playersMap.get(playerId);
      if (!player) {
        return;
      }

      const ratingData = playerRatingsMap.get(playerId);
      const averageRank = ratingData
        ? ratingData.total / ratingData.count
        : 999; // High number for players with no votes (they appear last)
      const totalVotes = ratingData ? ratingData.count : 0;

      ratings.push({
        playerId,
        playerName: player.nickname || "Unknown",
        averageRating: Math.round(averageRank * 100) / 100, // This is now average rank
        totalVotes,
        isMVP: false,
      });
    });

    // Sort by average rank (ascending - lower rank is better)
    ratings.sort((a, b) => a.averageRating - b.averageRating);

    // Determine MVP (lowest average rank with at least 1 vote)
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

  /**
   * Get a player's ratings for a specific game (what others rated them)
   */
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

  /**
   * Get ratings submitted by a voter for a specific game
   */
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

  /**
   * Delete all ratings for a game (used when game is deleted)
   */
  async deleteGameRatings(gameId: string): Promise<void> {
    const ratingsSnapshot = await db
      .collection("playerRatings")
      .where("gameId", "==", gameId)
      .get();

    const deletePromises = ratingsSnapshot.docs.map((doc) => doc.ref.delete());
    await Promise.all(deletePromises);

  },
};
