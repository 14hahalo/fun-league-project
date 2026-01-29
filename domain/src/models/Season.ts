export interface Season {
  id: string;
  name: string;
  beginDate: Date;
  finishDate: Date | null; 
  isActive: boolean; 
  createdAt: Date;
  updatedAt: Date;
}
