import { Request, Response } from "express";
import { seasonService } from "../services/seasonService";
import { CreateSeasonDto } from "../dtos/Season/CreateSeasonDto";
import { UpdateSeasonDto } from "../dtos/Season/UpdateSeasonDto";

export const seasonController = {
  async createSeason(req: Request, res: Response): Promise<void> {
    try {
      const seasonData: CreateSeasonDto = {
        ...req.body,
        beginDate: new Date(req.body.beginDate),
        finishDate: req.body.finishDate ? new Date(req.body.finishDate) : null,
      };

      const season = await seasonService.createSeason(seasonData);

      res.status(201).json({
        success: true,
        data: season,
        message: "Season created successfully",
      });
    } catch (error) {
      console.error("Error creating season:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create season",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async getAllSeasons(_req: Request, res: Response): Promise<void> {
    try {
      const seasons = await seasonService.getAllSeasons();

      res.status(200).json({
        success: true,
        data: seasons,
        message: "Seasons retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting seasons:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve seasons",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async getActiveSeason(_req: Request, res: Response): Promise<void> {
    try {
      const season = await seasonService.getActiveSeason();

      res.status(200).json({
        success: true,
        data: season,
        message: season ? "Active season retrieved successfully" : "No active season found",
      });
    } catch (error) {
      console.error("Error getting active season:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve active season",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async getSeasonById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const season = await seasonService.getSeasonById(id);

      if (!season) {
        res.status(404).json({
          success: false,
          message: "Season not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: season,
        message: "Season retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting season:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve season",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async updateSeason(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateSeasonDto = {
        ...req.body,
      };

      if (req.body.beginDate) {
        updateData.beginDate = new Date(req.body.beginDate);
      }
      if (req.body.finishDate !== undefined) {
        updateData.finishDate = req.body.finishDate ? new Date(req.body.finishDate) : null;
      }

      const season = await seasonService.updateSeason(id, updateData);

      res.status(200).json({
        success: true,
        data: season,
        message: "Season updated successfully",
      });
    } catch (error) {
      console.error("Error updating season:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update season",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async deleteSeason(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await seasonService.deleteSeason(id);

      res.status(200).json({
        success: true,
        message: "Sezon başarılı bir şekilde silindi",
      });
    } catch (error) {
      console.error("Error deleting season:", error);
      res.status(500).json({
        success: false,
        message: "Sezon silinirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },
};
