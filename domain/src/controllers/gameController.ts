import { Request, Response } from "express";
import { gameService } from "../services/gameService";
import { CreateGameDto } from "../dtos/Game/CreateGameDto";
import { UpdateGameDto } from "../dtos/Game/UpdateGameDto";

export const gameController = {

  async createGame(req: Request, res: Response): Promise<void> {
    try {
      const gameData: CreateGameDto = {
        ...req.body,
        date: new Date(req.body.date),
      };

      const game = await gameService.createGame(gameData);

      res.status(201).json({
        success: true,
        data: game,
        message: "Maç Başarı ile oluşturuldıuı",
      });
    } catch (error) {
      console.error("Maç oluştururken hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "Maç oluşturma esnasında hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async getAllGames(_req: Request, res: Response): Promise<void> {
    try {
      const games = await gameService.getAllGames();

      res.status(200).json({
        success: true,
        data: games,
        message: "Maç bilgileri çekildi",
      });
    } catch (error) {
      console.error("Maç bilgileri çekilirken hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "Maç bilgileri çekilirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await gameService.getGameById(id);

      if (!game) {
        res.status(404).json({
          success: false,
          message: "Maç bulunamadı",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: game,
        message: "Maç bilgisi başarılıyla bulundu",
      });
    } catch (error) {
      console.error("Maç bilgisi çekilirken hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "Maç bilgisi çekilirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async updateGame(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const updateData: UpdateGameDto = req.body;

      if (updateData.date) {
        updateData.date = new Date(updateData.date);
      }

      const game = await gameService.updateGame(id, updateData);

      res.status(200).json({
        success: true,
        data: game,
        message: "Maç bilgisi güncellendi",
      });
    } catch (error) {
      console.error("Maç bilgisi güncellenirken hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "Maç bilgisi güncellenirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async deleteGame(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await gameService.deleteGame(id);

      res.status(200).json({
        success: true,
        message: "Maç başarıyla silindi",
      });
    } catch (error) {
      console.error("Maç silinirken hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "Maç silinirken hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },

  async generateAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await gameService.generateAnalysis(id);

      res.status(200).json({
        success: true,
        data: game,
        message: "AI analizi başarıyla oluşturuldu",
      });
    } catch (error) {
      console.error("AI Analizi oluşturulurken bir hata oluştu:", error);
      res.status(500).json({
        success: false,
        message: "AI Analizi oluşturulurken bir hata oluştu",
        error: error instanceof Error ? error.message : "Bilinmeyen Hata",
      });
    }
  },
};