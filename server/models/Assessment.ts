import mongoose, { Schema, type Document, type Model } from 'mongoose';

export type SkillName =
  | 'JavaScript'
  | 'React'
  | 'Node.js'
  | 'Express.js'
  | 'MongoDB'
  | 'Python'
  | 'Data Structures and Algorithms'
  | 'DBMS'
  | 'Computer Networks'
  | 'Operating Systems';

export type SkillCategory =
  | 'Programming Fundamentals'
  | 'Frontend Development'
  | 'Backend Development'
  | 'Database Management'
  | 'Data Structures & Algorithms'
  | 'Software Engineering Concepts';

export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface IAssessment extends Document {
  slug: string;
  title: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  description: string;
  durationMinutes: number;
  questionCount: number;
  totalPoints: number;
  passingScore: number;
  topics: string[];
  createdAt: Date;
  updatedAt: Date;
}

const AssessmentSchema = new Schema<IAssessment>(
  {
    slug: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    skill: {
      type: String,
      required: true,
      enum: [
        'JavaScript',
        'React',
        'Node.js',
        'Express.js',
        'MongoDB',
        'Python',
        'Data Structures and Algorithms',
        'DBMS',
        'Computer Networks',
        'Operating Systems',
      ],
      index: true,
    },
    category: {
      type: String,
      required: true,
      enum: [
        'Programming Fundamentals',
        'Frontend Development',
        'Backend Development',
        'Database Management',
        'Data Structures & Algorithms',
        'Software Engineering Concepts',
      ],
      index: true,
    },
    difficulty: {
      type: String,
      required: true,
      enum: ['Beginner', 'Intermediate', 'Advanced'],
      index: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 5,
      max: 90,
    },
    questionCount: {
      type: Number,
      required: true,
      min: 1,
    },
    totalPoints: {
      type: Number,
      required: true,
      min: 1,
    },
    passingScore: {
      type: Number,
      required: true,
      default: 65,
      min: 1,
      max: 100,
    },
    topics: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

AssessmentSchema.index({ skill: 1, difficulty: 1 });

export const Assessment: Model<IAssessment> =
  mongoose.models.Assessment ||
  mongoose.model<IAssessment>('Assessment', AssessmentSchema);
