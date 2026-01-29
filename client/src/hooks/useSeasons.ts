import { useState, useEffect } from 'react';
import type { Season, CreateSeasonDto, UpdateSeasonDto } from '../types/season.types';
import { seasonApi } from '../api/seasonApi';
import { cache, CacheKeys } from '../utils/cache';

export const useSeasons = (invalidateCache: boolean = true) => {
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSeasons = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);

      if (forceRefresh || invalidateCache) {
        cache.invalidate(CacheKeys.allSeasons());
        cache.invalidate(CacheKeys.activeSeason());
      }

      const data = await seasonApi.getAllSeasons();
      setSeasons(data);
      setError(null);
    } catch (err) {
      setError('Sezonlar yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const createSeason = async (data: CreateSeasonDto) => {
    try {
      const newSeason = await seasonApi.createSeason(data);
      setSeasons(prev => [...prev, newSeason]);
      return newSeason;
    } catch (err) {
      setError('Sezon eklenirken bir hata oluştu');
      throw err;
    }
  };

  const updateSeason = async (id: string, data: UpdateSeasonDto) => {
    try {
      const updatedSeason = await seasonApi.updateSeason(id, data);
      setSeasons(prev => prev.map(s => s.id === id ? updatedSeason : s));
      return updatedSeason;
    } catch (err) {
      setError('Sezon güncellenirken bir hata oluştu');
      throw err;
    }
  };

  const deleteSeason = async (id: string) => {
    try {
      await seasonApi.deleteSeason(id);
      setSeasons(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Sezon silinirken bir hata oluştu');
      throw err;
    }
  };

  useEffect(() => {
    fetchSeasons();
  }, []);

  return {
    seasons,
    loading,
    error,
    fetchSeasons,
    createSeason,
    updateSeason,
    deleteSeason,
  };
};
