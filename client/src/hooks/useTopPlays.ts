import { useState, useEffect } from 'react';
import { videoApi } from '../api/basketballApi';
import type { Video } from '../types/basketball.types';

export const useTopPlays = () => {
  const [topPlays, setTopPlays] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTopPlays = async () => {
      try {
        setLoading(true);
        setError(null);

        // Get all videos
        const allVideos = await videoApi.getAllVideos();

        // Calculate last month's date range
        const now = new Date();
        const firstDayLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const lastDayLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
        lastDayLastMonth.setHours(23, 59, 59, 999);

        // Filter videos from last month with playerIds length < 10 (top plays/shorts)
        const filteredVideos = allVideos.filter((video) => {
          const videoDate = new Date(video.createdAt);
          const isLastMonth =
            videoDate >= firstDayLastMonth &&
            videoDate <= lastDayLastMonth;
          const isTopPlay = video.playerIds && video.playerIds.length < 8;

          return isLastMonth && isTopPlay;
        });

        // Sort by creation date (newest first)
        const sortedVideos = filteredVideos.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        setTopPlays(sortedVideos);
      } catch (err: any) {
        console.error('Error fetching top plays:', err);
        setError(err.message || 'Top oyunlar yüklenirken bir hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    fetchTopPlays();
  }, []);

  return { topPlays, loading, error };
};
