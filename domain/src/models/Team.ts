export interface Team {
  id: string;
  gameId: string; // Reference to Game
  teamType: "TEAM_A" | "TEAM_B";
  playerIds: string[]; // Array of player IDs in this team
  teamName?: string; // Optional team name for the game
  createdAt: Date;
  updatedAt: Date;
}
