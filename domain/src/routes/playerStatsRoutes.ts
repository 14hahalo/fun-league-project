import { Router } from "express";
import { PlayerStatsController } from "../controllers/playerStatsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/top-players", PlayerStatsController.getTopPlayers);
router.post("/bulk", PlayerStatsController.getBulkPlayerStats); 
router.get("/:id", PlayerStatsController.getPlayerStatsById);
router.get("/game/:gameId", PlayerStatsController.getPlayerStatsByGameId);
router.get("/game/:gameId/player/:playerId", PlayerStatsController.getPlayerStatsForGame);
router.get("/player/:playerId", PlayerStatsController.getAllStatsForPlayer);

router.post("/", authMiddleware, requireAdmin, PlayerStatsController.createPlayerStats);
router.put("/:id", authMiddleware, requireAdmin, PlayerStatsController.updatePlayerStats);
router.delete("/:id", authMiddleware, requireAdmin, PlayerStatsController.deletePlayerStats);

export default router;
