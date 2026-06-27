import { PlayerBadges, PlayerRole } from "../../models/Player";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  needsPasswordChange: boolean;
  player: {
    id: string;
    nickname: string;
    email?: string;
    role: PlayerRole;
    needsPasswordChange?: boolean;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    jerseyNumber?: number;
    position?: string;
    height?: number;
    badges?: PlayerBadges;
  };
}
