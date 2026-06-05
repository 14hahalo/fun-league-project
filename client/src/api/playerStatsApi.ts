import apiClient from './axiosConfig';
import { cache, CacheKeys } from '../utils/cache';
import type { PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../types/basketball.types';

export const playerStatsApi = {
  async createPlayerStats(data: CreatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.post('/player-stats', data);
    cache.invalidatePattern('stats:');
    return response.data.data;
  },

  async getPlayerStatsById(id: string): Promise<PlayerStats> {
    const response = await apiClient.get(`/player-stats/${id}`);
    return response.data.data;
  },

  async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    const cacheKey = CacheKeys.gameStats(gameId);
    const cached = cache.get<PlayerStats[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/player-stats/game/${gameId}`);
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  async getPlayerStatsForGame(gameId: string, playerId: string): Promise<PlayerStats> {
    const response = await apiClient.get(`/player-stats/game/${gameId}/player/${playerId}`);
    return response.data.data;
  },

  async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    const cacheKey = CacheKeys.playerStats(playerId);
    const cached = cache.get<PlayerStats[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/player-stats/player/${playerId}`);
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    const cacheKey = CacheKeys.bulkPlayerStats(playerIds);
    const cached = cache.get<Record<string, PlayerStats[]>>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.post('/player-stats/bulk', { playerIds });
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  async updatePlayerStats(id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.put(`/player-stats/${id}`, data);
    cache.invalidatePattern('stats:');
    return response.data.data;
  },

  async deletePlayerStats(id: string): Promise<void> {
    await apiClient.delete(`/player-stats/${id}`);
    cache.invalidatePattern('stats:');
  },

  async getTopPlayers(daysBack: number = 30, endDate?: Date): Promise<any> {
    let url = `/player-stats/top-players?daysBack=${daysBack}`;
    if (endDate) url += `&endDate=${endDate.toISOString()}`;
    const response = await apiClient.get<{ success: boolean; data: any }>(url);
    return response.data.data;
  },
};
