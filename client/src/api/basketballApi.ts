import apiClient from './axiosConfig';
import { cache, CacheKeys } from '../utils/cache';
import type {
  PlayerStats,
  CreatePlayerStatsDto,
  UpdatePlayerStatsDto,
  TeamStats,
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  Game,
  Video,
  CreateVideoDto,
  UpdateVideoDto,
} from '../types/basketball.types';

// Player Stats API
export const playerStatsApi = {
  async createPlayerStats(data: CreatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.post('/player-stats', data);
    // Invalidate caches
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
    // Invalidate all stats caches
    cache.invalidatePattern('stats:');
    return response.data.data;
  },

  async deletePlayerStats(id: string): Promise<void> {
    await apiClient.delete(`/player-stats/${id}`);
    // Invalidate all stats caches
    cache.invalidatePattern('stats:');
  },
};

// Team Stats API
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

// Team API
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
    cost: number;
    tokenUsage: {
      promptTokens: number;
      completionTokens: number;
      totalTokens: number;
    };
  }> {
    const response = await apiClient.post('/teams/build-balanced', { playerIds });
    return response.data.data;
  },
};

// Game API
export const gameApi = {
  async createGame(data: {
    gameNumber: string;
    date: string;
    status?: string;
    teamSize?: number;
    notes?: string;
  }): Promise<Game> {
    const response = await apiClient.post('/games', data);
    // Invalidate games cache
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
    }
  ): Promise<Game> {
    const response = await apiClient.put(`/games/${id}`, data);
    // Invalidate game caches
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
    return response.data.data;
  },

  async deleteGame(id: string): Promise<void> {
    await apiClient.delete(`/games/${id}`);
    // Invalidate game caches
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
  },

  async generateAnalysis(id: string): Promise<Game> {
    const response = await apiClient.post(`/games/${id}/generate-analysis`);
    // Invalidate game cache to get updated analysis
    cache.invalidate(CacheKeys.game(id));
    return response.data.data;
  },
};

// Video API
export const videoApi = {
  async createVideo(data: CreateVideoDto): Promise<Video> {
    const response = await apiClient.post('/videos', data);
    // Invalidate video caches
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async getAllVideos(): Promise<Video[]> {
    const response = await apiClient.get('/videos');
    return response.data.data;
  },

  async getVideoById(id: string): Promise<Video> {
    const response = await apiClient.get(`/videos/${id}`);
    return response.data.data;
  },

  async getVideosByGameId(gameId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.videos(gameId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/game/${gameId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  async getVideosByPlayerId(playerId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.playerVideos(playerId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/player/${playerId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  async updateVideo(id: string, data: UpdateVideoDto): Promise<Video> {
    const response = await apiClient.put(`/videos/${id}`, data);
    // Invalidate video caches
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async deleteVideo(id: string): Promise<void> {
    await apiClient.delete(`/videos/${id}`);
    // Invalidate video caches
    cache.invalidatePattern('videos:');
  },
};
