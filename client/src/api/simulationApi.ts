import apiClient from './axiosConfig';

export interface SimPlayerProfile {
  name: string;
  ppg: number;
  rpg: number;
  apg: number;
  eff: number;
  twoPct: number;
  threePct: number;
  gamesPlayed: number;
}

export interface SimulationAnalysisRequest {
  teamAPlayers: SimPlayerProfile[];
  teamBPlayers: SimPlayerProfile[];
  projectedTeamAScore: number;
  projectedTeamBScore: number;
  teamAWinPct: number;
  teamBWinPct: number;
}

export const simulationApi = {
  async analyze(data: SimulationAnalysisRequest): Promise<string> {
    const response = await apiClient.post<{ success: boolean; data: string }>('/simulation/analyze', data);
    return response.data.data;
  },
};
