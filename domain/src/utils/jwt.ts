import jwt, { Secret } from 'jsonwebtoken';
import { PlayerRole } from '../models/Player';

export interface JwtPayload {
  userId: string;
  email: string;
  role: PlayerRole;
}

if (!process.env.JWT_ACCESS_SECRET) {
  throw new Error('JWT_ACCESS_SECRET environment variable is not set');
}

if (!process.env.JWT_REFRESH_SECRET) {
  throw new Error('JWT_REFRESH_SECRET environment variable is not set');
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
      throw new Error('Invalid token format');
    }

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as PlayerRole,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Access token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid access token');
    }
    throw new Error('Access token verification failed');
  }
};

export const verifyRefreshToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, REFRESH_TOKEN_SECRET);

    if (typeof decoded === 'string') {
      throw new Error('Invalid token format');
    }

    return {
      userId: decoded.userId as string,
      email: decoded.email as string,
      role: decoded.role as PlayerRole,
    };
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Refresh token expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid refresh token');
    }
    throw new Error('Refresh token verification failed');
  }
};
