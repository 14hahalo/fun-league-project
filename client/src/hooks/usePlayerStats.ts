import { useState, useEffect, useCallback } from 'react';
import { playerStatsApi } from '../api/playerStatsApi';
import type { PlayerStats, CreatePlayerStatsDto, UpdatePlayerStatsDto } from '../types/basketball.types';

export const usePlayerStats = (gameId?: string) => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerStats = useCallback(async () => {
    if (!gameId) return;

    setLoading(true);
    setError(null);
    try {
      const data = await playerStatsApi.getPlayerStatsByGameId(gameId);
      setPlayerStats(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch player stats');
    } finally {
      setLoading(false);
    }
  }, [gameId]);

  useEffect(() => {
    if (gameId) {
      fetchPlayerStats();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameId]);

  const createPlayerStats = async (data: CreatePlayerStatsDto): Promise<PlayerStats> => {
    setLoading(true);
    setError(null);
    try {
      const newStats = await playerStatsApi.createPlayerStats(data);
      setPlayerStats((prev) => [...prev, newStats]);
      return newStats;
    } catch (err: any) {
      setError(err.message || 'Failed to create player stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updatePlayerStats = async (id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> => {
    setLoading(true);
    setError(null);
    try {
      const updatedStats = await playerStatsApi.updatePlayerStats(id, data);
      setPlayerStats((prev) => prev.map((stats) => (stats.id === id ? updatedStats : stats)));
      return updatedStats;
    } catch (err: any) {
      setError(err.message || 'Failed to update player stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deletePlayerStats = async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await playerStatsApi.deletePlayerStats(id);
      setPlayerStats((prev) => prev.filter((stats) => stats.id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete player stats');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    playerStats,
    loading,
    error,
    createPlayerStats,
    updatePlayerStats,
    deletePlayerStats,
    refetch: fetchPlayerStats,
  };
};
