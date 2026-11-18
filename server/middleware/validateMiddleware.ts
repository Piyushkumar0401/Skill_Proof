import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodType } from 'zod';
import { AppError } from '../utils/AppError.ts';

export function validateBody<T>(schema: ZodType<T>) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const firstIssue = err.issues[0];
        next(
          new AppError(
            firstIssue?.message || 'Invalid request payload.',
            400,
            'VALIDATION_ERROR',
            err.issues.map((i) => ({ path: i.path.join('.'), message: i.message }))
          )
        );
        return;
      }
      next(err);
    }
  };
}
