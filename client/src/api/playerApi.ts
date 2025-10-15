import axios from 'axios';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../types/player.types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const playerApi = {
  // Tüm oyuncuları getir
  getAllPlayers: async (): Promise<Player[]> => {
    const response = await api.get<{ data: { players: Player[] } }>('/players');
    return response.data.data.players;
  },

  // Aktif oyuncuları getir
  getActivePlayers: async (): Promise<Player[]> => {
    const response = await api.get<{ data: { players: Player[] } }>('/players/active');
    return response.data.data.players;
  },

  // ID'ye göre oyuncu getir
  getPlayerById: async (id: string): Promise<Player> => {
    const response = await api.get<{ data: { player: Player } }>(`/players/${id}`);
    return response.data.data.player;
  },

  // Yeni oyuncu oluştur
  createPlayer: async (data: CreatePlayerDto): Promise<Player> => {
    const response = await api.post<{ data: { player: Player } }>('/players', data);
    return response.data.data.player;
  },

  // Oyuncu güncelle
  updatePlayer: async (id: string, data: UpdatePlayerDto): Promise<Player> => {
    const response = await api.put<{ data: { player: Player } }>(`/players/${id}`, data);
    return response.data.data.player;
  },

  // Oyuncu sil (soft delete)
  deletePlayer: async (id: string): Promise<void> => {
    await api.delete(`/players/${id}`);
  },

  // Oyuncu kalıcı sil
  permanentDeletePlayer: async (id: string): Promise<void> => {
    await api.delete(`/players/${id}/permanent`);
  },
};