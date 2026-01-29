export interface Season {
  id: string;
  name: string;
  beginDate: Date;
  finishDate: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateSeasonDto {
  name: string;
  beginDate: Date;
  finishDate?: Date | null;
  isActive?: boolean;
}

export interface UpdateSeasonDto {
  name?: string;
  beginDate?: Date;
  finishDate?: Date | null;
  isActive?: boolean;
}
