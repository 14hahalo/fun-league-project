import jwt, { Secret } from 'jsonwebtoken';
import { PlayerRole } from '../models/Player';

export interface JwtPayload {
  userId: string;
  email: string;
  role: PlayerRole;
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET bulunamadı');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET bulunamadı');
}

const ACCESS_TOKEN_SECRET: Secret = process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET: Secret = process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRATION = process.env.JWT_ACCESS_EXPIRATION || '7d';
const REFRESH_TOKEN_EXPIRATION = process.env.JWT_REFRESH_EXPIRATION || '1d';

export const generateAccessToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    ACCESS_TOKEN_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRATION } as any
  );
};

export const generateRefreshToken = (payload: JwtPayload): string => {
  return jwt.sign(
    { userId: payload.userId, email: payload.email, role: payload.role },
    REFRESH_TOKEN_SECRET,
    { expiresIn: REFRESH_TOKEN_EXPIRATION } as any
  );
};

export const verifyAccessToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, ACCESS_TOKEN_SECRET);

    if (typeof decoded === 'string') {
      throw new Error('Token formatı hatalı');
    }

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as PlayerRole,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token süresi doldu');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Geçersiz access token');
    }
    throw new Error('Access token onayı esnasında hata oluştu');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    if (typeof decoded === 'string') {
      throw new Error('Geçersiz token formatı');
    }

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as PlayerRole,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token süresi doldu');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Geçersiz refresh token');
    }
    throw new Error('Refresh token onayı esnasında hata oluştu');
  }
};
