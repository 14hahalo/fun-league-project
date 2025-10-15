import { Router } from "express";
import { PlayerController } from "../controllers/playerController";
import { validate } from "../middleware/validation";
import {
  createPlayerSchema,
  updatePlayerSchema,
} from "../validators/playerValidation";

const router = Router();

router.get("/", PlayerController.getAllPlayers);
router.get("/active", PlayerController.getActivePlayers);
router.get("/:id", PlayerController.getPlayerById);

router.post("/", validate(createPlayerSchema), PlayerController.createPlayer);

router.put("/:id", validate(updatePlayerSchema), PlayerController.updatePlayer);

router.delete("/:id", PlayerController.deletePlayer);
router.delete("/:id/permanent", PlayerController.permanentDeletePlayer);

export default router;
