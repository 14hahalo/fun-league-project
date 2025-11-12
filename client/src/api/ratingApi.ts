import axiosInstance from "./axiosConfig";
import type {
  CreatePlayerRatingDTO,
  GameRatings,
  PlayerRating,
} from "../types/rating.types";

const BASE_URL = "/player-ratings";

export const ratingApi = {
  /**
   * Submit or update a rating
   */
  async submitRating(data: CreatePlayerRatingDTO): Promise<PlayerRating> {
    const response = await axiosInstance.post<PlayerRating>(BASE_URL, data);
    return response.data;
  },

  /**
   * Get all ratings for a game with averages and MVP
   */
  async getGameRatings(gameId: string): Promise<GameRatings> {
    const response = await axiosInstance.get<GameRatings>(
      `${BASE_URL}/game/${gameId}`
    );
    return response.data;
  },

  /**
   * Get ratings submitted by a voter for a specific game
   */
  async getVoterRatings(
    gameId: string,
    voterId: string
  ): Promise<PlayerRating[]> {
    const response = await axiosInstance.get<PlayerRating[]>(
      `${BASE_URL}/game/${gameId}/voter/${voterId}`
    );
    return response.data;
  },

  /**
   * Get ratings received by a player for a specific game
   */
  async getPlayerRatings(
    gameId: string,
    playerId: string
  ): Promise<PlayerRating[]> {
    const response = await axiosInstance.get<PlayerRating[]>(
      `${BASE_URL}/game/${gameId}/player/${playerId}`
    );
    return response.data;
  },
};
