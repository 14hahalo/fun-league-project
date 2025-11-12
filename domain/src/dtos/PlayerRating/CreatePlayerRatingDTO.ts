export interface CreatePlayerRatingDTO {
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number; // Rank: 1 = best, 2 = second best, etc.
}
