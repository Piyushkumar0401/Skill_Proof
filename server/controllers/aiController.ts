import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { AssessmentAttempt } from '../models/AssessmentAttempt.ts';
import { Question } from '../models/Question.ts';
import { computeSkillBreakdown } from '../services/scoringService.ts';
import {
  analyzeAssessmentAttempt,
  chatWithLearningAssistant,
  generatePersonalizedRoadmap,
} from '../services/geminiService.ts';
import { AppError } from '../utils/AppError.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export const analyzeAttemptSchema = z.object({
  attemptId: z.string().min(1, 'attemptId is required.'),
  forceRefresh: z.boolean().optional(),
});

export const roadmapSchema = z.object({
  focusGoal: z.string().trim().max(200).optional(),
});

export const chatSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().trim().min(1).max(4000),
      })
    )
    .min(1, 'At least one message is required.'),
});

export async function analyzeAttempt(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { attemptId, forceRefresh } = req.body as z.infer<typeof analyzeAttemptSchema>;

    const attempt = await AssessmentAttempt.findOne({
      _id: attemptId,
      userId: req.user._id,
      status: 'completed',
    });

    if (!attempt) {
      throw new AppError('Completed assessment attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
    }

    if (attempt.aiEvaluation && !forceRefresh) {
      res.json({ evaluation: attempt.aiEvaluation, cached: true });
      return;
    }

    const questions = await Question.find({ _id: { $in: attempt.questionIds } });
    const evaluation = await analyzeAssessmentAttempt(attempt, questions);

    attempt.aiEvaluation = evaluation;
    await attempt.save();

    res.json({ evaluation, cached: false });
  } catch (err) {
    next(err);
  }
}

export async function generateRoadmap(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { focusGoal } = req.body as z.infer<typeof roadmapSchema>;

    const completedAttempts = await AssessmentAttempt.find({
      userId: req.user._id,
      status: 'completed',
    }).sort({ completedAt: -1 });

    const breakdown = computeSkillBreakdown(completedAttempts);
    const roadmap = await generatePersonalizedRoadmap(
      req.user,
      breakdown,
      completedAttempts,
      focusGoal
    );

    res.json({ roadmap });
  } catch (err) {
    next(err);
  }
}

export async function chatAssistant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { messages } = req.body as z.infer<typeof chatSchema>;

    const completedAttempts = await AssessmentAttempt.find({
      userId: req.user._id,
      status: 'completed',
    }).sort({ completedAt: -1 });

    const breakdown = computeSkillBreakdown(completedAttempts);
    const result = await chatWithLearningAssistant(
      req.user,
      breakdown,
      completedAttempts,
      messages
    );

    res.json(result);
  } catch (err) {
    next(err);
  }
}
