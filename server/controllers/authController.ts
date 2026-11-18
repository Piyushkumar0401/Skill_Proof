import type { NextFunction, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { env } from '../config/env.ts';
import { User, type IUser } from '../models/User.ts';
import { AppError } from '../utils/AppError.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters.').max(80),
  email: z.string().trim().email('Please provide a valid email address.').toLowerCase(),
  password: z.string().min(8, 'Password must be at least 8 characters.').max(100),
  targetTrack: z.string().trim().min(2).max(80).optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('Please provide a valid email address.').toLowerCase(),
  password: z.string().min(1, 'Password is required.'),
});

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2).max(80).optional(),
  headline: z.string().trim().max(120).optional(),
  targetTrack: z.string().trim().min(2).max(80).optional(),
  experienceLevel: z.enum(['Beginner', 'Intermediate', 'Advanced']).optional(),
  themePreference: z.enum(['dark', 'light']).optional(),
  preferredSkills: z.array(z.string().trim()).max(10).optional(),
});

export const updatePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required.'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters.').max(100),
});

function signToken(user: IUser): string {
  return jwt.sign(
    { sub: user._id.toString(), email: user.email },
    env.jwtSecret,
    { expiresIn: env.jwtExpiresIn as jwt.SignOptions['expiresIn'] }
  );
}

function serializeUser(user: IUser) {
  return {
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    headline: user.headline,
    targetTrack: user.targetTrack,
    experienceLevel: user.experienceLevel,
    themePreference: user.themePreference,
    preferredSkills: user.preferredSkills,
    skillScores: user.skillScores,
    createdAt: user.createdAt,
  };
}

export async function register(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { name, email, password, targetTrack, experienceLevel } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      throw new AppError('An account with this email already exists.', 409, 'EMAIL_EXISTS');
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await User.create({
      name,
      email,
      passwordHash,
      targetTrack: targetTrack || 'Full-Stack Developer',
      experienceLevel: experienceLevel || 'Intermediate',
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function login(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email }).select('+passwordHash');
    if (!user) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
    }

    const token = signToken(user);
    res.json({
      token,
      user: serializeUser(user),
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }
    res.json({ user: serializeUser(req.user) });
  } catch (err) {
    next(err);
  }
}

export async function updateProfile(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const updates = req.body;
    const updated = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!updated) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    res.json({ user: serializeUser(updated) });
  } catch (err) {
    next(err);
  }
}

export async function updatePassword(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.user._id).select('+passwordHash');
    if (!user) {
      throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new AppError('Current password is incorrect.', 400, 'INVALID_PASSWORD');
    }

    user.passwordHash = await bcrypt.hash(newPassword, 12);
    await user.save();

    res.json({ message: 'Password updated successfully.' });
  } catch (err) {
    next(err);
  }
}
