import type { NextFunction, Response } from 'express';
import { z } from 'zod';
import { Assessment } from '../models/Assessment.ts';
import { Question } from '../models/Question.ts';
import { AssessmentAttempt } from '../models/AssessmentAttempt.ts';
import { evaluateAnswer } from '../services/evaluationService.ts';
import { recalculateAndRecordSkillScores } from '../services/scoringService.ts';
import { generateSupplementalQuestions } from '../services/geminiService.ts';
import { AppError } from '../utils/AppError.ts';
import type { AuthenticatedRequest } from '../middleware/authMiddleware.ts';

export const submitAssessmentSchema = z.object({
  attemptId: z.string().min(1, 'attemptId is required.'),
  answers: z.array(
    z.object({
      questionId: z.string().min(1),
      selectedOptionIndex: z.number().int().nullable().optional(),
      submittedCode: z.string().optional(),
    })
  ),
});

export async function listAssessments(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { skill, difficulty, category, search } = req.query;
    const filter: Record<string, unknown> = {};

    if (typeof skill === 'string' && skill && skill !== 'All') {
      filter.skill = skill;
    }
    if (typeof difficulty === 'string' && difficulty && difficulty !== 'All') {
      filter.difficulty = difficulty;
    }
    if (typeof category === 'string' && category && category !== 'All') {
      filter.category = category;
    }
    if (typeof search === 'string' && search.trim()) {
      const regex = new RegExp(search.trim(), 'i');
      filter.$or = [{ title: regex }, { skill: regex }, { description: regex }, { topics: regex }];
    }

    const assessments = await Assessment.find(filter)
      .sort({ skill: 1, difficulty: 1 })
      .lean();

    // Attach user's completion stats per assessment
    const userAttempts = req.user
      ? await AssessmentAttempt.find({
          userId: req.user._id,
          status: 'completed',
        })
          .select('assessmentId percentageScore passed completedAt')
          .lean()
      : [];

    const statsMap = new Map<
      string,
      { attempts: number; bestScore: number; passed: boolean; lastAttemptId?: string }
    >();

    for (const att of userAttempts) {
      const key = att.assessmentId.toString();
      const prev = statsMap.get(key) || { attempts: 0, bestScore: 0, passed: false };
      statsMap.set(key, {
        attempts: prev.attempts + 1,
        bestScore: Math.max(prev.bestScore, att.percentageScore),
        passed: prev.passed || att.passed,
        lastAttemptId: att._id.toString(),
      });
    }

    // Count MCQ vs Coding questions per assessment
    const questions = await Question.find({
      assessmentId: { $in: assessments.map((a) => a._id) },
    })
      .select('assessmentId type')
      .lean();

    const typeCounts = new Map<string, { mcq: number; coding: number }>();
    for (const q of questions) {
      const key = q.assessmentId.toString();
      const curr = typeCounts.get(key) || { mcq: 0, coding: 0 };
      if (q.type === 'mcq') curr.mcq += 1;
      else curr.coding += 1;
      typeCounts.set(key, curr);
    }

    const enriched = assessments.map((a) => {
      const id = a._id.toString();
      const userStats = statsMap.get(id) || { attempts: 0, bestScore: 0, passed: false };
      const mix = typeCounts.get(id) || { mcq: 0, coding: 0 };
      return {
        ...a,
        id,
        questionMix: mix,
        userStats,
      };
    });

    res.json({ assessments: enriched });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await Assessment.findById(req.params.id).lean();
    if (!assessment) {
      throw new AppError('Assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    }

    const questions = await Question.find({ assessmentId: assessment._id })
      .select('type language points isAiSupplemented')
      .lean();

    const recentAttempts = req.user
      ? await AssessmentAttempt.find({
          userId: req.user._id,
          assessmentId: assessment._id,
          status: 'completed',
        })
          .sort({ completedAt: -1 })
          .limit(5)
          .select('percentageScore rawScore maxScore passed timeSpentSeconds completedAt')
          .lean()
      : [];

    res.json({
      assessment: {
        ...assessment,
        id: assessment._id.toString(),
      },
      questionBreakdown: {
        total: questions.length,
        mcqCount: questions.filter((q) => q.type === 'mcq').length,
        codingCount: questions.filter((q) => q.type === 'coding').length,
        aiSupplementedCount: questions.filter((q) => q.isAiSupplemented).length,
      },
      recentAttempts,
    });
  } catch (err) {
    next(err);
  }
}

export async function startAssessment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      throw new AppError('Assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    }

    const questions = await Question.find({ assessmentId: assessment._id }).sort({
      type: 1,
      createdAt: 1,
    });

    if (questions.length === 0) {
      throw new AppError('This assessment has no questions yet.', 400, 'NO_QUESTIONS');
    }

    const startedAt = new Date();
    const expiresAt = new Date(startedAt.getTime() + assessment.durationMinutes * 60 * 1000);

    const attempt = await AssessmentAttempt.create({
      userId: req.user._id,
      assessmentId: assessment._id,
      assessmentTitle: assessment.title,
      skill: assessment.skill,
      category: assessment.category,
      difficulty: assessment.difficulty,
      status: 'in_progress',
      startedAt,
      expiresAt,
      questionIds: questions.map((q) => q._id),
      maxScore: questions.reduce((sum, q) => sum + q.points, 0),
    });

    // Sanitize questions: NEVER expose correctOptionIndex or rubricKeywords during attempt
    const sanitizedQuestions = questions.map((q) => ({
      id: q._id.toString(),
      type: q.type,
      prompt: q.prompt,
      codeSnippet: q.codeSnippet,
      options: q.options,
      starterCode: q.starterCode,
      language: q.language,
      points: q.points,
      isAiSupplemented: q.isAiSupplemented,
      sampleTests:
        q.type === 'coding' && q.testCases
          ? q.testCases.slice(0, 2).map((tc) => tc.description)
          : undefined,
    }));

    res.status(201).json({
      attempt: {
        id: attempt._id.toString(),
        assessmentId: assessment._id.toString(),
        assessmentTitle: assessment.title,
        skill: assessment.skill,
        category: assessment.category,
        difficulty: assessment.difficulty,
        durationMinutes: assessment.durationMinutes,
        passingScore: assessment.passingScore,
        startedAt: attempt.startedAt,
        expiresAt: attempt.expiresAt,
      },
      questions: sanitizedQuestions,
    });
  } catch (err) {
    next(err);
  }
}

