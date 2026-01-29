export const TeamType = {
  TEAM_A: "TEAM_A",
  TEAM_B: "TEAM_B"
} as const;

export type TeamType = typeof TeamType[keyof typeof TeamType];

export const GameStatus = {
  SCHEDULED: "SCHEDULED",
  IN_PROGRESS: "IN_PROGRESS",
  COMPLETED: "COMPLETED",
  CANCELLED: "CANCELLED"
} as const;

export type GameStatus = typeof GameStatus[keyof typeof GameStatus];

export interface PlayerStats {
  id: string;
  gameId: string;
  playerId: string;
  teamType: TeamType;

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

  createdAt: Date;
  updatedAt: Date;
}

export interface TeamStats {
  id: string;
  gameId: string;
  teamType: TeamType;

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

  createdAt: Date;
  updatedAt: Date;
}

export interface Team {
  id: string;
  gameId: string;
  teamType: TeamType;
  playerIds: string[];
  teamName?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Game {
  id: string;
  gameNumber: string;
  date: Date;
  status: GameStatus;
  teamAScore: number;
  teamBScore: number;
  teamAId?: string;
  teamBId?: string;
  teamAStatsId?: string;
  teamBStatsId?: string;
  teamSize?: number;
  notes?: string;
  aiAnalysis?: string;
  seasonId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerStatsDto {
  gameId: string;
  playerId: string;
  teamType: TeamType;
  twoPointAttempts: number;
  twoPointMade: number;
  threePointAttempts: number;
  threePointMade: number;
  defensiveRebounds: number;
  offensiveRebounds: number;
  assists: number;
}

export interface UpdatePlayerStatsDto {
  twoPointAttempts?: number;
  twoPointMade?: number;
  threePointAttempts?: number;
  threePointMade?: number;
  defensiveRebounds?: number;
  offensiveRebounds?: number;
  assists?: number;
}

export interface CreateTeamDto {
  gameId: string;
  teamType: TeamType;
  playerIds: string[];
  teamName?: string;
}

export interface UpdateTeamDto {
  playerIds?: string[];
  teamName?: string;
}

export interface PlayerStatsWithPlayerInfo extends PlayerStats {
  playerNickname?: string;
  playerName?: string;
  playerJerseyNumber?: number;
}

export interface Video {
  id: string;
  gameId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  playerIds: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateVideoDto {
  gameId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  playerIds: string[];
}

export interface UpdateVideoDto {
  title?: string;
  description?: string;
  youtubeUrl?: string;
  playerIds?: string[];
}
