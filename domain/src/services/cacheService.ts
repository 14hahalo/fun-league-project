import Redis from 'ioredis';

/**
 * Redis Cache Service
 * Provides centralized caching to reduce Firebase reads
 */
class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  // TTL values in seconds
  private readonly TTL = {
    PLAYERS: 3600, // 1 hour (players rarely change)
    GAMES: 1800, // 30 minutes (completed games don't change)
    STATS: 1800, // 30 minutes (stats are final after game ends)
    TOP_PLAYERS: 600, // 10 minutes (needs more frequent updates for leaderboards)
    VIDEOS: 1800, // 30 minutes (videos rarely change)
    TEAMS: 1800, // 30 minutes (team rosters are stable)
  };

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Redis connection
   */
  private async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '10610'),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        // Connection pool settings for 100+ concurrent users
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 10000, // 10 seconds
        // Keep connection alive
        keepAlive: 30000, // 30 seconds
        // Reconnection strategy
        retryStrategy: (times) => {
          // Retry up to 5 times (increased from 3)
          if (times > 5) {
            console.warn('[CACHE] Redis unavailable after 5 retries, caching disabled');
            return null;
          }
          return Math.min(times * 500, 2000); // Exponential backoff
        },
      });

      this.redis.on('connect', () => {
        this.isEnabled = true;
      });

      this.redis.on('error', (err) => {
        console.warn('[CACHE] Redis error:', err.message);
        this.isEnabled = false;
      });

      // Test connection
      await this.redis.ping();
      this.isEnabled = true;
    } catch (error) {
      console.warn('[CACHE] Redis not available, running without cache');
      this.isEnabled = false;
      this.redis = null;
    }
  }

  /**
   * Get data from cache
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled || !this.redis) return null;

    try {
      const cached = await this.redis.get(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Set data in cache
   */
  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      const ttlSeconds = ttl || this.TTL.PLAYERS;
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
    }
  }

  /**
   * Delete specific key from cache
   */
  async invalidate(key: string): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
    }
  }

  /**
   * Delete keys matching pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      const keys = await this.redis.keys(`*${pattern}*`);
      if (keys.length > 0) {
        await this.redis.del(...keys);
      }
    } catch (error) {
    }
  }

  /**
   * Clear all cache
   */
  async clearAll(): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.flushdb();
    } catch (error) {
    }
  }

  /**
   * Get TTL for specific data type
   */
  getTTL(type: keyof typeof this.TTL): number {
    return this.TTL[type];
  }

  /**
   * Check if cache is enabled
   */
  isReady(): boolean {
    return this.isEnabled;
  }

  /**
   * Close Redis connection
   */
  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

// Export singleton instance
export const cacheService = new CacheService();

// Cache key generators for consistency
export const CacheKeys = {
  // Players
  allPlayers: () => 'players:all',
  activePlayers: () => 'players:active',
  player: (id: string) => `player:${id}`,

  // Games
  allGames: () => 'games:all',
  game: (id: string) => `game:${id}`,

  // Player Stats
  playerStats: (playerId: string) => `stats:player:${playerId}`,
  gameStats: (gameId: string) => `stats:game:${gameId}`,
  bulkPlayerStats: (playerIds: string[]) => `stats:bulk:${playerIds.sort().join(',')}`,
  topPlayers: (daysBack: number) => `stats:topPlayers:${daysBack}`,

  // Videos
  videos: (gameId: string) => `videos:game:${gameId}`,
  playerVideos: (playerId: string) => `videos:player:${playerId}`,

  // Teams
  gameTeams: (gameId: string) => `teams:game:${gameId}`,
  team: (id: string) => `team:${id}`,

  // Team Stats
  gameTeamStats: (gameId: string) => `teamStats:game:${gameId}`,
  teamStats: (id: string) => `teamStats:${id}`,
};
