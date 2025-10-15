import { Request, Response, NextFunction } from "express";
import { PlayerService } from "../services/playerService";
import { CreatePlayerDto } from "../dtos/Player/CreatePlayerDTO";
import { UpdatePlayerDto } from "../dtos/Player/UpdatePlayerDTO";

export class PlayerController {
  // GET /api/players - Tüm oyuncuları getir
  static async getAllPlayers(_req: Request, res: Response, next: NextFunction) {
    try {
      const players = await PlayerService.getAllPlayers();
      res.status(200).json({
        status: "success",
        results: players.length,
        data: { players },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/players/active - Aktif oyuncuları getir
  static async getActivePlayers(
    _req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      const players = await PlayerService.getActivePlayers();
      res.status(200).json({
        status: "success",
        results: players.length,
        data: { players },
      });
    } catch (error) {
      next(error);
    }
  }

  // GET /api/players/:id - Tek oyuncu getir
  static async getPlayerById(req: Request, res: Response, next: NextFunction) {
    try {
      const player = await PlayerService.getPlayerById(req.params.id);
      res.status(200).json({
        status: "success",
        data: { player },
      });
    } catch (error) {
      next(error);
    }
  }

  // POST /api/players - Yeni oyuncu oluştur
  static async createPlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const playerData: CreatePlayerDto = req.body;
      const newPlayer = await PlayerService.createPlayer(playerData);
      res.status(201).json({
        status: "success",
        data: { player: newPlayer },
      });
    } catch (error) {
      next(error);
    }
  }

  // PUT /api/players/:id - Oyuncu güncelle
  static async updatePlayer(req: Request, res: Response, next: NextFunction) {
    try {
      const updateData: UpdatePlayerDto = req.body;
      const updatedPlayer = await PlayerService.updatePlayer(
        req.params.id,
        updateData
      );
      res.status(200).json({
        status: "success",
        data: { player: updatedPlayer },
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/players/:id - Oyuncu sil (soft delete)
  static async deletePlayer(req: Request, res: Response, next: NextFunction) {
    try {
      await PlayerService.deletePlayer(req.params.id);
      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/players/:id/permanent - Oyuncu kalıcı sil
  static async permanentDeletePlayer(
    req: Request,
    res: Response,
    next: NextFunction
  ) {
    try {
      await PlayerService.permanentDeletePlayer(req.params.id);
      res.status(204).json({
        status: "success",
        data: null,
      });
    } catch (error) {
      next(error);
    }
  }
}
