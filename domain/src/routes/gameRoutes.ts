import { Router } from "express";
import { gameController } from "../controllers/gameController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Ortak endpointler
router.get("/", gameController.getAllGames);
router.get("/:id", gameController.getGameById);

// Admin özel endpointler
router.post("/", authMiddleware, requireAdmin, gameController.createGame);
router.put("/:id", authMiddleware, requireAdmin, gameController.updateGame);
router.delete("/:id", authMiddleware, requireAdmin, gameController.deleteGame);
router.post("/:id/generate-analysis", authMiddleware, requireAdmin, gameController.generateAnalysis);

export default router;
