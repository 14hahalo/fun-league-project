import { Request, Response, NextFunction } from "express";
import { PlayerService } from "../services/playerService";
import { CreatePlayerDto } from "../dtos/Player/CreatePlayerDTO";
import { UpdatePlayerDto } from "../dtos/Player/UpdatePlayerDTO";
import { PlayerRole } from "../models/Player";

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
      const userId = (req as any).userId;
      const userRole = (req as any).userRole;
      const targetPlayerId = req.params.id;

      // Check if user is admin or updating their own profile
      if (userRole !== PlayerRole.ADMIN && userId !== targetPlayerId) {
        res.status(403).json({
          status: "error",
          message: "You can only update your own profile",
        });
        return;
      }

      const updateData: UpdatePlayerDto = req.body;

      // If user is not admin, prevent them from changing sensitive fields
      if (userRole !== PlayerRole.ADMIN) {
        delete (updateData as any).role;
        delete (updateData as any).isActive;
        delete (updateData as any).email; // Prevent email change for security
        delete (updateData as any).password; // Password should be changed through a separate endpoint
      }

      const updatedPlayer = await PlayerService.updatePlayer(
        targetPlayerId,
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

  // POST /api/players/:id/set-password - Admin sets player password
  static async setPlayerPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          status: "error",
          message: "New password must be at least 6 characters long",
        });
        return;
      }

      await PlayerService.setPlayerPassword(id, newPassword);

      res.status(200).json({
        status: "success",
        message: "Password set successfully",
      });
    } catch (error) {
      next(error);
    }
  }

  // DELETE /api/players/:id - Oyuncu sil (soft delete)
  static async deletePlayer(req: Request, res: Response, next: NextFunction) {
    try {
      await PlayerService.deletePlayer(req.params.id);
      res.status(204).send();
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
      res.status(204).send();
    } catch (error) {
      next(error);
    }
  }
}
