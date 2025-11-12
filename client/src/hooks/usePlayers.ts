import { useState, useEffect } from 'react';
import type { Player, CreatePlayerDto, UpdatePlayerDto } from '../types/player.types';
import { playerApi } from '../api/playerApi';

export const usePlayers = (activeOnly = false) => {
  const [players, setPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayers = async () => {
    try {
      setLoading(true);
      const data = activeOnly 
        ? await playerApi.getActivePlayers() 
        : await playerApi.getAllPlayers();
      setPlayers(data);
      setError(null);
    } catch (err) {
      setError('Oyuncular yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createPlayer = async (data: CreatePlayerDto) => {
    try {
      const newPlayer = await playerApi.createPlayer(data);
      setPlayers(prev => [...prev, newPlayer]);
      return newPlayer;
    } catch (err) {
      setError('Oyuncu eklenirken bir hata oluştu');
      throw err;
    }
  };

  const updatePlayer = async (id: string, data: UpdatePlayerDto) => {
    try {
      const updatedPlayer = await playerApi.updatePlayer(id, data);
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
      return updatedPlayer;
    } catch (err) {
      setError('Oyuncu güncellenirken bir hata oluştu');
      throw err;
    }
  };

  const togglePlayerStatus = async (id: string) => {
    try {
      const player = players.find(p => p.id === id);
      if (!player) return;

      const updatedPlayer = await playerApi.updatePlayer(id, { isActive: !player.isActive });
      setPlayers(prev => prev.map(p => p.id === id ? updatedPlayer : p));
    } catch (err) {
      setError('Oyuncu durumu değiştirilirken bir hata oluştu');
      throw err;
    }
  };

  const deletePlayer = async (id: string) => {
    try {
      await playerApi.permanentDeletePlayer(id);
      setPlayers(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      setError('Oyuncu silinirken bir hata oluştu');
      throw err;
    }
  };

  useEffect(() => {
    fetchPlayers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeOnly]);

  return {
    players,
    loading,
    error,
    fetchPlayers,
    createPlayer,
    updatePlayer,
    togglePlayerStatus,
    deletePlayer,
  };
};