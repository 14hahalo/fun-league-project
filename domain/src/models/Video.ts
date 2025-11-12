export interface Video {
  id: string;
  gameId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  playerIds: string[]; // Array of player IDs tagged in this video
  createdAt: Date;
  updatedAt: Date;
}
