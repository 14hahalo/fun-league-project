export interface CreateVideoDto {
  gameId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  playerIds: string[];
}
