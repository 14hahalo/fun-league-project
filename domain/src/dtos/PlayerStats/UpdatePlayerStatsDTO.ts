export interface UpdatePlayerStatsDto {
  seasonId?: string;
  twoPointAttempts?: number;
  twoPointMade?: number;
  threePointAttempts?: number;
  threePointMade?: number;
  defensiveRebounds?: number;
  offensiveRebounds?: number;
  assists?: number;
}
