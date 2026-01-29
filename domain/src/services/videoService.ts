import { db } from '../config/firebase';
import { Video } from '../models/Video';
import { CreateVideoDto } from '../dtos/Video/CreateVideoDto';
import { UpdateVideoDto } from '../dtos/Video/UpdateVideoDto';

const COLLECTION_NAME = 'videos';

class VideoService {
  async createVideo(videoDto: CreateVideoDto): Promise<Video> {
    try {
      const videoRef = db.collection(COLLECTION_NAME).doc();

      const video: any = {
        id: videoRef.id,
        gameId: videoDto.gameId,
        title: videoDto.title,
        youtubeUrl: videoDto.youtubeUrl,
        playerIds: videoDto.playerIds || [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      if (videoDto.description) {
        video.description = videoDto.description;
      }

      await videoRef.set(video);
      return video as Video;
    } catch (error) {
      throw new Error(`Video eklenirken bir hata oluştu: ${error}`);
    }
  }

  async getAllVideos(): Promise<Video[]> {
    try {
      const snapshot = await db.collection(COLLECTION_NAME).get();
      const videos = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Video;
      });

      return videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Videolar listelenirken bir hata oluştu: ${error}`);
    }
  }

  async getVideoById(id: string): Promise<Video | null> {
    try {
      const doc = await db.collection(COLLECTION_NAME).doc(id).get();

      if (!doc.exists) {
        return null;
      }

      const data = doc.data();
      if (!data) return null;

      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Video;
    } catch (error) {
      throw new Error(`Videolar listelenirken bir hata oluştu: ${error}`);
    }
  }

  async getVideosByGameId(gameId: string): Promise<Video[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('gameId', '==', gameId)
        .get();

      const videos = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Video;
      });

      return videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Maçın videoları listelenirken bir hata oluştu: ${error}`);
    }
  }

  async getVideosByPlayerId(playerId: string): Promise<Video[]> {
    try {
      const snapshot = await db
        .collection(COLLECTION_NAME)
        .where('playerIds', 'array-contains', playerId)
        .get();

      const videos = snapshot.docs.map((doc) => {
        const data = doc.data();
        return {
          ...data,
          createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
          updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
        } as Video;
      });

      return videos.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    } catch (error) {
      throw new Error(`Oyuncunun videoları listelenirken bir hata oluştu: ${error}`);
    }
  }

  async updateVideo(id: string, videoDto: UpdateVideoDto): Promise<Video | null> {
    try {
      const videoRef = db.collection(COLLECTION_NAME).doc(id);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        return null;
      }

      const updateData: any = {
        updatedAt: new Date(),
      };

      if (videoDto.title !== undefined) updateData.title = videoDto.title;
      if (videoDto.description !== undefined) updateData.description = videoDto.description;
      if (videoDto.youtubeUrl !== undefined) updateData.youtubeUrl = videoDto.youtubeUrl;
      if (videoDto.playerIds !== undefined) updateData.playerIds = videoDto.playerIds;

      await videoRef.update(updateData);

      const updatedDoc = await videoRef.get();
      const data = updatedDoc.data();
      if (!data) return null;

      return {
        ...data,
        createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : new Date(data.createdAt),
        updatedAt: data.updatedAt?.toDate ? data.updatedAt.toDate() : new Date(data.updatedAt),
      } as Video;
    } catch (error) {
      throw new Error(`Video bilgileri güncellenirken bir hata oluştu: ${error}`);
    }
  }

  async deleteVideo(id: string): Promise<boolean> {
    try {
      const videoRef = db.collection(COLLECTION_NAME).doc(id);
      const videoDoc = await videoRef.get();

      if (!videoDoc.exists) {
        return false;
      }

      await videoRef.delete();
      return true;
    } catch (error) {
      throw new Error(`Video silinirken bir hata oluştu: ${error}`);
    }
  }
}

export default new VideoService();
