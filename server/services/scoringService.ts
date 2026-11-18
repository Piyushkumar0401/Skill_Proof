import type { Types } from 'mongoose';
import { AssessmentAttempt, type IAssessmentAttempt } from '../models/AssessmentAttempt.ts';
import { SkillHistory } from '../models/SkillHistory.ts';
import { User, type ISkillScores } from '../models/User.ts';
import type { DifficultyLevel, SkillCategory, SkillName } from '../models/Assessment.ts';

export const CATEGORY_TO_FIELD: Record<SkillCategory, keyof Omit<ISkillScores, 'overallScore' | 'assessedCategoriesCount'>> = {
  'Programming Fundamentals': 'programmingFundamentals',
  'Frontend Development': 'frontendDevelopment',
  'Backend Development': 'backendDevelopment',
  'Database Management': 'databaseManagement',
  'Data Structures & Algorithms': 'dataStructuresAlgorithms',
  'Software Engineering Concepts': 'softwareEngineeringConcepts',
};

export const ALL_CATEGORIES: SkillCategory[] = [
  'Programming Fundamentals',
  'Frontend Development',
  'Backend Development',
  'Database Management',
  'Data Structures & Algorithms',
  'Software Engineering Concepts',
];

const DIFFICULTY_WEIGHT: Record<DifficultyLevel, number> = {
  Beginner: 0.85,
  Intermediate: 1.0,
  Advanced: 1.12,
};

/**
 * Transparent SkillProof Scoring Formula:
 * 1. Each completed attempt yields an effective score:
 *      effectiveScore = min(100, round(percentageScore * difficultyMultiplier))
 *    where Beginner = 0.85, Intermediate = 1.00, Advanced = 1.12.
 * 2. Within each of the 6 SkillProof categories, attempts are sorted chronologically
 *    and weighted by recency: weight_i = 1 + 0.15 * i.
 * 3. Category Score = round(sum(effectiveScore_i * weight_i) / sum(weight_i)).
 * 4. Overall SkillProof Score = round(mean of all assessed category scores).
 */
export function computeSkillScoresFromAttempts(attempts: IAssessmentAttempt[]): ISkillScores {
  const scores: ISkillScores = {
    overallScore: 0,
    programmingFundamentals: 0,
    frontendDevelopment: 0,
    backendDevelopment: 0,
    databaseManagement: 0,
    dataStructuresAlgorithms: 0,
    softwareEngineeringConcepts: 0,
    assessedCategoriesCount: 0,
  };

  const completed = attempts
    .filter((a) => a.status === 'completed')
    .sort((a, b) => {
      const tA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tA - tB;
    });

  if (completed.length === 0) {
    return scores;
  }

  const byCategory = new Map<SkillCategory, IAssessmentAttempt[]>();
  for (const attempt of completed) {
    const list = byCategory.get(attempt.category) || [];
    list.push(attempt);
    byCategory.set(attempt.category, list);
  }

  let assessedSum = 0;
  let assessedCount = 0;

  for (const category of ALL_CATEGORIES) {
    const catAttempts = byCategory.get(category);
    if (!catAttempts || catAttempts.length === 0) {
      continue;
    }

    let weightedSum = 0;
    let totalWeight = 0;

    catAttempts.forEach((attempt, idx) => {
      const multiplier = DIFFICULTY_WEIGHT[attempt.difficulty] ?? 1.0;
      const effective = Math.min(100, attempt.percentageScore * multiplier);
      const recencyWeight = 1 + 0.15 * idx;
      weightedSum += effective * recencyWeight;
      totalWeight += recencyWeight;
    });

    const categoryScore = Math.round(weightedSum / totalWeight);
    const field = CATEGORY_TO_FIELD[category];
    scores[field] = categoryScore;
    assessedSum += categoryScore;
    assessedCount += 1;
  }

  scores.assessedCategoriesCount = assessedCount;
  scores.overallScore = assessedCount > 0 ? Math.round(assessedSum / assessedCount) : 0;

  return scores;
}

export interface SkillBreakdownItem {
  skill: SkillName;
  category: SkillCategory;
  attempts: number;
  averageScore: number;
  bestScore: number;
  latestScore: number;
  lastAssessedAt: Date | null;
}

export function computeSkillBreakdown(attempts: IAssessmentAttempt[]): SkillBreakdownItem[] {
  const completed = attempts
    .filter((a) => a.status === 'completed')
    .sort((a, b) => {
      const tA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
      const tB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
      return tB - tA;
    });

  const map = new Map<SkillName, IAssessmentAttempt[]>();
  for (const attempt of completed) {
    const list = map.get(attempt.skill) || [];
    list.push(attempt);
    map.set(attempt.skill, list);
  }

  const items: SkillBreakdownItem[] = [];
  for (const [skill, list] of map.entries()) {
    const sum = list.reduce((acc, a) => acc + a.percentageScore, 0);
    const best = Math.max(...list.map((a) => a.percentageScore));
    items.push({
      skill,
      category: list[0].category,
      attempts: list.length,
      averageScore: Math.round(sum / list.length),
      bestScore: best,
      latestScore: list[0].percentageScore,
      lastAssessedAt: list[0].completedAt || null,
    });
  }

  return items.sort((a, b) => b.averageScore - a.averageScore);
}

export async function recalculateAndRecordSkillScores(
  userId: Types.ObjectId,
  latestAttempt: IAssessmentAttempt
): Promise<ISkillScores> {
  const allCompleted = await AssessmentAttempt.find({
    userId,
    status: 'completed',
  }).sort({ completedAt: 1 });

  const newScores = computeSkillScoresFromAttempts(allCompleted);

  await User.findByIdAndUpdate(userId, {
    $set: { skillScores: newScores },
  });

  await SkillHistory.create({
    userId,
    attemptId: latestAttempt._id,
    skill: latestAttempt.skill,
    category: latestAttempt.category,
    difficulty: latestAttempt.difficulty,
    assessmentScore: latestAttempt.percentageScore,
    overallScoreAfter: newScores.overallScore,
    categoryScoresSnapshot: {
      programmingFundamentals: newScores.programmingFundamentals,
      frontendDevelopment: newScores.frontendDevelopment,
      backendDevelopment: newScores.backendDevelopment,
      databaseManagement: newScores.databaseManagement,
      dataStructuresAlgorithms: newScores.dataStructuresAlgorithms,
      softwareEngineeringConcepts: newScores.softwareEngineeringConcepts,
    },
    recordedAt: latestAttempt.completedAt || new Date(),
  });

  return newScores;
}
