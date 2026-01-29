import { GameStatus } from "../../enums/GameStatus";

export interface UpdateGameDto {
  gameNumber?: string;
  date?: Date;
  status?: GameStatus;
  teamAScore?: number;
  teamBScore?: number;
  teamAId?: string;
  teamBId?: string;
  teamAStatsId?: string;
  teamBStatsId?: string;
  teamSize?: number;
  notes?: string;
  seasonId?: string;
}
