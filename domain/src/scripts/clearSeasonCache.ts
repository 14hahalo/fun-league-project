import { cacheService, CacheKeys } from "../services/cacheService";
async function clearSeasonCache() {
  try {
    await cacheService.invalidate(CacheKeys.allSeasons());
    await cacheService.invalidate(CacheKeys.activeSeason());
    await cacheService.invalidatePattern("season:");
  } catch (error) {
    process.exit(1);
  }
}

clearSeasonCache()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
