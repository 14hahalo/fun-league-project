import { Router } from "express";
import { TeamController } from "../controllers/teamController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/:id", TeamController.getTeamById);
router.get("/game/:gameId", TeamController.getTeamsByGameId);
router.get("/game/:gameId/team/:teamType", TeamController.getTeamForGame);

router.post("/", authMiddleware, requireAdmin, TeamController.createTeam);
router.put("/:id", authMiddleware, requireAdmin, TeamController.updateTeam);
router.delete("/:id", authMiddleware, requireAdmin, TeamController.deleteTeam);
router.post("/:teamId/players", authMiddleware, requireAdmin, TeamController.addPlayerToTeam);
router.delete("/:teamId/players/:playerId", authMiddleware, requireAdmin, TeamController.removePlayerFromTeam);

// AI takım oluşturması için
router.post("/build-balanced", authMiddleware, requireAdmin, TeamController.buildBalancedTeams);

export default router;
