import { GameStatus } from "../enums/GameStatus";

export interface Game {
  id: string;
  gameNumber: string; // "MW#01", "MW#02" vb.
  date: Date;
  status: GameStatus;
  teamAScore: number;
  teamBScore: number;

  // Team references
  teamAId?: string; // Reference to Team document for Team A
  teamBId?: string; // Reference to Team document for Team B

  // Stats references
  teamAStatsId?: string; // Reference to TeamStats document for Team A
  teamBStatsId?: string; // Reference to TeamStats document for Team B

  teamSize?: number; // 3v3, 4v4, or 5v5
  notes?: string; // Ek notlar
  aiAnalysis?: string; // AI-generated match analysis
  createdAt: Date;
  updatedAt: Date;
}