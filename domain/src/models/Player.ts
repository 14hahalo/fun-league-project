import { Position } from "../enums/Position";

export enum PlayerRole {
  ADMIN = "ADMIN",
  PLAYER = "PLAYER"
}

export interface PlayerBadges {
  Bitiriş?: string;
  Şut?: string;
  'Oyun Kurma'?: string;
  Savunma?: string;
  Ribaund?: string;
  Genel?: string;
}

export interface Player {
  id: string;
  nickname: string; // "HCT", "İlkerGang", "Cano" - Used for login
  password: string; // Hashed password
  role: PlayerRole; // ADMIN or PLAYER
  needsPasswordChange: boolean; // True if user needs to change default password
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number; // Height in cm
  badges?: PlayerBadges; // Player's selected badges (one per category)
  isActive: boolean;
  refreshToken?: string; // For JWT refresh token management
  createdAt: Date;
  updatedAt: Date;
}

// Default password for new players
export const DEFAULT_PLAYER_PASSWORD = "player123";