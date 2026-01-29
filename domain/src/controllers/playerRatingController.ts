import { Request, Response } from "express";
import { playerRatingService } from "../services/playerRatingService";
import { CreatePlayerRatingDTO } from "../dtos/PlayerRating/CreatePlayerRatingDTO";

export const playerRatingController = {

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
   * Bir oyun için ortalamalar ve MVP ile birlikte tüm değerlendirmeleri getir
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
   * Belirli bir oyun için bir oy veren tarafından gönderilen değerlendirmeleri getir
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
   * Belirli bir oyun için bir oyuncunun aldığı değerlendirmeleri getir
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
