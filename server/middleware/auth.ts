import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { SafeUser, UserRecord, UserRole } from '../../src/shared/types.js';
import { db } from '../db/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'skytrace-dev-secret-key-2026';

export interface AuthTokenPayload {
  userId: string;
  email: string;
  role: UserRole;
  fullName: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthTokenPayload;
}

export class HttpError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function toSafeUser(user: UserRecord): SafeUser {
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role,
    active: user.active,
    createdAt: user.createdAt,
  };
}

export function signAuthToken(user: UserRecord): string {
  const payload: AuthTokenPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    fullName: user.fullName,
  };
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
}

export function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookieToken = req.cookies?.skytrace_token;
  if (typeof cookieToken === 'string' && cookieToken.length > 0) {
    return cookieToken;
  }
  return null;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const token = extractToken(req);
    if (!token) {
      throw new HttpError(401, 'Authentication required. Please sign in.');
    }
    const decoded = jwt.verify(token, JWT_SECRET) as AuthTokenPayload;
    const dbUser = await db.findOne(
      'users',
      (u) => u.id === decoded.userId,
      { id: decoded.userId }
    );
    if (!dbUser || !dbUser.active) {
      throw new HttpError(401, 'Account is inactive or no longer exists.');
    }
    req.user = {
      userId: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      fullName: dbUser.fullName,
    };
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
    } else {
      next(new HttpError(401, 'Invalid or expired session token.'));
    }
  }
}

export function requireRole(...roles: UserRole[]) {
  return (req: AuthenticatedRequest, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'Authentication required.'));
      return;
    }
    if (!roles.includes(req.user.role)) {
      next(new HttpError(403, `Access denied. Required role: ${roles.join(' or ')}.`));
      return;
    }
    next();
  };
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof HttpError) {
    res.status(err.status).json({ success: false, error: err.message });
    return;
  }
  const message = err instanceof Error ? err.message : 'Internal server error';
  console.error('[SKYTRACE API ERROR]', err);
  res.status(500).json({ success: false, error: message });
}
