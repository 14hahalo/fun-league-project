import { Request, Response, NextFunction } from "express";
import { TeamService } from "../services/teamService";
import { CreateTeamDto } from "../dtos/Team/CreateTeamDTO";
import { UpdateTeamDto } from "../dtos/Team/UpdateTeamDTO";
import { openAIService } from "../services/openAIService";

export class TeamController {
  static async createTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const data: CreateTeamDto = req.body;
      const team = await TeamService.createTeam(data);

      res.status(201).json({
        success: true,
        data: team,
        message: "Takım başarıyla oluşturuldu",
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamById(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const team = await TeamService.getTeamById(id);

      res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamsByGameId(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId } = req.params;
      const teams = await TeamService.getTeamsByGameId(gameId);

      res.status(200).json({
        success: true,
        data: teams,
      });
    } catch (error) {
      next(error);
    }
  }

  static async getTeamForGame(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { gameId, teamType } = req.params;
      const team = await TeamService.getTeamForGame(
        gameId,
        teamType as "TEAM_A" | "TEAM_B"
      );

      if (!team) {
        res.status(404).json({
          success: false,
          message: "Bu maç için takım bulunamadı",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: team,
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      const data: UpdateTeamDto = req.body;
      const team = await TeamService.updateTeam(id, data);

      res.status(200).json({
        success: true,
        data: team,
        message: "Takım başarıyla güncellendi",
      });
    } catch (error) {
      next(error);
    }
  }

  static async deleteTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { id } = req.params;
      await TeamService.deleteTeam(id);

      res.status(200).json({
        success: true,
        message: "Takım başarıyla silindi",
      });
    } catch (error) {
      next(error);
    }
  }

  static async addPlayerToTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { teamId } = req.params;
      const { playerId } = req.body;

      if (!playerId) {
        res.status(400).json({
          success: false,
          message: "playerId gereklidir",
        });
        return;
      }

      const team = await TeamService.addPlayerToTeam(teamId, playerId);

      res.status(200).json({
        success: true,
        data: team,
        message: "Oyuncu takıma başarıyla eklendi",
      });
    } catch (error) {
      next(error);
    }
  }

  static async removePlayerFromTeam(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { teamId, playerId } = req.params;
      const team = await TeamService.removePlayerFromTeam(teamId, playerId);

      res.status(200).json({
        success: true,
        data: team,
        message: "Oyuncu takımdan başarıyla çıkarıldı",
      });
    } catch (error) {
      next(error);
    }
  }

  static async buildBalancedTeams(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const { playerIds } = req.body;

      if (!playerIds || !Array.isArray(playerIds)) {
        res.status(400).json({
          success: false,
          message: "playerId dizisi gerekli",
        });
        return;
      }

      if (playerIds.length !== 10) {
        res.status(400).json({
          success: false,
          message: "10 oyuncu seçimi şartı",
        });
        return;
      }

      const result = await openAIService.buildBalancedTeams(playerIds);

      res.status(200).json({
        success: true,
        data: result,
        message: "Takımlar dengelendi",
      });
    } catch (error) {
      next(error);
    }
  }
}
