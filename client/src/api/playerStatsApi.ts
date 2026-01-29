import apiClient from './axiosConfig';
import type { PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../types/basketball.types';

export const playerStatsApi = {
  async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats[] }>(`/player-stats/game/${gameId}`);
    return response.data.data;
  },

  async getPlayerStatsById(id: string): Promise<PlayerStats> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats }>(`/player-stats/${id}`);
    return response.data.data;
  },

  async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats[] }>(`/player-stats/player/${playerId}`);
    return response.data.data;
  },

  async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    const response = await apiClient.post<{ success: boolean; data: Record<string, PlayerStats[]> }>('/player-stats/bulk', { playerIds });
    return response.data.data;
  },

  async createPlayerStats(data: CreatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.post<{ success: boolean; data: PlayerStats }>('/player-stats', data);
    return response.data.data;
  },

  async updatePlayerStats(id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.put<{ success: boolean; data: PlayerStats }>(`/player-stats/${id}`, data);
    return response.data.data;
  },

  async deletePlayerStats(id: string): Promise<void> {
    await apiClient.delete(`/player-stats/${id}`);
  },

  async getTopPlayers(daysBack: number = 30, endDate?: Date): Promise<any> {
    let url = `/player-stats/top-players?daysBack=${daysBack}`;
    if (endDate) {
      url += `&endDate=${endDate.toISOString()}`;
    }
    const response = await apiClient.get<{ success: boolean; data: any }>(url);
    return response.data.data;
  },
};
