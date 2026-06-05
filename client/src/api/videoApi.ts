import apiClient from './axiosConfig';
import { cache, CacheKeys } from '../utils/cache';
import type { Video, CreateVideoDto, UpdateVideoDto } from '../types/basketball.types';

export const videoApi = {
  async createVideo(data: CreateVideoDto): Promise<Video> {
    const response = await apiClient.post('/videos', data);
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async getAllVideos(): Promise<Video[]> {
    const response = await apiClient.get('/videos');
    return response.data.data;
  },

  async getVideoById(id: string): Promise<Video> {
    const response = await apiClient.get(`/videos/${id}`);
    return response.data.data;
  },

  async getVideosByGameId(gameId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.videos(gameId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/game/${gameId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  async getVideosByPlayerId(playerId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.playerVideos(playerId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/player/${playerId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  async updateVideo(id: string, data: UpdateVideoDto): Promise<Video> {
    const response = await apiClient.put(`/videos/${id}`, data);
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async deleteVideo(id: string): Promise<void> {
    await apiClient.delete(`/videos/${id}`);
    cache.invalidatePattern('videos:');
  },
};
