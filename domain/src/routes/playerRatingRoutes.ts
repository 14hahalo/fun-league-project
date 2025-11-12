import { Router } from "express";
import { playerRatingController } from "../controllers/playerRatingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// Public routes (no authentication required for viewing ratings)
// GET /api/player-ratings/game/:gameId - Get all ratings for a game
router.get("/game/:gameId", playerRatingController.getGameRatings);

// GET /api/player-ratings/game/:gameId/player/:playerId - Get player's received ratings for a game
router.get("/game/:gameId/player/:playerId", playerRatingController.getPlayerRatings);

// Protected routes (authentication required)
// POST /api/player-ratings - Submit or update a rating
router.post("/", authMiddleware, playerRatingController.submitRating);

// GET /api/player-ratings/game/:gameId/voter/:voterId - Get voter's ratings for a game
router.get("/game/:gameId/voter/:voterId", authMiddleware, playerRatingController.getVoterRatings);

export default router;
