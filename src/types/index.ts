export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

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

export interface SkillScores {
  overallScore: number;
  programmingFundamentals: number;
  frontendDevelopment: number;
  backendDevelopment: number;
  databaseManagement: number;
  dataStructuresAlgorithms: number;
  softwareEngineeringConcepts: number;
  assessedCategoriesCount: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  headline: string;
  targetTrack: string;
  experienceLevel: DifficultyLevel;
  themePreference: 'dark' | 'light';
  preferredSkills: string[];
  skillScores: SkillScores;
  createdAt: string;
}

export interface AssessmentListItem {
  id: string;
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
  questionMix: {
    mcq: number;
    coding: number;
  };
  userStats: {
    attempts: number;
    bestScore: number;
    passed: boolean;
    lastAttemptId?: string;
  };
}

export interface SanitizedQuestion {
  id: string;
  type: 'mcq' | 'coding';
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  starterCode?: string;
  language?: 'javascript' | 'python' | 'sql' | 'pseudocode';
  points: number;
  isAiSupplemented?: boolean;
  sampleTests?: string[];
}

export interface StartedAttemptSession {
  attempt: {
    id: string;
    assessmentId: string;
    assessmentTitle: string;
    skill: SkillName;
    category: SkillCategory;
    difficulty: DifficultyLevel;
    durationMinutes: number;
    passingScore: number;
    startedAt: string;
    expiresAt: string;
  };
  questions: SanitizedQuestion[];
}

export interface AiEvaluation {
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
  generatedAt: string;
  modelUsed: string;
}

export interface DetailedAnswer {
  questionId: string;
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
  prompt: string;
  codeSnippet?: string;
  options?: string[];
  correctOptionIndex?: number;
  language?: string;
  explanation: string;
}

export interface DetailedAttempt {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  status: string;
  startedAt: string;
  completedAt: string;
  timeSpentSeconds: number;
  rawScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  answers: DetailedAnswer[];
  aiEvaluation?: AiEvaluation;
}

export interface SkillBreakdownItem {
  skill: SkillName;
  category: SkillCategory;
  attempts: number;
  averageScore: number;
  bestScore: number;
  latestScore: number;
  lastAssessedAt: string | null;
}

export interface SkillAnalyticsResponse {
  overallScore: number;
  assessedCategoriesCount: number;
  totalCategoriesCount: number;
  totalAssessments: number;
  passedCount: number;
  averageScore: number;
  categoryScores: Array<{
    category: SkillCategory;
    key: string;
    score: number;
    attempts: number;
  }>;
  skillBreakdown: SkillBreakdownItem[];
  strongestSkills: SkillBreakdownItem[];
  weakestSkills: SkillBreakdownItem[];
  recentAttempts: Array<{
    id: string;
    assessmentId: string;
    assessmentTitle: string;
    skill: SkillName;
    category: SkillCategory;
    difficulty: DifficultyLevel;
    percentageScore: number;
    passed: boolean;
    timeSpentSeconds: number;
    completedAt: string;
    hasAiEvaluation: boolean;
  }>;
  aiSuggestions: string[];
  aiWeaknesses: string[];
  scoringFormula: {
    description: string;
    difficultyWeights: Record<DifficultyLevel, number>;
  };
}

export interface SkillHistoryEntry {
  id: string;
  attemptId: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  assessmentScore: number;
  overallScoreAfter: number;
  categoryScoresSnapshot: Record<string, number>;
  recordedAt: string;
}

export interface AssessmentHistoryItem {
  id: string;
  assessmentId: string;
  assessmentTitle: string;
  skill: SkillName;
  category: SkillCategory;
  difficulty: DifficultyLevel;
  rawScore: number;
  maxScore: number;
  percentageScore: number;
  passed: boolean;
  timeSpentSeconds: number;
  completedAt: string;
  hasAiEvaluation: boolean;
}

export interface GeneratedRoadmap {
  headline: string;
  targetTrack: string;
  rationale: string;
  phases: Array<{
    phase: string;
    timeframe: string;
    focusSkill: string;
    objective: string;
    actionItems: string[];
    practiceMilestone: string;
  }>;
  generatedAt: string;
  modelUsed: string;
}
