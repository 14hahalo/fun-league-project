import { GameStatus } from "../enums/GameStatus";

export interface Game {
  id?: string;
  sportId: string; // Reference to Sport
  gameDate: Date;
  location?: string;
  duration?: number; // in minutes
  status: GameStatus;
  teamAScore?: number;
  teamBScore?: number;
  winnerId?: string; // Team or Player ID
  createdAt: Date;
  updatedAt: Date;
}
