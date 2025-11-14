import apiClient from './axiosConfig';
import type { PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../types/basketball.types';

export const playerStatsApi = {
  // Get all player stats for a game
  async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats[] }>(`/player-stats/game/${gameId}`);
    return response.data.data;
  },

  // Get specific player stats by ID
  async getPlayerStatsById(id: string): Promise<PlayerStats> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats }>(`/player-stats/${id}`);
    return response.data.data;
  },

  // Get all stats for a specific player across all games
  async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    const response = await apiClient.get<{ success: boolean; data: PlayerStats[] }>(`/player-stats/player/${playerId}`);
    return response.data.data;
  },

  // Get stats for multiple players at once (BULK ENDPOINT - reduces API calls dramatically)
  async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    const response = await apiClient.post<{ success: boolean; data: Record<string, PlayerStats[]> }>('/player-stats/bulk', { playerIds });
    return response.data.data;
  },

  // Create new player stats
  async createPlayerStats(data: CreatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.post<{ success: boolean; data: PlayerStats }>('/player-stats', data);
    return response.data.data;
  },

  // Update player stats
  async updatePlayerStats(id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.put<{ success: boolean; data: PlayerStats }>(`/player-stats/${id}`, data);
    return response.data.data;
  },

  // Delete player stats
  async deletePlayerStats(id: string): Promise<void> {
    await apiClient.delete(`/player-stats/${id}`);
  },

  // Get top players
  async getTopPlayers(daysBack: number = 30, endDate?: Date): Promise<any> {
    let url = `/player-stats/top-players?daysBack=${daysBack}`;
    if (endDate) {
      url += `&endDate=${endDate.toISOString()}`;
    }
    const response = await apiClient.get<{ success: boolean; data: any }>(url);
    return response.data.data;
  },
};
