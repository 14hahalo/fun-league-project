import { Request, Response } from 'express';
import videoService from '../services/videoService';
import { CreateVideoDto } from '../dtos/Video/CreateVideoDto';
import { UpdateVideoDto } from '../dtos/Video/UpdateVideoDto';

class VideoController {
  async createVideo(req: Request, res: Response): Promise<void> {
    try {
      const videoDto: CreateVideoDto = req.body;

      if (!videoDto.gameId || !videoDto.title || !videoDto.youtubeUrl) {
        res.status(400).json({
          success: false,
          message: 'gameId, Video başlığı ve Youtube kaynak bağlantısı gereklidir'
        });
        return;
      }

      const video = await videoService.createVideo(videoDto);
      res.status(201).json({
        success: true,
        data: video,
        message: 'Video başarılı bir şekilde oluşturuldu '
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Video oluşturulurken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
      });
    }
  }

  async getAllVideos(_req: Request, res: Response): Promise<void> {
    try {
      const videos = await videoService.getAllVideos();
      res.status(200).json({
        success: true,
        data: videos,
        message: 'Videolar başarılı bir şekilde getirildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Videolar getirilirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
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
          message: 'Video bulunamadık'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
        message: 'Video başarılı bir şekilde getirildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Video getirilirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
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
        message: 'Videolar başarılı bir şekilde çekildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Maç videoları çekilirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
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
        message: 'Videolar başarılu bir şekilde getirildi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Oyuncu videoları çekilirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
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
          message: 'Video bulunamadı'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: video,
        message: 'Video başarılı bir şekilde güncellendi'
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Video bilgisi güncellirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
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
          message: 'Video bulunamadı'
        });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Video silinirken bir hata oluştu',
        error: error instanceof Error ? error.message : 'Bilinmeyen Hata'
      });
    }
  }
}

export default new VideoController();
