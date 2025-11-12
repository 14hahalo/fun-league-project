import { Request, Response } from "express";
import { playerRatingService } from "../services/playerRatingService";
import { CreatePlayerRatingDTO } from "../dtos/PlayerRating/CreatePlayerRatingDTO";

export const playerRatingController = {
  /**
   * POST /api/player-ratings
   * Submit or update a rating
   */
  async submitRating(req: Request, res: Response) {
    try {
      const ratingData: CreatePlayerRatingDTO = req.body;

      const rating = await playerRatingService.submitRating(ratingData);

      res.status(201).json(rating);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },

  /**
   * GET /api/player-ratings/game/:gameId
   * Get all ratings for a game with averages and MVP
   */
  async getGameRatings(req: Request, res: Response) {
    try {
      const { gameId } = req.params;

      const gameRatings = await playerRatingService.getGameRatings(gameId);

      res.status(200).json(gameRatings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },

  /**
   * GET /api/player-ratings/game/:gameId/voter/:voterId
   * Get ratings submitted by a voter for a specific game
   */
  async getVoterRatings(req: Request, res: Response) {
    try {
      const { gameId, voterId } = req.params;

      const ratings = await playerRatingService.getVoterRatingsForGame(
        gameId,
        voterId
      );

      res.status(200).json(ratings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },

  /**
   * GET /api/player-ratings/game/:gameId/player/:playerId
   * Get ratings received by a player for a specific game
   */
  async getPlayerRatings(req: Request, res: Response) {
    try {
      const { gameId, playerId } = req.params;

      const ratings = await playerRatingService.getPlayerRatingsForGame(
        gameId,
        playerId
      );

      res.status(200).json(ratings);
    } catch (error) {
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Internal server error" });
      }
    }
  },
};
