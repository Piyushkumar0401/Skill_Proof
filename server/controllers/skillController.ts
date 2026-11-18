import type { NextFunction, Response } from 'express';
import { AssessmentAttempt } from '../models/AssessmentAttempt.ts';
import { SkillHistory } from '../models/SkillHistory.ts';
import {
  ALL_CATEGORIES,
  CATEGORY_TO_FIELD,
  computeSkillBreakdown,
} from '../services/scoringService.ts';
import { AppError } from '../utils/AppError.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export async function getSkillAnalytics(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const completedAttempts = await AssessmentAttempt.find({
      userId: req.user._id,
      status: 'completed',
    })
      .sort({ completedAt: -1 })
      .lean();

    const totalAssessments = completedAttempts.length;
    const averageScore =
      totalAssessments > 0
        ? Math.round(
            completedAttempts.reduce((sum, a) => sum + a.percentageScore, 0) /
              totalAssessments
          )
        : 0;
    const passedCount = completedAttempts.filter((a) => a.passed).length;

    const skillBreakdown = computeSkillBreakdown(completedAttempts as never);
    const strongestSkills = skillBreakdown.filter((s) => s.averageScore >= 70).slice(0, 3);
    const weakestSkills = [...skillBreakdown]
      .sort((a, b) => a.averageScore - b.averageScore)
      .slice(0, 3);

    const scores = req.user.skillScores;
    const categoryScores = ALL_CATEGORIES.map((category) => {
      const field = CATEGORY_TO_FIELD[category];
      const catAttempts = completedAttempts.filter((a) => a.category === category);
      return {
        category,
        key: field,
        score: scores[field] || 0,
        attempts: catAttempts.length,
      };
    });

    // Gather latest real AI recommendations from completed attempts
    const latestWithAi = completedAttempts.find((a) => a.aiEvaluation?.improvementRecommendations?.length);
    const aiSuggestions = latestWithAi?.aiEvaluation?.improvementRecommendations || [];
    const aiWeaknesses = latestWithAi?.aiEvaluation?.weaknesses || [];

    res.json({
      overallScore: scores.overallScore,
      assessedCategoriesCount: scores.assessedCategoriesCount,
      totalCategoriesCount: ALL_CATEGORIES.length,
      totalAssessments,
      passedCount,
      averageScore,
      categoryScores,
      skillBreakdown,
      strongestSkills,
      weakestSkills,
      recentAttempts: completedAttempts.slice(0, 6).map((a) => ({
        id: a._id.toString(),
        assessmentId: a.assessmentId.toString(),
        assessmentTitle: a.assessmentTitle,
        skill: a.skill,
        category: a.category,
        difficulty: a.difficulty,
        percentageScore: a.percentageScore,
        passed: a.passed,
        timeSpentSeconds: a.timeSpentSeconds,
        completedAt: a.completedAt,
        hasAiEvaluation: Boolean(a.aiEvaluation?.summary),
      })),
      aiSuggestions,
      aiWeaknesses,
      scoringFormula: {
        description:
          'Category scores combine verified assessment percentages multiplied by difficulty depth (Beginner 0.85x, Intermediate 1.00x, Advanced 1.12x, capped at 100) using recency weighting (1 + 0.15 * attemptIndex). Overall SkillProof Score is the arithmetic mean across all assessed categories.',
        difficultyWeights: {
          Beginner: 0.85,
          Intermediate: 1.0,
          Advanced: 1.12,
        },
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function getSkillHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const history = await SkillHistory.find({ userId: req.user._id })
      .sort({ recordedAt: 1 })
      .lean();

    res.json({
      history: history.map((h) => ({
        id: h._id.toString(),
        attemptId: h.attemptId.toString(),
        skill: h.skill,
        category: h.category,
        difficulty: h.difficulty,
        assessmentScore: h.assessmentScore,
        overallScoreAfter: h.overallScoreAfter,
        categoryScoresSnapshot: h.categoryScoresSnapshot,
        recordedAt: h.recordedAt,
      })),
    });
  } catch (err) {
    next(err);
  }
}
