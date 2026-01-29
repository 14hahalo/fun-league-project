export interface CreateSeasonDto {
  name: string;
  beginDate: Date;
  finishDate?: Date | null;
  isActive?: boolean;
}
