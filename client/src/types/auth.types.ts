import type { PlayerBadges } from "./player.types";

export const PlayerRole = {
  ADMIN: "ADMIN",
  PLAYER: "PLAYER"
} as const;

export type PlayerRole = typeof PlayerRole[keyof typeof PlayerRole];

export interface User {
  id: string;
  nickname: string;
  role: PlayerRole;
  needsPasswordChange?: boolean;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?:string;
  height?: number;
  badges?: PlayerBadges;
}

export interface LoginDto {
  nickname: string;
  password: string;
}

export interface ChangePasswordDto {
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  needsPasswordChange: boolean;
  player: User;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (nickname: string, password: string) => Promise<boolean>;
  changePassword: (newPassword: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<void>;
}
