import { Request, Response } from 'express';
import videoService from '../services/videoService';
import { CreateVideoDto } from '../dtos/Video/CreateVideoDto';
import { UpdateVideoDto } from '../dtos/Video/UpdateVideoDto';

class VideoController {
  async createVideo(req: Request, res: Response): Promise<void> {
    try {
      const videoDto: CreateVideoDto = req.body;

      // Validate required fields
      if (!videoDto.gameId || !videoDto.title || !videoDto.youtubeUrl) {
        res.status(400).json({
          success: false,
          message: 'gameId, title, and youtubeUrl are required'
        });
        return;
      }

      const video = await videoService.createVideo(videoDto);
      res.status(201).json({
        success: true,
        data: video,
        message: 'Video created successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to create video',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getAllVideos(_req: Request, res: Response): Promise<void> {
    try {
      const videos = await videoService.getAllVideos();
      res.status(200).json({
        success: true,
        data: videos,
        message: 'Videos retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getVideoById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const video = await videoService.getVideoById(id);

      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Video not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
        message: 'Video retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch video',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getVideosByGameId(req: Request, res: Response): Promise<void> {
    try {
      const { gameId } = req.params;
      const videos = await videoService.getVideosByGameId(gameId);
      res.status(200).json({
        success: true,
        data: videos,
        message: 'Videos retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos for game',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async getVideosByPlayerId(req: Request, res: Response): Promise<void> {
    try {
      const { playerId } = req.params;
      const videos = await videoService.getVideosByPlayerId(playerId);
      res.status(200).json({
        success: true,
        data: videos,
        message: 'Videos retrieved successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to fetch videos for player',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async updateVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const videoDto: UpdateVideoDto = req.body;

      const video = await videoService.updateVideo(id, videoDto);

      if (!video) {
        res.status(404).json({
          success: false,
          message: 'Video not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
        message: 'Video updated successfully'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to update video',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }

  async deleteVideo(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const success = await videoService.deleteVideo(id);

      if (!success) {
        res.status(404).json({
          success: false,
          message: 'Video not found'
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Failed to delete video',
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }
}

export default new VideoController();