export async function submitAssessment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { attemptId, answers } = req.body as z.infer<typeof submitAssessmentSchema>;

    const attempt = await AssessmentAttempt.findOne({
      _id: attemptId,
      userId: req.user._id,
      assessmentId: req.params.id,
    });

    if (!attempt) {
      throw new AppError('Assessment attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
    }

    if (attempt.status === 'completed') {
      throw new AppError('This assessment attempt has already been submitted.', 409, 'ALREADY_SUBMITTED');
    }

    const assessment = await Assessment.findById(attempt.assessmentId);
    if (!assessment) {
      throw new AppError('Parent assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    }

    const questions = await Question.find({ _id: { $in: attempt.questionIds } });
    const submissionMap = new Map<
      string,
      { selectedOptionIndex?: number | null; submittedCode?: string }
    >();
    for (const ans of answers) {
      submissionMap.set(ans.questionId, ans);
    }

    const evaluatedAnswers = questions.map((question) => {
      const sub = submissionMap.get(question._id.toString()) || {};
      return evaluateAnswer(question, sub);
    });

    const rawScore = evaluatedAnswers.reduce((sum, a) => sum + a.earnedPoints, 0);
    const maxScore = evaluatedAnswers.reduce((sum, a) => sum + a.maxPoints, 0);
    const percentageScore = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
    const passed = percentageScore >= assessment.passingScore;

    const completedAt = new Date();
    const rawElapsed = Math.round(
      (completedAt.getTime() - new Date(attempt.startedAt).getTime()) / 1000
    );
    const maxAllowedSeconds = assessment.durationMinutes * 60 + 30;
    const timeSpentSeconds = Math.max(1, Math.min(rawElapsed, maxAllowedSeconds));

    attempt.answers = evaluatedAnswers;
    attempt.rawScore = rawScore;
    attempt.maxScore = maxScore;
    attempt.percentageScore = percentageScore;
    attempt.passed = passed;
    attempt.status = 'completed';
    attempt.completedAt = completedAt;
    attempt.timeSpentSeconds = timeSpentSeconds;

    await attempt.save();

    const updatedSkillScores = await recalculateAndRecordSkillScores(
      req.user._id,
      attempt
    );

    res.json({
      attemptId: attempt._id.toString(),
      rawScore,
      maxScore,
      percentageScore,
      passed,
      timeSpentSeconds,
      updatedSkillScores,
    });
  } catch (err) {
    next(err);
  }
}

export async function getAssessmentHistory(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const { skill, category } = req.query;
    const filter: Record<string, unknown> = {
      userId: req.user._id,
      status: 'completed',
    };

    if (typeof skill === 'string' && skill && skill !== 'All') {
      filter.skill = skill;
    }
    if (typeof category === 'string' && category && category !== 'All') {
      filter.category = category;
    }

    const attempts = await AssessmentAttempt.find(filter)
      .sort({ completedAt: -1 })
      .select(
        'assessmentId assessmentTitle skill category difficulty rawScore maxScore percentageScore passed timeSpentSeconds completedAt aiEvaluation.proficiencyLevel aiEvaluation.summary'
      )
      .lean();

    res.json({
      history: attempts.map((a) => ({
        ...a,
        id: a._id.toString(),
        hasAiEvaluation: Boolean(a.aiEvaluation?.summary),
      })),
    });
  } catch (err) {
    next(err);
  }
}

