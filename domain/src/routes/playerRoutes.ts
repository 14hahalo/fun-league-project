import { Router } from "express";
import { PlayerController } from "../controllers/playerController";
import { PlayerAnalysisController } from "../controllers/playerAnalysisController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Ortak endpointler
router.get("/", PlayerController.getAllPlayers);
router.get("/active", PlayerController.getActivePlayers);
router.get("/:id/analysis/history", PlayerAnalysisController.getAnalysisHistory);
router.get("/:id/analysis", PlayerAnalysisController.getActiveAnalysis);
router.get("/:id", PlayerController.getPlayerById);

router.put("/:id", authMiddleware, PlayerController.updatePlayer);

// Admin özel
router.post("/", authMiddleware, requireAdmin, PlayerController.createPlayer);
router.post("/:id/set-password", authMiddleware, requireAdmin, PlayerController.setPlayerPassword);
router.delete("/:id/permanent", authMiddleware, requireAdmin, PlayerController.permanentDeletePlayer);
router.delete("/:id", authMiddleware, requireAdmin, PlayerController.deletePlayer);

export default router;
