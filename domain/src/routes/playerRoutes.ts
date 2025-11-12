import { Router } from "express";
import { PlayerController } from "../controllers/playerController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Public routes - anyone can view players
router.get("/", PlayerController.getAllPlayers);
router.get("/active", PlayerController.getActivePlayers);
router.get("/:id", PlayerController.getPlayerById);

// Admin only - create new player through admin panel
router.post("/", authMiddleware, requireAdmin, PlayerController.createPlayer);

// Authenticated users can update - controller will check if user is admin or updating self
router.put("/:id", authMiddleware, PlayerController.updatePlayer);

// Admin only - set/reset player password
router.post("/:id/set-password", authMiddleware, requireAdmin, PlayerController.setPlayerPassword);

// Admin only - delete operations (permanent route must come BEFORE the general :id route)
router.delete("/:id/permanent", authMiddleware, requireAdmin, PlayerController.permanentDeletePlayer);
router.delete("/:id", authMiddleware, requireAdmin, PlayerController.deletePlayer);

export default router;
