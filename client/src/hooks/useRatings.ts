import { useState, useEffect, useCallback } from "react";
import { ratingApi } from "../api/ratingApi";
import type {
  CreatePlayerRatingDTO,
  GameRatings,
  PlayerRating,
} from "../types/rating.types";

export const useRatings = (gameId?: string) => {
  const [gameRatings, setGameRatings] = useState<GameRatings | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchGameRatings = useCallback(async (gId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await ratingApi.getGameRatings(gId);
      setGameRatings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch ratings");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitRating = async (
    data: CreatePlayerRatingDTO
  ): Promise<PlayerRating | null> => {
    setLoading(true);
    setError(null);
    try {
      const rating = await ratingApi.submitRating(data);
      if (gameId) {
        await fetchGameRatings(gameId);
      }
      return rating;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to submit rating";
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getVoterRatings = async (
    gId: string,
    voterId: string
  ): Promise<PlayerRating[]> => {
    setLoading(true);
    setError(null);
    try {
      const ratings = await ratingApi.getVoterRatings(gId, voterId);
      return ratings;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to fetch voter ratings"
      );
      return [];
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (gameId) {
      fetchGameRatings(gameId);
    }
  }, [gameId]);

  return {
    gameRatings,
    loading,
    error,
    fetchGameRatings,
    submitRating,
    getVoterRatings,
  };
};
