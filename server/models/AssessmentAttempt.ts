import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { DifficultyLevel, SkillCategory, SkillName } from './Assessment.ts';

export interface IAttemptAnswer {
  questionId: Types.ObjectId;
  questionType: 'mcq' | 'coding';
  selectedOptionIndex?: number | null;
  submittedCode?: string;
  isCorrect: boolean;
  earnedPoints: number;
  maxPoints: number;
  evaluationNote: string;
  testResults?: Array<{
    description: string;
    passed: boolean;
    actual?: string;
    expected?: string;
  }>;
}

export interface IAiEvaluation {
  summary: string;
  conceptualUnderstanding: string;
  problemSolving: string;
  codeCorrectness: string;
  logicalReasoning: string;
  timeComplexityAnalysis: string;
  proficiencyLevel: 'Foundational' | 'Developing' | 'Proficient' | 'Advanced';
  strengths: string[];
  weaknesses: string[];
  detailedExplanations: Array<{
    topic: string;
    observation: string;
    recommendation: string;
  }>;
  improvementRecommendations: string[];
  generatedAt: Date;
  modelUsed: string;
}

export interface IAssessmentAttempt extends Document {
  userId: Types.ObjectId;
  assessmentId: Types.ObjectId;
  assessmentTitle: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  status: 'in_progress' | 'completed' | 'expired';
  startedAt: Date;
  expiresAt: Date;
  completedAt?: Date;
  timeSpentSeconds: number;
  questionIds: Types.ObjectId[];
  answers: IAttemptAnswer[];
  rawScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  aiEvaluation?: IAiEvaluation;
  createdAt: Date;
  updatedAt: Date;
}

const AttemptAnswerSchema = new Schema<IAttemptAnswer>(
  {
    questionId: { type: Schema.Types.ObjectId, ref: 'Question', required: true },
    questionType: { type: String, enum: ['mcq', 'coding'], required: true },
    selectedOptionIndex: { type: Number, default: null },
    submittedCode: { type: String, default: '' },
    isCorrect: { type: Boolean, default: false },
    earnedPoints: { type: Number, default: 0 },
    maxPoints: { type: Number, default: 0 },
    evaluationNote: { type: String, default: '' },
    testResults: {
      type: [
        {
          description: String,
          passed: Boolean,
          actual: String,
          expected: String,
        },
      ],
      default: undefined,
    },
  },
  { _id: false }
);

const AiEvaluationSchema = new Schema<IAiEvaluation>(
  {
    summary: { type: String, required: true },
    conceptualUnderstanding: { type: String, required: true },
    problemSolving: { type: String, required: true },
    codeCorrectness: { type: String, required: true },
    logicalReasoning: { type: String, required: true },
    timeComplexityAnalysis: { type: String, required: true },
    proficiencyLevel: {
      type: String,
      enum: ['Foundational', 'Developing', 'Proficient', 'Advanced'],
      required: true,
    },
    strengths: { type: [String], default: [] },
    weaknesses: { type: [String], default: [] },
    detailedExplanations: {
      type: [
        {
          topic: String,
          observation: String,
          recommendation: String,
        },
      ],
      default: [],
    },
    improvementRecommendations: { type: [String], default: [] },
    generatedAt: { type: Date, default: Date.now },
    modelUsed: { type: String, default: 'gemini-4-hydrogen' },
  },
  { _id: false }
);

const AssessmentAttemptSchema = new Schema<IAssessmentAttempt>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    assessmentTitle: { type: String, required: true },
    skill: { type: String, required: true, index: true },
    category: { type: String, required: true, index: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    status: {
      type: String,
      enum: ['in_progress', 'completed', 'expired'],
      default: 'in_progress',
      index: true,
    },
    startedAt: { type: Date, required: true, default: Date.now },
    expiresAt: { type: Date, required: true },
    completedAt: { type: Date },
    timeSpentSeconds: { type: Number, default: 0 },
    questionIds: [{ type: Schema.Types.ObjectId, ref: 'Question' }],
    answers: { type: [AttemptAnswerSchema], default: [] },
    rawScore: { type: Number, default: 0 },
    maxScore: { type: Number, default: 0 },
    percentageScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    aiEvaluation: { type: AiEvaluationSchema },
  },
  {
    timestamps: true,
  }
);

AssessmentAttemptSchema.index({ userId: 1, completedAt: -1 });
AssessmentAttemptSchema.index({ userId: 1, assessmentId: 1, status: 1 });

export const AssessmentAttempt: Model<IAssessmentAttempt> =
  mongoose.models.AssessmentAttempt ||
  mongoose.model<IAssessmentAttempt>('AssessmentAttempt', AssessmentAttemptSchema);