export async function getAttemptById(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    if (!req.user) {
      throw new AppError('Authentication required.', 401, 'UNAUTHORIZED');
    }

    const attempt = await AssessmentAttempt.findOne({
      _id: req.params.attemptId,
      userId: req.user._id,
    }).lean();

    if (!attempt) {
      throw new AppError('Assessment attempt not found.', 404, 'ATTEMPT_NOT_FOUND');
    }

    const questions = await Question.find({
      _id: { $in: attempt.questionIds },
    }).lean();

    const questionMap = new Map(questions.map((q) => [q._id.toString(), q]));

    const detailedAnswers = attempt.answers.map((ans) => {
      const q = questionMap.get(ans.questionId.toString());
      return {
        ...ans,
        questionId: ans.questionId.toString(),
        prompt: q?.prompt || 'Question unavailable',
        codeSnippet: q?.codeSnippet,
        options: q?.options,
        correctOptionIndex: q?.correctOptionIndex,
        language: q?.language,
        explanation: q?.explanation || '',
      };
    });

    res.json({
      attempt: {
        ...attempt,
        id: attempt._id.toString(),
        assessmentId: attempt.assessmentId.toString(),
        answers: detailedAnswers,
      },
    });
  } catch (err) {
    next(err);
  }
}

export async function supplementAssessment(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const assessment = await Assessment.findById(req.params.id);
    if (!assessment) {
      throw new AppError('Assessment not found.', 404, 'ASSESSMENT_NOT_FOUND');
    }

    const existing = await Question.find({ assessmentId: assessment._id })
      .select('prompt')
      .lean();

    const generated = await generateSupplementalQuestions(
      assessment.skill,
      assessment.category,
      assessment.difficulty,
      existing.map((q) => q.prompt)
    );

    if (generated.length === 0) {
      throw new AppError('Could not generate supplemental questions.', 502, 'AI_GENERATION_EMPTY');
    }

    await Question.insertMany(
      generated.map((q) => ({
        assessmentId: assessment._id,
        skill: assessment.skill,
        category: assessment.category,
        difficulty: assessment.difficulty,
        type: q.type,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        points: q.points,
        isAiSupplemented: true,
      }))
    );

    assessment.questionCount += generated.length;
    assessment.totalPoints += generated.reduce((s, q) => s + q.points, 0);
    await assessment.save();

    res.status(201).json({
      addedCount: generated.length,
      assessment: {
        id: assessment._id.toString(),
        questionCount: assessment.questionCount,
        totalPoints: assessment.totalPoints,
      },
    });
  } catch (err) {
    next(err);
  }
}
