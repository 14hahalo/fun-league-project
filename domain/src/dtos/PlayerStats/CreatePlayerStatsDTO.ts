export interface CreatePlayerStatsDto {
  gameId: string;
  playerId: string;
  teamType: "TEAM_A" | "TEAM_B";
  seasonId?: string;
  twoPointAttempts: number;
  twoPointMade: number;

  threePointAttempts: number;
  threePointMade: number;
  defensiveRebounds: number;
  offensiveRebounds: number;
  assists: number;
}
