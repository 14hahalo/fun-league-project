import { Request, Response, NextFunction } from "express";
import { TeamStatsService } from "../services/teamStatsService";

export class TeamStatsController {
  // Generate team stats from player stats
  static async generateTeamStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, teamType } = req.body;

      if (!gameId || !teamType) {
        res.status(400).json({
          success: false,
          message: "gameId ve teamType gereklidir",
        });
        return;
      }

      const teamStats = await TeamStatsService.generateTeamStats(
        gameId,
        teamType as "TEAM_A" | "TEAM_B"
      );

      res.status(200).json({
        success: true,
        data: teamStats,
        message: "Takım istatistikleri başarıyla oluşturuldu",
      });
    } catch (error) {
      next(error);
    }
  }

  // Get team stats by ID
  static async getTeamStatsById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const teamStats = await TeamStatsService.getTeamStatsById(id);

      res.status(200).json({
        success: true,
        data: teamStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get all team stats for a game
  static async getTeamStatsByGameId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId } = req.params;
      const teamStats = await TeamStatsService.getTeamStatsByGameId(gameId);

      res.status(200).json({
        success: true,
        data: teamStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Get specific team stats for a game
  static async getTeamStatsForGame(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, teamType } = req.params;
      const teamStats = await TeamStatsService.getTeamStatsForGame(
        gameId,
        teamType as "TEAM_A" | "TEAM_B"
      );

      if (!teamStats) {
        res.status(404).json({
          success: false,
          message: "Bu maç için takım istatistiği bulunamadı",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: teamStats,
      });
    } catch (error) {
      next(error);
    }
  }

  // Recalculate team stats
  static async recalculateTeamStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, teamType } = req.params;
      const teamStats = await TeamStatsService.recalculateTeamStats(
        gameId,
        teamType as "TEAM_A" | "TEAM_B"
      );

      res.status(200).json({
        success: true,
        data: teamStats,
        message: "Takım istatistikleri başarıyla yeniden hesaplandı",
      });
    } catch (error) {
      next(error);
    }
  }

  // Delete team stats
  static async deleteTeamStats(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await TeamStatsService.deleteTeamStats(id);

      res.status(200).json({
        success: true,
        message: "Takım istatistikleri başarıyla silindi",
      });
    } catch (error) {
      next(error);
    }
  }
}
