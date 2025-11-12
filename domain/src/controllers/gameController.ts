import { Request, Response } from "express";
import { gameService } from "../services/gameService";
import { CreateGameDto } from "../dtos/Game/CreateGameDto";
import { UpdateGameDto } from "../dtos/Game/UpdateGameDto";
import { GameStatus } from "../enums/GameStatus";

export const gameController = {
  /**
   * Create a new game
   */
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
        message: "Game created successfully",
      });
    } catch (error) {
      console.error("Error creating game:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create game",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Get all games
   */
  async getAllGames(_req: Request, res: Response): Promise<void> {
    try {
      const games = await gameService.getAllGames();

      res.status(200).json({
        success: true,
        data: games,
        message: "Games retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting games:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve games",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Get game by ID
   */
  async getGameById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await gameService.getGameById(id);

      if (!game) {
        res.status(404).json({
          success: false,
          message: "Game not found",
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: game,
        message: "Game retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting game:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve game",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Update game
   */
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
        message: "Game updated successfully",
      });
    } catch (error) {
      console.error("Error updating game:", error);
      res.status(500).json({
        success: false,
        message: "Failed to update game",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Delete game
   */
  async deleteGame(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      await gameService.deleteGame(id);

      res.status(200).json({
        success: true,
        message: "Game deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting game:", error);
      res.status(500).json({
        success: false,
        message: "Failed to delete game",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Get games by status
   */
  async getGamesByStatus(req: Request, res: Response): Promise<void> {
    try {
      const { status } = req.params;

      if (!Object.values(GameStatus).includes(status as GameStatus)) {
        res.status(400).json({
          success: false,
          message: "Invalid game status",
        });
        return;
      }

      const games = await gameService.getGamesByStatus(status as GameStatus);

      res.status(200).json({
        success: true,
        data: games,
        message: "Games retrieved successfully",
      });
    } catch (error) {
      console.error("Error getting games by status:", error);
      res.status(500).json({
        success: false,
        message: "Failed to retrieve games",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },

  /**
   * Generate AI analysis for a game
   */
  async generateAnalysis(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const game = await gameService.generateAnalysis(id);

      res.status(200).json({
        success: true,
        data: game,
        message: "AI analysis generated successfully",
      });
    } catch (error) {
      console.error("Error generating AI analysis:", error);
      res.status(500).json({
        success: false,
        message: "Failed to generate AI analysis",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  },
};
