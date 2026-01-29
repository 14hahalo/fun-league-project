export interface TeamStats {
  id: string;
  gameId: string; 
  teamType: "TEAM_A" | "TEAM_B";
  twoPointAttempts: number; 
  twoPointMade: number; 
  twoPointPercentage: number; 
  threePointAttempts: number; 
  threePointMade: number; 
  threePointPercentage: number; 
  defensiveRebounds: number; 
  offensiveRebounds: number; 
  totalRebounds: number; 
  assists: number; 
  totalPoints: number; 
  seasonId?: string; 
  createdAt: Date;
  updatedAt: Date;
}
