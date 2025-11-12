export interface PlayerRatingAverageDTO {
  playerId: string;
  playerName: string;
  averageRating: number;
  totalVotes: number;
  isMVP: boolean; // GÖNÜLLERİN MVPsi
}

export interface GameRatingsDTO {
  gameId: string;
  ratings: PlayerRatingAverageDTO[];
  mvp: PlayerRatingAverageDTO | null;
  totalVoters: number;
  totalPlayers: number;
}
