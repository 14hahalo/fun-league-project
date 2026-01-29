export interface CreatePlayerRatingDTO {
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number;
  seasonId?: string;
}
