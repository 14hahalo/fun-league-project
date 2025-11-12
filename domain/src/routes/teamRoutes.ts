import { Router } from "express";
import { TeamController } from "../controllers/teamController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Public routes - anyone can view teams
router.get("/:id", TeamController.getTeamById);
router.get("/game/:gameId", TeamController.getTeamsByGameId);
router.get("/game/:gameId/team/:teamType", TeamController.getTeamForGame);

// Admin only routes - manage teams
router.post("/", authMiddleware, requireAdmin, TeamController.createTeam);
router.put("/:id", authMiddleware, requireAdmin, TeamController.updateTeam);
router.delete("/:id", authMiddleware, requireAdmin, TeamController.deleteTeam);
router.post("/:teamId/players", authMiddleware, requireAdmin, TeamController.addPlayerToTeam);
router.delete("/:teamId/players/:playerId", authMiddleware, requireAdmin, TeamController.removePlayerFromTeam);

// AI team balancing
router.post("/build-balanced", authMiddleware, requireAdmin, TeamController.buildBalancedTeams);

export default router;
