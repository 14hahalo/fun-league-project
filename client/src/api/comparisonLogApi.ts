import apiClient from './axiosConfig';

export const comparisonLogApi = {
  async log(playerAName: string, playerBName: string): Promise<void> {
    await apiClient.post('/comparison-logs', { playerAName, playerBName });
  },
};
