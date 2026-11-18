import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { DifficultyLevel, SkillCategory, SkillName } from './Assessment.ts';

export interface ITestCase {
  input: unknown[];
  expected: unknown;
  description: string;
}

export interface IQuestion extends Document {
  assessmentId: Types.ObjectId;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  type: 'mcq' | 'coding';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  correctOptionIndex?: number;
  starterCode?: string;
  functionName?: string;
  language?: 'javascript' | 'python' | 'sql' | 'pseudocode';
  testCases?: ITestCase[];
  rubricKeywords?: string[];
  explanation: string;
  points: number;
  isAiSupplemented: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const TestCaseSchema = new Schema<ITestCase>(
  {
    input: { type: [Schema.Types.Mixed], default: [] },
    expected: { type: Schema.Types.Mixed, required: true },
    description: { type: String, required: true },
  },
  { _id: false, minimize: false }
);

const QuestionSchema = new Schema<IQuestion>(
  {
    assessmentId: {
      type: Schema.Types.ObjectId,
      ref: 'Assessment',
      required: true,
      index: true,
    },
    skill: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
    },
    type: {
      type: String,
      required: true,
      enum: ['mcq', 'coding'],
    },
    prompt: {
      type: String,
      required: true,
    },
    codeSnippet: {
      type: String,
    },
    options: {
      type: [String],
      default: undefined,
    },
    correctOptionIndex: {
      type: Number,
    },
    starterCode: {
      type: String,
    },
    functionName: {
      type: String,
    },
    language: {
      type: String,
      enum: ['javascript', 'python', 'sql', 'pseudocode'],
      default: 'javascript',
    },
    testCases: {
      type: [TestCaseSchema],
      default: undefined,
    },
    rubricKeywords: {
      type: [String],
      default: undefined,
    },
    explanation: {
      type: String,
      required: true,
    },
    points: {
      type: Number,
      required: true,
      default: 10,
    },
    isAiSupplemented: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);

QuestionSchema.index({ assessmentId: 1, type: 1 });

export const Question: Model<IQuestion> =
  mongoose.models.Question ||
  mongoose.model<IQuestion>('Question', QuestionSchema);
