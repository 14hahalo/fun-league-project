import { useState, useCallback } from 'react';
import type {
  PlayerStats,
  CreatePlayerStatsDto,
  UpdatePlayerStatsDto,
  TeamStats,
  Team,
  CreateTeamDto,
} from '../types/basketball.types';
import { playerStatsApi, teamStatsApi, teamApi } from '../api/basketballApi';

export const useBasketballStats = () => {
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [teamStats, setTeamStats] = useState<TeamStats[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPlayerStatsByGame = useCallback(async (gId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await playerStatsApi.getPlayerStatsByGameId(gId);
      setPlayerStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Oyuncu istatistikleri yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamStatsByGame = useCallback(async (gId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamStatsApi.getTeamStatsByGameId(gId);
      setTeamStats(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Takım istatistikleri yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchTeamsByGame = useCallback(async (gId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await teamApi.getTeamsByGameId(gId);
      setTeams(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Takımlar yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchAllGameData = useCallback(async (gId: string) => {
    setLoading(true);
    setError(null);
    try {
      const [playerStatsData, teamStatsData, teamsData] = await Promise.all([
        playerStatsApi.getPlayerStatsByGameId(gId),
        teamStatsApi.getTeamStatsByGameId(gId),
        teamApi.getTeamsByGameId(gId),
      ]);
      setPlayerStats(playerStatsData);
      setTeamStats(teamStatsData);
      setTeams(teamsData);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Maç verileri yüklenemedi');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createPlayerStats = useCallback(async (data: CreatePlayerStatsDto): Promise<PlayerStats> => {
    setLoading(true);
    setError(null);
    try {
      const newStats = await playerStatsApi.createPlayerStats(data);
      setPlayerStats((prev) => [...prev, newStats]);
      return newStats;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Oyuncu istatistikleri oluşturulamadı';
      setError(errorMessage);
      console.error(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePlayerStats = useCallback(async (id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> => {
    setLoading(true);
    setError(null);
    try {
      const updated = await playerStatsApi.updatePlayerStats(id, data);
      setPlayerStats((prev) => prev.map((stat) => (stat.id === id ? updated : stat)));
      return updated;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Oyuncu istatistikleri güncellenemedi';
      setError(errorMessage);
      console.error(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePlayerStats = useCallback(async (id: string): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await playerStatsApi.deletePlayerStats(id);
      setPlayerStats((prev) => prev.filter((stat) => stat.id !== id));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Oyuncu istatistikleri silinemedi';
      setError(errorMessage);
      console.error(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTeam = useCallback(async (data: CreateTeamDto): Promise<Team> => {
    setLoading(true);
    setError(null);
    try {
      const newTeam = await teamApi.createTeam(data);
      setTeams((prev) => [...prev, newTeam]);
      return newTeam;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Takım oluşturulamadı';
      setError(errorMessage);
      console.error(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const generateTeamStats = useCallback(async (gId: string, teamType: string): Promise<TeamStats> => {
    setLoading(true);
    setError(null);
    try {
      const stats = await teamStatsApi.generateTeamStats(gId, teamType);
      setTeamStats((prev) => {
        const filtered = prev.filter((s) => s.gameId !== gId || s.teamType !== teamType);
        return [...filtered, stats];
      });
      return stats;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Takım istatistikleri oluşturulamadı';
      setError(errorMessage);
      console.error(err);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    playerStats,
    teamStats,
    teams,
    loading,
    error,
    fetchPlayerStatsByGame,
    fetchTeamStatsByGame,
    fetchTeamsByGame,
    fetchAllGameData,
    createPlayerStats,
    updatePlayerStats,
    deletePlayerStats,
    createTeam,
    generateTeamStats,
  };
};
