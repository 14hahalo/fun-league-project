export const Position = {
  POINT_GUARD: 'Point Guard',
  SHOOTING_GUARD: 'Shooting Guard',
  SMALL_FORWARD: 'Small Forward',
  POWER_FORWARD: 'Power Forward',
  CENTER: 'Center'
} as const;

export type Position = typeof Position[keyof typeof Position];

export interface PlayerBadges {
  Bitiriş?: string;
  Şut?: string;
  'Oyun Kurma'?: string;
  Savunma?: string;
  Ribaund?: string;
  Genel?: string;
}

export interface Badge {
  name: string;
  category: string;
  description: string;
}

export const PlayerRole = {
  ADMIN: "ADMIN",
  PLAYER: "PLAYER"
} as const;

export type PlayerRole = typeof PlayerRole[keyof typeof PlayerRole];

export interface Player {
  id: string;
  nickname: string;
  role?: PlayerRole;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number;
  weight?: number;
  badges?: PlayerBadges;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePlayerDto {
  nickname: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number;
  weight?: number;
  badges?: PlayerBadges;
}

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