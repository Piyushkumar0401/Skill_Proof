import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.ts';
import { User, type IUser } from '../models/User.ts';
import { AppError } from '../utils/AppError.ts';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

interface JwtPayload {
  sub: string;
  email: string;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AppError('Authentication token is required.', 401, 'UNAUTHORIZED');
    }

    const token = authHeader.slice(7).trim();
    if (!token) {
      throw new AppError('Authentication token is required.', 401, 'UNAUTHORIZED');
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.jwtSecret) as JwtPayload;
    } catch {
      throw new AppError('Invalid or expired authentication token.', 401, 'INVALID_TOKEN');
    }

    const user = await User.findById(decoded.sub);
    if (!user) {
      throw new AppError('User account no longer exists.', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}
