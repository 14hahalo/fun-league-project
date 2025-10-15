export enum Position {
  POINT_GUARD = 'Point Guard',
  SHOOTING_GUARD = 'Shooting Guard',
  SMALL_FORWARD = 'Small Forward',
  POWER_FORWARD = 'Power Forward',
  CENTER = 'Center'
}

export interface Player {
  id: string;
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
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

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

export interface UpdatePlayerDto {
  nickname?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number;
  weight?: number;
  isActive?: boolean;
}