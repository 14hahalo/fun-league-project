export interface Team {
  id: string;
  gameId: string; 
  teamType: "TEAM_A" | "TEAM_B";
  playerIds: string[]; 
  teamName?: string;  
  createdAt: Date;
  updatedAt: Date;
}
