interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number; 
}

class CacheManager {
  private memoryCache: Map<string, CacheEntry<any>> = new Map();

  private readonly DEFAULT_TTL = 5 * 60 * 1000; 
  private readonly PLAYERS_TTL = 10 * 60 * 1000; 
  private readonly GAMES_TTL = 5 * 60 * 1000; 
  private readonly STATS_TTL = 3 * 60 * 1000; 
  private readonly TOP_PLAYERS_TTL = 2 * 60 * 1000; 
  private readonly SEASONS_TTL = 30 * 60 * 1000; 


  get<T>(key: string): T | null {
    const memoryEntry = this.memoryCache.get(key);
    if (memoryEntry && !this.isExpired(memoryEntry)) {
      return memoryEntry.data;
    }

    try {
      const localStorageData = localStorage.getItem(key);
      if (localStorageData) {
        const entry: CacheEntry<T> = JSON.parse(localStorageData);
        if (!this.isExpired(entry)) {
          this.memoryCache.set(key, entry);
          return entry.data;
        } else {
          localStorage.removeItem(key);
        }
      }
    } catch (error) {}

    return null;
  }

  set<T>(key: string, data: T, customTTL?: number): void {
    const ttl = customTTL || this.DEFAULT_TTL;
    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      ttl,
    };

    this.memoryCache.set(key, entry);

    try {
      localStorage.setItem(key, JSON.stringify(entry));
    } catch (error) {}
  }

  private isExpired(entry: CacheEntry<any>): boolean {
    return Date.now() - entry.timestamp > entry.ttl;
  }

  invalidate(key: string): void {
    this.memoryCache.delete(key);
    localStorage.removeItem(key);
  }

  invalidatePattern(pattern: string): void {
    for (const key of this.memoryCache.keys()) {
      if (key.includes(pattern)) {
        this.memoryCache.delete(key);
      }
    }

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes(pattern)) {
        localStorage.removeItem(key);
      }
    }
  }

  clearAll(): void {
    this.memoryCache.clear();
    localStorage.clear();
  }

  getTTL(
    type: "players" | "games" | "stats" | "topPlayers" | "seasons" | "default"
  ): number {
    switch (type) {
      case "players":
        return this.PLAYERS_TTL;
      case "games":
        return this.GAMES_TTL;
      case "stats":
        return this.STATS_TTL;
      case "topPlayers":
        return this.TOP_PLAYERS_TTL;
      case "seasons":
        return this.SEASONS_TTL;
      default:
        return this.DEFAULT_TTL;
    }
  }
}

export const cache = new CacheManager();

export const CacheKeys = {
  allPlayers: () => "players:all",
  activePlayers: () => "players:active",
  player: (id: string) => `player:${id}`,
  allGames: () => "games:all",
  game: (id: string) => `game:${id}`,
  playerStats: (playerId: string) => `stats:player:${playerId}`,
  gameStats: (gameId: string) => `stats:game:${gameId}`,
  bulkPlayerStats: (playerIds: string[]) =>
    `stats:bulk:${playerIds.sort().join(",")}`,
  topPlayers: (daysBack: number) => `stats:topPlayers:${daysBack}`,
  videos: (gameId: string) => `videos:game:${gameId}`,
  playerVideos: (playerId: string) => `videos:player:${playerId}`,
  ratings: (gameId: string) => `ratings:game:${gameId}`,
  allSeasons: () => "seasons:all",
  activeSeason: () => "seasons:active",
  season: (id: string) => `season:${id}`,
};
