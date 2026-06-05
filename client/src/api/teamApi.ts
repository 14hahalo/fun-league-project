import apiClient from './axiosConfig';
import type { Team, CreateTeamDto, UpdateTeamDto } from '../types/basketball.types';

export const teamApi = {
  async createTeam(data: CreateTeamDto): Promise<Team> {
    const response = await apiClient.post('/teams', data);
    return response.data.data;
  },

  async getTeamById(id: string): Promise<Team> {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data.data;
  },

  async getTeamsByGameId(gameId: string): Promise<Team[]> {
    const response = await apiClient.get(`/teams/game/${gameId}`);
    return response.data.data;
  },

  async getTeamForGame(gameId: string, teamType: string): Promise<Team> {
    const response = await apiClient.get(`/teams/game/${gameId}/team/${teamType}`);
    return response.data.data;
  },

  async updateTeam(id: string, data: UpdateTeamDto): Promise<Team> {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data.data;
  },

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  async addPlayerToTeam(teamId: string, playerId: string): Promise<Team> {
    const response = await apiClient.post(`/teams/${teamId}/players`, { playerId });
    return response.data.data;
  },

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<Team> {
    const response = await apiClient.delete(`/teams/${teamId}/players/${playerId}`);
    return response.data.data;
  },

  async buildBalancedTeams(playerIds: string[]): Promise<{
    teamA: string[];
    teamB: string[];
    analysis: string;
    pairs?: { rank: number; teamA: string; teamB: string; swapReason?: string }[];
  }> {
    const response = await apiClient.post('/teams/build-balanced', { playerIds });
    return response.data.data;
  },
};
