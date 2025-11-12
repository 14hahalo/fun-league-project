import apiClient from './axiosConfig';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../types/player.types';
import { cache, CacheKeys } from '../utils/cache';

export const playerApi = {
  // Tüm oyuncuları getir (CACHED - 10 minutes)
  getAllPlayers: async (): Promise<Player[]> => {
    const cacheKey = CacheKeys.allPlayers();
    const cached = cache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { players: Player[] } }>('/players');
    const players = response.data.data.players;
    cache.set(cacheKey, players, cache.getTTL('players'));
    return players;
  },

  // Aktif oyuncuları getir (CACHED - 10 minutes)
  getActivePlayers: async (): Promise<Player[]> => {
    const cacheKey = CacheKeys.activePlayers();
    const cached = cache.get<Player[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { players: Player[] } }>('/players/active');
    const players = response.data.data.players;
    cache.set(cacheKey, players, cache.getTTL('players'));
    return players;
  },

  // ID'ye göre oyuncu getir (CACHED - 10 minutes)
  getPlayerById: async (id: string): Promise<Player> => {
    const cacheKey = CacheKeys.player(id);
    const cached = cache.get<Player>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get<{ data: { player: Player } }>(`/players/${id}`);
    const player = response.data.data.player;
    cache.set(cacheKey, player, cache.getTTL('players'));
    return player;
  },

  // Yeni oyuncu oluştur (INVALIDATES cache)
  createPlayer: async (data: CreatePlayerDto): Promise<Player> => {
    const response = await apiClient.post<{ data: { player: Player } }>('/players', data);
    // Invalidate all players cache
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
    return response.data.data.player;
  },

  // Oyuncu güncelle (INVALIDATES cache)
  updatePlayer: async (id: string, data: UpdatePlayerDto): Promise<Player> => {
    const response = await apiClient.put<{ data: { player: Player } }>(`/players/${id}`, data);
    // Invalidate specific player and all players cache
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
    return response.data.data.player;
  },

  // Oyuncu sil (soft delete) (INVALIDATES cache)
  deletePlayer: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}`);
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
  },

  // Oyuncu kalıcı sil (INVALIDATES cache)
  permanentDeletePlayer: async (id: string): Promise<void> => {
    await apiClient.delete(`/players/${id}/permanent`);
    cache.invalidate(CacheKeys.player(id));
    cache.invalidate(CacheKeys.allPlayers());
    cache.invalidate(CacheKeys.activePlayers());
  },

  // Admin: Oyuncu şifresini ayarla (No cache impact)
  setPlayerPassword: async (id: string, newPassword: string): Promise<void> => {
    await apiClient.post(`/players/${id}/set-password`, { newPassword });
  },
};