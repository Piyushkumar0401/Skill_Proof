import type { NextFunction, Request, Response } from 'express';
import mongoose from 'mongoose';
import { AppError } from '../utils/AppError.ts';

export function notFoundApiHandler(req: Request, _res: Response, next: NextFunction): void {
  next(new AppError(`API route not found: ${req.method} ${req.originalUrl}`, 404, 'ROUTE_NOT_FOUND'));
}

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
      ...(err.details ? { details: err.details } : {}),
    });
    return;
  }

  if (err instanceof mongoose.Error.CastError) {
    res.status(400).json({
      error: 'Invalid resource identifier format.',
      code: 'INVALID_ID',
    });
    return;
  }

  if (err instanceof mongoose.Error.ValidationError) {
    res.status(400).json({
      error: err.message,
      code: 'SCHEMA_VALIDATION_ERROR',
    });
    return;
  }

  const message =
    err instanceof Error ? err.message : 'An unexpected server error occurred.';
  console.error('[server error]', err);
  res.status(500).json({
    error: message,
    code: 'INTERNAL_SERVER_ERROR',
  });
}
