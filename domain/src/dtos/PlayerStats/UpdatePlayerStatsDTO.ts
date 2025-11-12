export interface UpdatePlayerStatsDto {
  // Shooting Statistics
  twoPointAttempts?: number;
  twoPointMade?: number;

  threePointAttempts?: number;
  threePointMade?: number;

  // Rebounds
  defensiveRebounds?: number;
  offensiveRebounds?: number;

  // Other Stats
  assists?: number;
}
