import apiClient from './axiosConfig';
import { cache, CacheKeys } from '../utils/cache';
import type { Game } from '../types/basketball.types';
import type { MatchLogContext } from '../types/matchLog.types';

export const gameApi = {
  async createGame(data: {
    gameNumber: string;
    date: string;
    status?: string;
    teamSize?: number;
    notes?: string;
    seasonId?: string;
    countInStats?: boolean;
  }): Promise<Game> {
    const response = await apiClient.post('/games', data);
    cache.invalidate(CacheKeys.allGames());
    return response.data.data;
  },

  async getAllGames(): Promise<Game[]> {
    const cacheKey = CacheKeys.allGames();
    const cached = cache.get<Game[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get('/games');
    const games = response.data.data;
    cache.set(cacheKey, games, cache.getTTL('games'));
    return games;
  },

  async getGameById(id: string): Promise<Game> {
    const cacheKey = CacheKeys.game(id);
    const cached = cache.get<Game>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/games/${id}`);
    const game = response.data.data;
    cache.set(cacheKey, game, cache.getTTL('games'));
    return game;
  },

  async updateGame(
    id: string,
    data: {
      gameNumber?: string;
      date?: string;
      teamAId?: string;
      teamBId?: string;
      teamAStatsId?: string;
      teamBStatsId?: string;
      teamAScore?: number;
      teamBScore?: number;
      teamSize?: number;
      status?: string;
      notes?: string;
      countInStats?: boolean;
    }
  ): Promise<Game> {
    const response = await apiClient.put(`/games/${id}`, data);
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
    return response.data.data;
  },

  async deleteGame(id: string): Promise<void> {
    await apiClient.delete(`/games/${id}`);
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
  },

  async generateAnalysis(id: string, logContext?: MatchLogContext): Promise<Game> {
    const response = await apiClient.post(`/games/${id}/generate-analysis`, logContext ? { logContext } : {});
    cache.invalidate(CacheKeys.game(id));
    return response.data.data;
  },
};
