import mongoose, { Schema, type Document, type Model } from 'mongoose';

export interface ISkillScores {
  overallScore: number;
  programmingFundamentals: number;
  frontendDevelopment: number;
  backendDevelopment: number;
  databaseManagement: number;
  dataStructuresAlgorithms: number;
  softwareEngineeringConcepts: number;
  assessedCategoriesCount: number;
}

export interface IUser extends Document {
  name: string;
  email: string;
  passwordHash: string;
  headline: string;
  targetTrack: string;
  experienceLevel: 'Beginner' | 'Intermediate' | 'Advanced';
  themePreference: 'dark' | 'light';
  preferredSkills: string[];
  skillScores: ISkillScores;
  createdAt: Date;
  updatedAt: Date;
}

const SkillScoresSchema = new Schema<ISkillScores>(
  {
    overallScore: { type: Number, default: 0, min: 0, max: 100 },
    programmingFundamentals: { type: Number, default: 0, min: 0, max: 100 },
    frontendDevelopment: { type: Number, default: 0, min: 0, max: 100 },
    backendDevelopment: { type: Number, default: 0, min: 0, max: 100 },
    databaseManagement: { type: Number, default: 0, min: 0, max: 100 },
    dataStructuresAlgorithms: { type: Number, default: 0, min: 0, max: 100 },
    softwareEngineeringConcepts: { type: Number, default: 0, min: 0, max: 100 },
    assessedCategoriesCount: { type: Number, default: 0, min: 0, max: 6 },
  },
  { _id: false }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 80,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
      select: false,
    },
    headline: {
      type: String,
      default: 'Software Engineer',
      trim: true,
      maxlength: 120,
    },
    targetTrack: {
      type: String,
      default: 'Full-Stack Developer',
      trim: true,
      maxlength: 80,
    },
    experienceLevel: {
      type: String,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      default: 'Intermediate',
    },
    themePreference: {
      type: String,
      enum: ['dark', 'light'],
      default: 'dark',
    },
    preferredSkills: {
      type: [String],
      default: ['JavaScript', 'React', 'Node.js'],
    },
    skillScores: {
      type: SkillScoresSchema,
      default: () => ({}),
    },
  },
  {
    timestamps: true,
  }
);

export const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
