export interface PlayerRating {
  id: string;
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number; // Rank: 1 = best, 2 = second best, etc.
  createdAt: Date;
}

export interface CreatePlayerRatingDTO {
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number; // Rank: 1 = best, 2 = second best, etc.
}

export interface PlayerRatingAverage {
  playerId: string;
  playerName: string;
  averageRating: number;
  totalVotes: number;
  isMVP: boolean;
}

export interface GameRatings {
  gameId: string;
  ratings: PlayerRatingAverage[];
  mvp: PlayerRatingAverage | null;
  totalVoters: number;
  totalPlayers: number;
}
