export interface CreateTeamDto {
  gameId: string;
  teamType: "TEAM_A" | "TEAM_B";
  playerIds: string[];
  teamName?: string;
}
