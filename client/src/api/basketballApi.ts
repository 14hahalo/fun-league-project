import apiClient from './axiosConfig';
import { cache, CacheKeys } from '../utils/cache';
import type {
  PlayerStats,
  CreatePlayerStatsDto,
  UpdatePlayerStatsDto,
  TeamStats,
  Team,
  CreateTeamDto,
  UpdateTeamDto,
  Game,
  Video,
  CreateVideoDto,
  UpdateVideoDto,
} from '../types/basketball.types';

/**
 * Basketbol API modülü - Cache-Aside pattern kullanılarak optimize edilmiştir.
 *
 * Cache stratejisi:
 * - GET isteklerinde önce cache kontrol edilir (read-through)
 * - CUD (Create/Update/Delete) işlemlerinde ilgili cache'ler invalidate edilir
 * - Pattern-based invalidation ile ilişkili tüm cache'ler temizlenir
 *
 * Not: response.data.data yapısı backend'in standart response wrapper'ından kaynaklanır
 * { success: boolean, data: T, message?: string }
 */

export const playerStatsApi = {
  /**
   * Yeni oyuncu istatistiği oluşturur.
   * Cache invalidation: 'stats:' prefix'i ile başlayan tüm cache'ler temizlenir
   * çünkü yeni stat, oyuncu ortalamaları ve maç istatistiklerini etkiler.
   */
  async createPlayerStats(data: CreatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.post('/player-stats', data);
    cache.invalidatePattern('stats:');
    return response.data.data;
  },

  async getPlayerStatsById(id: string): Promise<PlayerStats> {
    const response = await apiClient.get(`/player-stats/${id}`);
    return response.data.data;
  },

  /**
   * Belirli bir maça ait tüm oyuncu istatistiklerini getirir.
   * Cache-aside pattern: Önce cache kontrol edilir, yoksa API'den çekilip cache'lenir.
   * TTL değeri cache.getTTL('stats') ile merkezi olarak yönetilir.
   */
  async getPlayerStatsByGameId(gameId: string): Promise<PlayerStats[]> {
    const cacheKey = CacheKeys.gameStats(gameId);
    const cached = cache.get<PlayerStats[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/player-stats/game/${gameId}`);
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  async getPlayerStatsForGame(gameId: string, playerId: string): Promise<PlayerStats> {
    const response = await apiClient.get(`/player-stats/game/${gameId}/player/${playerId}`);
    return response.data.data;
  },

  async getAllStatsForPlayer(playerId: string): Promise<PlayerStats[]> {
    const cacheKey = CacheKeys.playerStats(playerId);
    const cached = cache.get<PlayerStats[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/player-stats/player/${playerId}`);
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  /**
   * Birden fazla oyuncunun istatistiklerini tek seferde çeker (N+1 problem çözümü).
   * POST kullanılmasının sebebi: GET ile çok sayıda ID göndermek URL length limit'ine takılabilir.
   * Dönen veri yapısı: { [playerId]: PlayerStats[] } şeklinde bir map'tir.
   */
  async getBulkPlayerStats(playerIds: string[]): Promise<Record<string, PlayerStats[]>> {
    const cacheKey = CacheKeys.bulkPlayerStats(playerIds);
    const cached = cache.get<Record<string, PlayerStats[]>>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.post('/player-stats/bulk', { playerIds });
    const stats = response.data.data;
    cache.set(cacheKey, stats, cache.getTTL('stats'));
    return stats;
  },

  async updatePlayerStats(id: string, data: UpdatePlayerStatsDto): Promise<PlayerStats> {
    const response = await apiClient.put(`/player-stats/${id}`, data);
    cache.invalidatePattern('stats:');
    return response.data.data;
  },

  async deletePlayerStats(id: string): Promise<void> {
    await apiClient.delete(`/player-stats/${id}`);
    cache.invalidatePattern('stats:');
  },
};

/**
 * Takım İstatistikleri API'si
 * teamType parametresi 'A' veya 'B' değerlerini alır (ev sahibi/deplasman mantığı).
 * Bu istatistikler oyuncu istatistiklerinin agregasyonundan oluşturulur.
 */
export const teamStatsApi = {
  /**
   * Maçtaki oyuncu istatistiklerini toplayarak takım istatistiği üretir.
   * Backend'de aggregation pipeline çalıştırılır (toplam sayı, ribaund, asist vb.)
   */
  async generateTeamStats(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.post('/team-stats/generate', { gameId, teamType });
    return response.data.data;
  },

  async getTeamStatsById(id: string): Promise<TeamStats> {
    const response = await apiClient.get(`/team-stats/${id}`);
    return response.data.data;
  },

  async getTeamStatsByGameId(gameId: string): Promise<TeamStats[]> {
    const response = await apiClient.get(`/team-stats/game/${gameId}`);
    return response.data.data;
  },

  async getTeamStatsForGame(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.get(`/team-stats/game/${gameId}/team/${teamType}`);
    return response.data.data;
  },

  /**
   * Oyuncu istatistikleri değiştiğinde takım istatistiklerini yeniden hesaplar.
   * PUT kullanılır çünkü mevcut kayıt güncellenir, yeni kayıt oluşturulmaz.
   */
  async recalculateTeamStats(gameId: string, teamType: string): Promise<TeamStats> {
    const response = await apiClient.put(`/team-stats/recalculate/${gameId}/${teamType}`);
    return response.data.data;
  },

  async deleteTeamStats(id: string): Promise<void> {
    await apiClient.delete(`/team-stats/${id}`);
  },
};

/**
 * Takım Yönetimi API'si
 * Her maçta iki takım bulunur (A ve B). Takımlar oyunculardan oluşur.
 * Not: Team ve TeamStats farklı entity'lerdir - Team kadroyu, TeamStats performansı tutar.
 */
export const teamApi = {
  async createTeam(data: CreateTeamDto): Promise<Team> {
    const response = await apiClient.post('/teams', data);
    return response.data.data;
  },

  async getTeamById(id: string): Promise<Team> {
    const response = await apiClient.get(`/teams/${id}`);
    return response.data.data;
  },

  async getTeamsByGameId(gameId: string): Promise<Team[]> {
    const response = await apiClient.get(`/teams/game/${gameId}`);
    return response.data.data;
  },

  async getTeamForGame(gameId: string, teamType: string): Promise<Team> {
    const response = await apiClient.get(`/teams/game/${gameId}/team/${teamType}`);
    return response.data.data;
  },

  async updateTeam(id: string, data: UpdateTeamDto): Promise<Team> {
    const response = await apiClient.put(`/teams/${id}`, data);
    return response.data.data;
  },

  async deleteTeam(id: string): Promise<void> {
    await apiClient.delete(`/teams/${id}`);
  },

  async addPlayerToTeam(teamId: string, playerId: string): Promise<Team> {
    const response = await apiClient.post(`/teams/${teamId}/players`, { playerId });
    return response.data.data;
  },

  async removePlayerFromTeam(teamId: string, playerId: string): Promise<Team> {
    const response = await apiClient.delete(`/teams/${teamId}/players/${playerId}`);
    return response.data.data;
  },

  /**
   * Oyuncuların geçmiş performanslarına göre dengeli takımlar oluşturur.
   * Backend'de AI/algoritma kullanılarak oyuncu güçleri analiz edilir.
   * analysis alanı, takım dağılımının neden bu şekilde yapıldığını açıklar.
   */
  async buildBalancedTeams(playerIds: string[]): Promise<{
    teamA: string[];
    teamB: string[];
    analysis: string;
  }> {
    const response = await apiClient.post('/teams/build-balanced', { playerIds });
    return response.data.data;
  },
};

/**
 * Maç Yönetimi API'si
 * Maçlar sezonlara bağlıdır (seasonId). Her maçın durumu (status) takip edilir:
 * - 'scheduled': Planlanmış
 * - 'in_progress': Devam ediyor
 * - 'completed': Tamamlandı
 */
export const gameApi = {
  async createGame(data: {
    gameNumber: string;
    date: string;
    status?: string;
    teamSize?: number;
    notes?: string;
    seasonId?: string;
  }): Promise<Game> {
    const response = await apiClient.post('/games', data);
    cache.invalidate(CacheKeys.allGames());
    return response.data.data;
  },

  async getAllGames(): Promise<Game[]> {
    const cacheKey = CacheKeys.allGames();
    const cached = cache.get<Game[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get('/games');
    const games = response.data.data;
    cache.set(cacheKey, games, cache.getTTL('games'));
    return games;
  },

  async getGameById(id: string): Promise<Game> {
    const cacheKey = CacheKeys.game(id);
    const cached = cache.get<Game>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/games/${id}`);
    const game = response.data.data;
    cache.set(cacheKey, game, cache.getTTL('games'));
    return game;
  },

  /**
   * Maç bilgilerini günceller. Partial update desteklenir (sadece değişen alanlar gönderilir).
   * teamAId/teamBId: Takım entity referansları
   * teamAStatsId/teamBStatsId: Takım istatistik entity referansları
   * İki farklı cache invalidate edilir: tekil maç ve maç listesi
   */
  async updateGame(
    id: string,
    data: {
      gameNumber?: string;
      date?: string;
      teamAId?: string;
      teamBId?: string;
      teamAStatsId?: string;
      teamBStatsId?: string;
      teamAScore?: number;
      teamBScore?: number;
      teamSize?: number;
      status?: string;
      notes?: string;
    }
  ): Promise<Game> {
    const response = await apiClient.put(`/games/${id}`, data);
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
    return response.data.data;
  },

  async deleteGame(id: string): Promise<void> {
    await apiClient.delete(`/games/${id}`);
    cache.invalidate(CacheKeys.game(id));
    cache.invalidate(CacheKeys.allGames());
  },

  /**
   * Maç için AI destekli analiz üretir (OpenAI entegrasyonu).
   * Analiz; oyuncu performansları, takım karşılaştırması ve öne çıkan istatistikleri içerir.
   * İşlem async olduğundan response'ta güncellenmiş Game objesi döner.
   */
  async generateAnalysis(id: string): Promise<Game> {
    const response = await apiClient.post(`/games/${id}/generate-analysis`);
    cache.invalidate(CacheKeys.game(id));
    return response.data.data;
  },
};

/**
 * Video Yönetimi API'si
 * Videolar maçlara ve oyunculara bağlanabilir (highlight klipleri için).
 * YouTube URL'leri desteklenir, video meta verisi backend'de parse edilir.
 */
export const videoApi = {
  async createVideo(data: CreateVideoDto): Promise<Video> {
    const response = await apiClient.post('/videos', data);
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async getAllVideos(): Promise<Video[]> {
    const response = await apiClient.get('/videos');
    return response.data.data;
  },

  async getVideoById(id: string): Promise<Video> {
    const response = await apiClient.get(`/videos/${id}`);
    return response.data.data;
  },

  async getVideosByGameId(gameId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.videos(gameId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/game/${gameId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  /**
   * Belirli bir oyuncunun tüm highlight videolarını getirir.
   * Oyuncu profil sayfasında "En İyi Anlar" bölümü için kullanılır.
   * Cache TTL'i 'games' ile aynı tutulur çünkü videolar nadir güncellenir.
   */
  async getVideosByPlayerId(playerId: string): Promise<Video[]> {
    const cacheKey = CacheKeys.playerVideos(playerId);
    const cached = cache.get<Video[]>(cacheKey);
    if (cached) return cached;

    const response = await apiClient.get(`/videos/player/${playerId}`);
    const videos = response.data.data;
    cache.set(cacheKey, videos, cache.getTTL('games'));
    return videos;
  },

  async updateVideo(id: string, data: UpdateVideoDto): Promise<Video> {
    const response = await apiClient.put(`/videos/${id}`, data);
    cache.invalidatePattern('videos:');
    return response.data.data;
  },

  async deleteVideo(id: string): Promise<void> {
    await apiClient.delete(`/videos/${id}`);
    cache.invalidatePattern('videos:');
  },
};
