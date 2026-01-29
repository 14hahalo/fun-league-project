export interface Video {
  id: string;
  gameId: string;
  title: string;
  description?: string;
  youtubeUrl: string;
  playerIds: string[]; 
  createdAt: Date;
  updatedAt: Date;
}
