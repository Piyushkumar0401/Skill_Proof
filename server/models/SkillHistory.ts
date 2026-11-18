import mongoose, { Schema, type Document, type Model, type Types } from 'mongoose';
import type { DifficultyLevel, SkillCategory, SkillName } from './Assessment.ts';

export interface ISkillHistory extends Document {
  userId: Types.ObjectId;
  attemptId: Types.ObjectId;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  assessmentScore: number;
  overallScoreAfter: number;
  categoryScoresSnapshot: {
    programmingFundamentals: number;
    frontendDevelopment: number;
    backendDevelopment: number;
    databaseManagement: number;
    dataStructuresAlgorithms: number;
    softwareEngineeringConcepts: number;
  };
  recordedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SkillHistorySchema = new Schema<ISkillHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    attemptId: {
      type: Schema.Types.ObjectId,
      ref: 'AssessmentAttempt',
      required: true,
    },
    skill: { type: String, required: true },
    category: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      required: true,
    },
    assessmentScore: { type: Number, required: true, min: 0, max: 100 },
    overallScoreAfter: { type: Number, required: true, min: 0, max: 100 },
    categoryScoresSnapshot: {
      programmingFundamentals: { type: Number, default: 0 },
      frontendDevelopment: { type: Number, default: 0 },
      backendDevelopment: { type: Number, default: 0 },
      databaseManagement: { type: Number, default: 0 },
      dataStructuresAlgorithms: { type: Number, default: 0 },
      softwareEngineeringConcepts: { type: Number, default: 0 },
    },
    recordedAt: { type: Date, default: Date.now, index: true },
  },
  {
    timestamps: true,
  }
);

SkillHistorySchema.index({ userId: 1, recordedAt: 1 });

export const SkillHistory: Model<ISkillHistory> =
  mongoose.models.SkillHistory ||
  mongoose.model<ISkillHistory>('SkillHistory', SkillHistorySchema);
