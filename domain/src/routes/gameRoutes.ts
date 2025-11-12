import { Router } from "express";
import { gameController } from "../controllers/gameController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

// Public routes - anyone can view games
router.get("/", gameController.getAllGames);
router.get("/status/:status", gameController.getGamesByStatus);
router.get("/:id", gameController.getGameById);

// Admin only routes - manage games
router.post("/", authMiddleware, requireAdmin, gameController.createGame);
router.put("/:id", authMiddleware, requireAdmin, gameController.updateGame);
router.delete("/:id", authMiddleware, requireAdmin, gameController.deleteGame);

// Generate AI analysis (admin only)
router.post("/:id/generate-analysis", authMiddleware, requireAdmin, gameController.generateAnalysis);

export default router;
