export interface PlayerRating {
  id: string;
  gameId: string; // Which match this rating is for
  voterId: string; // Player who is voting
  ratedPlayerId: string; // Player being rated
  rank: number; // Rank (1 = best, 2 = second best, etc.)
  createdAt: Date;
}
