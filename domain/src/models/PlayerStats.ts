export interface PlayerStats {
  id: string;
  gameId: string; // Reference to Game
  playerId: string; // Reference to Player
  teamType: "TEAM_A" | "TEAM_B"; // Which team the player was on

  // Shooting Statistics
  twoPointAttempts: number; // 2-point attempts
  twoPointMade: number; // 2-point made
  twoPointPercentage: number; // Calculated: (twoPointMade / twoPointAttempts) * 100

  threePointAttempts: number; // 3-point attempts
  threePointMade: number; // 3-point made
  threePointPercentage: number; // Calculated: (threePointMade / threePointAttempts) * 100

  // Rebounds
  defensiveRebounds: number;
  offensiveRebounds: number;
  totalRebounds: number; // Calculated: defensiveRebounds + offensiveRebounds

  // Other Stats
  assists: number;
  totalPoints: number; // Calculated: (twoPointMade * 2) + (threePointMade * 3)

  // Metadata
  createdAt: Date;
  updatedAt: Date;
}
