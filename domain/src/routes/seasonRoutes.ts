import { Router } from "express";
import { seasonController } from "../controllers/seasonController";
import { authMiddleware } from "../middleware/authMiddleware";
import { requireAdmin } from "../middleware/roleMiddleware";

const router = Router();

router.get("/", seasonController.getAllSeasons);
router.get("/active", seasonController.getActiveSeason);
router.get("/:id", seasonController.getSeasonById);

router.post("/", authMiddleware, requireAdmin, seasonController.createSeason);
router.put("/:id", authMiddleware, requireAdmin, seasonController.updateSeason);
router.delete("/:id", authMiddleware, requireAdmin, seasonController.deleteSeason);

export default router;
