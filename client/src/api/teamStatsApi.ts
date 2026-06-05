import apiClient from './axiosConfig';
import type { TeamStats } from '../types/basketball.types';

export const teamStatsApi = {
  async generateTeamStats(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.post('/team-stats/generate', { gameId, teamType });
    return response.data.data;
  },

  async getTeamStatsById(id: string): Promise<TeamStats> {
    const response = await apiClient.get(`/team-stats/${id}`);
    return response.data.data;
  },

  async getTeamStatsByGameId(gameId: string): Promise<TeamStats[]> {
    const response = await apiClient.get(`/team-stats/game/${gameId}`);
    return response.data.data;
  },

  async getTeamStatsForGame(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.get(`/team-stats/game/${gameId}/team/${teamType}`);
    return response.data.data;
  },

  async recalculateTeamStats(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.put(`/team-stats/recalculate/${gameId}/${teamType}`);
    return response.data.data;
  },

  async deleteTeamStats(id: string): Promise<void> {
    await apiClient.delete(`/team-stats/${id}`);
  },
};
