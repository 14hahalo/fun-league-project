import apiClient from './axiosConfig';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../types/player.types';
import { cache, CacheKeys } from '../utils/cache';

export const playerApi = {
  getAllPlayers: async (): Promise<Player[]> => {
    const cacheKey = CacheKeys.allPlayers();
    const cached = cache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { players: Player[] } }>('/players');
    const players = response.data.data.players;
    cache.set(cacheKey, players, cache.getTTL('players'));
    return players;
  },

  getActivePlayers: async (): Promise<Player[]> => {
    const cacheKey = CacheKeys.activePlayers();
    const cached = cache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { players: Player[] } }>('/players/active');
    const players = response.data.data.players;
    cache.set(cacheKey, players, cache.getTTL('players'));
    return players;
  },

  getPlayerById: async (id: string): Promise<Player> => {
    const cacheKey = CacheKeys.player(id);
    const cached = cache.get<Player>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { player: Player } }>(`/players/${id}`);
    const player = response.data.data.player;
    cache.set(cacheKey, player, cache.getTTL('players'));
    return player;
  },

  createPlayer: async (data: CreatePlayerDto): Promise<Player> => {
    const response = await apiClient.post<{ data: { player: Player } }>('/players', data);
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
    return response.data.data.player;
  },

  updatePlayer: async (id: string, data: UpdatePlayerDto): Promise<Player> => {
    const response = await apiClient.put<{ data: { player: Player } }>(`/players/${id}`, data);
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
    return response.data.data.player;
  },

  deletePlayer: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
  },

  permanentDeletePlayer: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}/permanent`);
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
  },

  setPlayerPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/players/${id}/set-password`, { newPassword });
  },
};