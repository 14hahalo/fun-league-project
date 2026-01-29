import apiClient from './axiosConfig';
import type { Season, CreateSeasonDto, UpdateSeasonDto } from '../types/season.types';
import { cache, CacheKeys } from '../utils/cache';

export const seasonApi = {
  getAllSeasons: async (): Promise<Season[]> => {
    const cacheKey = CacheKeys.allSeasons();
    const cached = cache.get<Season[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: Season[] }>('/seasons');
    const seasons = response.data.data;
    cache.set(cacheKey, seasons, cache.getTTL('seasons'));
    return seasons;
  },

  getActiveSeason: async (): Promise<Season | null> => {
    const cacheKey = CacheKeys.activeSeason();
    const cached = cache.get<Season | null>(cacheKey);
    if (cached !== null) return cached;

    const response = await apiClient.get<{ data: Season | null }>('/seasons/active');
    const season = response.data.data;
    cache.set(cacheKey, season, cache.getTTL('seasons'));
    return season;
  },

  getSeasonById: async (id: string): Promise<Season> => {
    const cacheKey = CacheKeys.season(id);
    const cached = cache.get<Season>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: Season }>(`/seasons/${id}`);
    const season = response.data.data;
    cache.set(cacheKey, season, cache.getTTL('seasons'));
    return season;
  },

  createSeason: async (data: CreateSeasonDto): Promise<Season> => {
    const response = await apiClient.post<{ data: Season }>('/seasons', data);
    cache.invalidate(CacheKeys.allSeasons());
    cache.invalidate(CacheKeys.activeSeason());
    return response.data.data;
  },

  updateSeason: async (id: string, data: UpdateSeasonDto): Promise<Season> => {
    const response = await apiClient.put<{ data: Season }>(`/seasons/${id}`, data);
    cache.invalidate(CacheKeys.season(id));
    cache.invalidate(CacheKeys.allSeasons());
    cache.invalidate(CacheKeys.activeSeason());
    return response.data.data;
  },

  deleteSeason: async (id: string): Promise<void> => {
    await apiClient.delete(`/seasons/${id}`);
    cache.invalidate(CacheKeys.season(id));
    cache.invalidate(CacheKeys.allSeasons());
    cache.invalidate(CacheKeys.activeSeason());
  },
};
