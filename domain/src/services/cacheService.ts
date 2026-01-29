import Redis from 'ioredis';

class CacheService {
  private redis: Redis | null = null;
  private isEnabled: boolean = false;

  //Türlere göre time intervallerin belirlendiği yerler
  private readonly TTL = {
    PLAYERS: 3600,
    GAMES: 1800,
    STATS: 1800,
    TOP_PLAYERS: 600,
    VIDEOS: 1800,
    TEAMS: 1800,
    SEASONS: 1800
  };

  constructor() {
    this.initialize();
  }

  private async initialize() {
    try {
      this.redis = new Redis({
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '10610'),
        username: process.env.REDIS_USERNAME || undefined,
        password: process.env.REDIS_PASSWORD || undefined,
        maxRetriesPerRequest: 3,
        enableReadyCheck: true,
        enableOfflineQueue: true,
        connectTimeout: 10000, 
        keepAlive: 30000, 
        retryStrategy: (times: number) => {
          if (times > 5) {
            console.warn('Redis unavailable after 5 retries, caching disabled');
            return null;
          }
          return Math.min(times * 500, 2000);
        },
      });

      this.redis.on('connect', () => {
        this.isEnabled = true;
      });

      this.redis.on('error', (err: Error) => {
        console.warn('Redis error:', err.message);
        this.isEnabled = false;
      });

      await this.redis.ping();
      this.isEnabled = true;
    } catch (error) {
      console.warn('Redis not available, running without cache');
      this.isEnabled = false;
      this.redis = null;
    }
  }

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

  async set<T>(key: string, data: T, ttl?: number): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      const ttlSeconds = ttl || this.TTL.PLAYERS;
      await this.redis.setex(key, ttlSeconds, JSON.stringify(data));
    } catch (error) {
    }
  }

  async invalidate(key: string): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.del(key);
    } catch (error) {
    }
  }

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

  async clearAll(): Promise<void> {
    if (!this.isEnabled || !this.redis) return;

    try {
      await this.redis.flushdb();
    } catch (error) {
    }
  }

  getTTL(type: 'PLAYERS' | 'GAMES' | 'STATS' | 'TOP_PLAYERS' | 'VIDEOS' | 'TEAMS' | 'SEASONS'): number {
    return this.TTL[type];
  }

  isReady(): boolean {
    return this.isEnabled;
  }

  async disconnect(): Promise<void> {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export const cacheService = new CacheService();

export const CacheKeys = {
  allPlayers: () => 'players:all',
  activePlayers: () => 'players:active',
  player: (id: string) => `player:${id}`,

  allGames: () => 'games:all',
  game: (id: string) => `game:${id}`,

  playerStats: (playerId: string) => `stats:player:${playerId}`,
  gameStats: (gameId: string) => `stats:game:${gameId}`,
  bulkPlayerStats: (playerIds: string[]) => `stats:bulk:${playerIds.sort().join(',')}`,
  topPlayers: (daysBack: number) => `stats:topPlayers:${daysBack}`,

  videos: (gameId: string) => `videos:game:${gameId}`,
  playerVideos: (playerId: string) => `videos:player:${playerId}`,

  gameTeams: (gameId: string) => `teams:game:${gameId}`,
  team: (id: string) => `team:${id}`,

  gameTeamStats: (gameId: string) => `teamStats:game:${gameId}`,
  teamStats: (id: string) => `teamStats:${id}`,

  allSeasons: () => 'seasons:all',
  activeSeason: () => 'seasons:active',
  season: (id: string) => `season:${id}`,
};
