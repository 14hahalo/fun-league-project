import { Request, Response, NextFunction } from "express";
import { PlayerStatsService } from "../services/playerStatsService";
import { TeamStatsService } from "../services/teamStatsService";
import { CreatePlayerStatsDto } from "../dtos/PlayerStats/CreatePlayerStatsDTO";
import { UpdatePlayerStatsDto } from "../dtos/PlayerStats/UpdatePlayerStatsDTO";

export class PlayerStatsController {
  // Create player stats
  static async createPlayerStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: CreatePlayerStatsDto = req.body;
      const playerStats = await PlayerStatsService.createPlayerStats(data);

      // Auto-generate/update team stats
      await TeamStatsService.generateTeamStats(data.gameId, data.teamType);

      res.status(201).json({
        success: true,
        data: playerStats,
        message: "Oyuncu istatistikleri başarıyla oluşturuldu",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get player stats by ID
  static async getPlayerStatsById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const playerStats = await PlayerStatsService.getPlayerStatsById(id);

      res.status(200).json({
        success: true,
        data: playerStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all player stats for a game
  static async getPlayerStatsByGameId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId } = req.params;
      const playerStats = await PlayerStatsService.getPlayerStatsByGameId(
        gameId
      );

      res.status(200).json({
        success: true,
        data: playerStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get stats for a specific player in a specific game
  static async getPlayerStatsForGame(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, playerId } = req.params;
      const playerStats = await PlayerStatsService.getPlayerStatsForGame(
        gameId,
        playerId
      );

      if (!playerStats) {
        res.status(404).json({
          success: false,
          message: "Bu oyuncu için bu maçta istatistik bulunamadı",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: playerStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Update player stats
  static async updatePlayerStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdatePlayerStatsDto = req.body;
      const playerStats = await PlayerStatsService.updatePlayerStats(id, data);

      // Get the game ID and team type to update team stats
      const updatedStats = await PlayerStatsService.getPlayerStatsById(id);
      await TeamStatsService.recalculateTeamStats(
        updatedStats.gameId,
        updatedStats.teamType
      );

      res.status(200).json({
        success: true,
        data: playerStats,
        message: "Oyuncu istatistikleri başarıyla güncellendi",
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete player stats
  static async deletePlayerStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;

      // Get stats before deletion to recalculate team stats
      const stats = await PlayerStatsService.getPlayerStatsById(id);

      await PlayerStatsService.deletePlayerStats(id);

      // Recalculate team stats after deletion
      await TeamStatsService.recalculateTeamStats(
        stats.gameId,
        stats.teamType
      );

      res.status(200).json({
        success: true,
        message: "Oyuncu istatistikleri başarıyla silindi",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all stats for a specific player across all games
  static async getAllStatsForPlayer(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { playerId } = req.params;
      const playerStats = await PlayerStatsService.getAllStatsForPlayer(
        playerId
      );

      res.status(200).json({
        success: true,
        data: playerStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get stats for multiple players at once (BULK ENDPOINT)
  static async getBulkPlayerStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { playerIds } = req.body;

      if (!playerIds || !Array.isArray(playerIds)) {
        res.status(400).json({
          success: false,
          message: "playerIds array is required",
        });
        return;
      }

      const bulkStats = await PlayerStatsService.getBulkPlayerStats(playerIds);

      res.status(200).json({
        success: true,
        data: bulkStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get top players by various stats
  static async getTopPlayers(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const daysBack = req.query.daysBack ? parseInt(req.query.daysBack as string) : 30;
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;
      const topPlayers = await PlayerStatsService.getTopPlayers(daysBack, endDate);

      res.status(200).json({
        success: true,
        data: topPlayers,
      });
    } catch (error) {
      next(error);
    }
  }
}
