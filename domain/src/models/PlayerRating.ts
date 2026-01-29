export interface PlayerRating {
  id: string;
  gameId: string;
  voterId: string; 
  ratedPlayerId: string; 
  rank: number; 
  seasonId?: string; 
  createdAt: Date;
}
