import apiClient from './axiosConfig';
import type { PlayerAnalysis, PlayerAnalysisHistory } from '../types/playerAnalysis.types';

export const playerAnalysisApi = {
  async getActiveAnalysis(playerId: string): Promise<PlayerAnalysis | null> {
    const response = await apiClient.get(`/players/${playerId}/analysis`);
    return response.data.data;
  },

  async getAnalysisHistory(playerId: string, page: number = 1, pageSize: number = 10): Promise<PlayerAnalysisHistory> {
    const response = await apiClient.get(`/players/${playerId}/analysis/history`, {
      params: { page, pageSize },
    });
    return response.data.data;
  },

  async regeneratePlayer(playerId: string): Promise<void> {
    await apiClient.post(`/admin/analysis/regenerate/${playerId}`);
  },

  async regenerateAll(): Promise<void> {
    await apiClient.post('/admin/analysis/regenerate/all');
  },

  async backfill(): Promise<{ processed: number; skipped: number; failed: { playerId: string; error: string }[] }> {
    const response = await apiClient.post('/admin/analysis/backfill');
    return response.data.data;
  },
};
