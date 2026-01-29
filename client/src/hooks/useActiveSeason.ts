import { useState, useEffect } from 'react';
import type { Season } from '../types/season.types';
import { seasonApi } from '../api/seasonApi';
import { cache, CacheKeys } from '../utils/cache';

export const useActiveSeason = (invalidateCache: boolean = true) => {
  const [activeSeason, setActiveSeason] = useState<Season | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchActiveSeason = async (forceRefresh: boolean = false) => {
    try {
      setLoading(true);

      if (forceRefresh || invalidateCache) {
        cache.invalidate(CacheKeys.activeSeason());
      }

      const season = await seasonApi.getActiveSeason();
      setActiveSeason(season);
      setError(null);
    } catch (err) {
      setError('Aktif sezon yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActiveSeason();
  }, []);

  return {
    activeSeason,
    loading,
    error,
    refetch: fetchActiveSeason,
  };
};
