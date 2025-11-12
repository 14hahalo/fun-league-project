import { GameStatus } from "../../enums/GameStatus";

export interface CreateGameDto {
  gameNumber: string;
  date: Date;
  status?: GameStatus;
  teamSize?: number;
  notes?: string;
}
