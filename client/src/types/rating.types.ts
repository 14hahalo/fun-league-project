export interface PlayerRating {
  id: string;
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number; 
  createdAt: Date;
}

export interface CreatePlayerRatingDTO {
  gameId: string;
  voterId: string;
  ratedPlayerId: string;
  rank: number; 
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
