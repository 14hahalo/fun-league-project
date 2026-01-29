import { Router } from "express";
import { TeamStatsController } from "../controllers/teamStatsController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/:id", TeamStatsController.getTeamStatsById);
router.get("/game/:gameId", TeamStatsController.getTeamStatsByGameId);
router.get("/game/:gameId/team/:teamType", TeamStatsController.getTeamStatsForGame);

router.post("/generate", authMiddleware, requireAdmin, TeamStatsController.generateTeamStats);
router.put("/recalculate/:gameId/:teamType", authMiddleware, requireAdmin, TeamStatsController.recalculateTeamStats);
router.delete("/:id", authMiddleware, requireAdmin, TeamStatsController.deleteTeamStats);

export default router;
