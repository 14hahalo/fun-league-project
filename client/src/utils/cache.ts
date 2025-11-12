/**
 * Multi-layer cache utility to reduce Firebase reads
 * - Memory cache: Fast, but cleared on page refresh
 * - LocalStorage cache: Persists across sessions
 * - TTL (Time To Live): Configurable expiration
 */

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  // Default TTL values (in milliseconds)
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly PLAYERS_TTL = 10 * 60 * 1000; // 10 minutes (players rarely change)
  private readonly GAMES_TTL = 5 * 60 * 1000; // 5 minutes
  private readonly STATS_TTL = 3 * 60 * 1000; // 3 minutes
  private readonly TOP_PLAYERS_TTL = 2 * 60 * 1000; // 2 minutes

  /**
   * Get data from cache (checks memory first, then localStorage)
   */
  get<T>(key: string): T | null {
    // Check memory cache first (fastest)
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      console.log(`[CACHE HIT - Memory] ${key}`);
      return memoryEntry.data;
    }

    // Check localStorage (slower but persists)
    try {
      const localStorageData = localStorage.getItem(key);
      if (localStorageData) {
        const entry: CacheEntry<T> = JSON.parse(localStorageData);
        if (!this.isExpired(entry)) {
          // Restore to memory cache for faster subsequent access
          this.memoryCache.set(key, entry);
          console.log(`[CACHE HIT - LocalStorage] ${key}`);
          return entry.data;
        } else {
          // Expired - remove from localStorage
          localStorage.removeItem(key);
        }
      }
    } catch (error) {
      console.error('[CACHE ERROR]', error);
    }

    console.log(`[CACHE MISS] ${key}`);
    return null;
  }

  /**
   * Set data in both memory and localStorage cache
   */
  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    // Store in memory cache
    this.memoryCache.set(key, entry);

    // Store in localStorage
    try {
      localStorage.setItem(key, JSON.stringify(entry));
      console.log(`[CACHE SET] ${key} (TTL: ${ttl / 1000}s)`);
    } catch (error) {
      console.error('[CACHE ERROR] Failed to save to localStorage:', error);
    }
  }

  /**
   * Check if cache entry is expired
   */
  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  /**
   * Invalidate (clear) specific cache entry
   */
  invalidate(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(key);
    console.log(`[CACHE INVALIDATE] ${key}`);
  }

  /**
   * Invalidate cache entries matching a pattern
   */
  invalidatePattern(pattern: string): void {
    // Clear from memory cache
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    // Clear from localStorage
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    }
    console.log(`[CACHE INVALIDATE PATTERN] ${pattern}`);
  }

  /**
   * Clear all cache
   */
  clearAll(): void {
    this.memoryCache.clear();
    localStorage.clear();
    console.log('[CACHE CLEAR ALL]');
  }

  /**
   * Get TTL for specific data type
   */
  getTTL(type: 'players' | 'games' | 'stats' | 'topPlayers' | 'default'): number {
    switch (type) {
      case 'players':
        return this.PLAYERS_TTL;
      case 'games':
        return this.GAMES_TTL;
      case 'stats':
        return this.STATS_TTL;
      case 'topPlayers':
        return this.TOP_PLAYERS_TTL;
      default:
        return this.DEFAULT_TTL;
    }
  }
}

// Export singleton instance
export const cache = new CacheManager();

// Cache key generators for consistency
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

  ratings: (gameId: string) => `ratings:game:${gameId}`,
};
