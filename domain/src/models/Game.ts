import { GameStatus } from "../enums/GameStatus";

export interface Game {
  id: string;
  gameNumber: string; // "MW#01", "MW#02" vb.
  date: Date;
  status: GameStatus;
  teamAScore: number;
  teamBScore: number;
  teamAId?: string; 
  teamBId?: string; 
  teamAStatsId?: string; 
  teamBStatsId?: string; 
  teamSize?: number; // 3v3, 4v4, or 5v5
  notes?: string;
  aiAnalysis?: string; 
  seasonId?: string; 
  createdAt: Date;
  updatedAt: Date;
}