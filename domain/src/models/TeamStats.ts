export interface TeamStats {
  id: string;
  gameId: string; // Reference to Game
  teamType: "TEAM_A" | "TEAM_B";

  // Aggregated Shooting Statistics
  twoPointAttempts: number; // Sum of all players' 2-point attempts
  twoPointMade: number; // Sum of all players' 2-point made
  twoPointPercentage: number; // Calculated: (twoPointMade / twoPointAttempts) * 100

  threePointAttempts: number; // Sum of all players' 3-point attempts
  threePointMade: number; // Sum of all players' 3-point made
  threePointPercentage: number; // Calculated: (threePointMade / threePointAttempts) * 100

  // Aggregated Rebounds
  defensiveRebounds: number; // Sum of all players' defensive rebounds
  offensiveRebounds: number; // Sum of all players' offensive rebounds
  totalRebounds: number; // Calculated: defensiveRebounds + offensiveRebounds

  // Other Aggregated Stats
  assists: number; // Sum of all players' assists
  totalPoints: number; // Calculated: (twoPointMade * 2) + (threePointMade * 3)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
