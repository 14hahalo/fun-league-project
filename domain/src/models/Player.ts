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
  nickname: string;
  password: string;
  role: PlayerRole;
  needsPasswordChange: boolean;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number; 
  badges?: PlayerBadges; 
  isActive: boolean;
  refreshToken?: string; 
  createdAt: Date;
  updatedAt: Date;
}

export const DEFAULT_PLAYER_PASSWORD = process.env.PLAYERPASS ;