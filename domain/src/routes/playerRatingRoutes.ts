import { Router } from "express";
import { playerRatingController } from "../controllers/playerRatingController";
import { authMiddleware } from "../middleware/authMiddleware";

const router = Router();

// GET /api/player-ratings/game/:gameId - Maç özelinde oyuncu istatistikleri için
router.get("/game/:gameId", playerRatingController.getGameRatings);

// GET /api/player-ratings/game/:gameId/player/:playerId - Maç özelinde ve oyuncu özelinde istatistikleri için
router.get("/game/:gameId/player/:playerId", playerRatingController.getPlayerRatings);

router.post("/", authMiddleware, playerRatingController.submitRating);
router.get("/game/:gameId/voter/:voterId", authMiddleware, playerRatingController.getVoterRatings);

export default router;
