import { Router } from "express";
import { PlayerController } from "../controllers/playerController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Ortak endpointler
router.get("/", PlayerController.getAllPlayers);
router.get("/active", PlayerController.getActivePlayers);
router.get("/:id", PlayerController.getPlayerById);

router.put("/:id", authMiddleware, PlayerController.updatePlayer);

// Admin özel
router.post("/", authMiddleware, requireAdmin, PlayerController.createPlayer);
router.post("/:id/set-password", authMiddleware, requireAdmin, PlayerController.setPlayerPassword);
router.delete("/:id/permanent", authMiddleware, requireAdmin, PlayerController.permanentDeletePlayer);
router.delete("/:id", authMiddleware, requireAdmin, PlayerController.deletePlayer);

export default router;
