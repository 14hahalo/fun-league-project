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

      if (userRole !== PlayerRole.ADMIN && userId !== targetPlayerId) {
        res.status(403).json({
          status: "error",
          message: "Yalnızca kendinize ait profili güncelleyebilirsiniz",
        });
        return;
      }

      const updateData: UpdatePlayerDto = req.body;

      if (userRole !== PlayerRole.ADMIN) {
        delete (updateData as any).role;
        delete (updateData as any).isActive;
        delete (updateData as any).email; // Güvenlik için email değişikliğini engelle
        delete (updateData as any).password; // Şifre ayrı bir endpoint üzerinden değiştirilmeli
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

  // POST /api/players/:id/set-password - Admin oyuncu şifresini belirler
  static async setPlayerPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { id } = req.params;
      const { newPassword } = req.body;

      if (!newPassword || newPassword.length < 6) {
        res.status(400).json({
          status: "error",
          message: "Yeni parolanın az 6 karakter olması lazım",
        });
        return;
      }

      await PlayerService.setPlayerPassword(id, newPassword);

      res.status(200).json({
        status: "success",
        message: "Parola başarılı bir şekilde oluşturuldu",
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
