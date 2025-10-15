import { Position } from "../../enums/Position";

export interface CreatePlayerDto {
  nickname: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number;
  weight?: number;
}