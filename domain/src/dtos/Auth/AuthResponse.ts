import { PlayerRole } from "../../models/Player";

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  needsPasswordChange: boolean;
  player: {
    id: string;
    nickname: string;
    email?: string;
    role: PlayerRole;
    firstName?: string;
    lastName?: string;
    photoUrl?: string;
    jerseyNumber?: number;
  };
}
