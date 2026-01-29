export interface UpdateSeasonDto {
  name?: string;
  beginDate?: Date;
  finishDate?: Date | null;
  isActive?: boolean;
}
