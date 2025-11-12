import { Position } from "../../enums/Position";

export interface RegisterDto {
  email: string;
  password: string;
  nickname: string;
  firstName?: string;
  lastName?: string;
  jerseyNumber?: number;
  position?: Position;
  photoUrl?: string;
}
