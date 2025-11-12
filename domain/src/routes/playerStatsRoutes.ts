import { Router } from "express";
import { PlayerStatsController } from "../controllers/playerStatsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Public routes - anyone can view stats
router.get("/top-players", PlayerStatsController.getTopPlayers);
router.post("/bulk", PlayerStatsController.getBulkPlayerStats); // Bulk endpoint for multiple players
router.get("/:id", PlayerStatsController.getPlayerStatsById);
router.get("/game/:gameId", PlayerStatsController.getPlayerStatsByGameId);
router.get("/game/:gameId/player/:playerId", PlayerStatsController.getPlayerStatsForGame);
router.get("/player/:playerId", PlayerStatsController.getAllStatsForPlayer);

// Admin only routes - manage stats
router.post("/", authMiddleware, requireAdmin, PlayerStatsController.createPlayerStats);
router.put("/:id", authMiddleware, requireAdmin, PlayerStatsController.updatePlayerStats);
router.delete("/:id", authMiddleware, requireAdmin, PlayerStatsController.deletePlayerStats);

export default router;
