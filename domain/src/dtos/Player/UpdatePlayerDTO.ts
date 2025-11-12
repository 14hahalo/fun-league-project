import { Position } from "../../enums/Position";
import { PlayerBadges } from "../../models/Player";

export interface UpdatePlayerDto {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number;
  weight?: number;
  badges?: PlayerBadges;
  isActive?: boolean;
}
