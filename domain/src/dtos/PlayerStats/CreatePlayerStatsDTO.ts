export interface CreatePlayerStatsDto {
  gameId: string;
  playerId: string;
  teamType: "TEAM_A" | "TEAM_B";

  // Shooting Statistics
  twoPointAttempts: number;
  twoPointMade: number;

  threePointAttempts: number;
  threePointMade: number;

  // Rebounds
  defensiveRebounds: number;
  offensiveRebounds: number;

  // Other Stats
  assists: number;
}
