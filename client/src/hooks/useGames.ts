import { useState, useEffect } from 'react';
import { gameApi } from '../api/basketballApi';
import type { Game } from '../types/basketball.types';

export const useGames = () => {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchGames = async () => {
    try {
      setLoading(true);
      const data = await gameApi.getAllGames();
      const sortedGames = data.sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setGames(sortedGames);
      setError(null);
    } catch (err) {
      setError('Maçlar yüklenirken bir hata oluştu');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const deleteGame = async (id: string) => {
    try {
      await gameApi.deleteGame(id);
      await fetchGames();
    } catch (err) {
      setError('Maç silinirken bir hata oluştu');
      console.error(err);
      throw err;
    }
  };

  useEffect(() => {
    fetchGames();
  }, []);

  return {
    games,
    loading,
    error,
    refetch: fetchGames,
    deleteGame,
  };
};
