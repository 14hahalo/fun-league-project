import { Position } from "../enums/Position";

export interface Player {
  id: string;
  nickname: string; // "HCT", "İlkerGang", "Cano"
  firstName?: string;
  lastName?: string;
  email?: string;
  phoneNumber?: string;
  photoUrl?: string;
  jerseyNumber?: number;
  position?: Position;
  height?: number; // cm cinsinden
  weight?: number; // kg cinsinden
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}