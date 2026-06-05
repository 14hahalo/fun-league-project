import apiClient from './axiosConfig';

export interface StoredEventLog {
  id: string;
  gameId: string;
  events: { period: string; actor: string; event: string }[];
  playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>;
  createdAt: string;
}

export const matchEventLogApi = {
  async save(
    gameId: string,
    events: { period: string; actor: string; event: string }[],
    playerTeams: Record<string, 'TEAM_A' | 'TEAM_B'>
  ): Promise<StoredEventLog> {
    const response = await apiClient.post('/match-event-logs', { gameId, events, playerTeams });
    return response.data.data;
  },

  async getByGameId(gameId: string): Promise<StoredEventLog | null> {
    try {
      const response = await apiClient.get(`/match-event-logs/game/${gameId}`);
      return response.data.data;
    } catch (err: any) {
      if (err?.response?.status === 404) return null;
      throw err;
    }
  },
};
