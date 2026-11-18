import { GoogleGenAI, Type } from '@google/genai';
import { env } from '../config/env.ts';
import { AppError } from '../utils/AppError.ts';
import type { IAssessmentAttempt, IAiEvaluation } from '../models/AssessmentAttempt.ts';
import type { IQuestion } from '../models/Question.ts';
import type { IUser } from '../models/User.ts';
import type { SkillBreakdownItem } from './scoringService.ts';

const DEFAULT_MODEL = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY?.trim() || env.geminiApiKey;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new AppError(
      'GEMINI_API_KEY is not configured on the server. Add your Gemini API key in Settings > Secrets or your .env file to enable AI diagnostics, roadmaps, and chat.',
      503,
      'GEMINI_NOT_CONFIGURED'
    );
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(err: unknown): never {
  if (err instanceof AppError) {
    throw err;
  }
  const msg = err instanceof Error ? err.message : String(err);
  if (msg.includes('API_KEY_INVALID') || msg.includes('PERMISSION_DENIED') || msg.includes('403')) {
    throw new AppError(
      'The configured GEMINI_API_KEY was rejected by the Gemini API. Please verify your key in Settings > Secrets or .env.',
      502,
      'GEMINI_AUTH_ERROR'
    );
  }
  if (msg.includes('RESOURCE_EXHAUSTED') || msg.includes('429')) {
    throw new AppError(
      'Gemini API rate limit or quota exceeded. Please wait a moment and try again.',
      429,
      'GEMINI_RATE_LIMIT'
    );
  }
  throw new AppError(`Gemini AI request failed: ${msg}`, 502, 'GEMINI_UPSTREAM_ERROR');
}

export async function analyzeAssessmentAttempt(
  attempt: IAssessmentAttempt,
  questions: IQuestion[]
): Promise<IAiEvaluation> {
  const ai = getGeminiClient();

  const questionMap = new Map<string, IQuestion>();
  for (const q of questions) {
    questionMap.set(q._id.toString(), q);
  }

  const evidencePayload = attempt.answers.map((ans, index) => {
    const q = questionMap.get(ans.questionId.toString());
    return {
      questionNumber: index + 1,
      type: ans.questionType,
      prompt: q?.prompt || 'Question unavailable',
      selectedOption:
        ans.questionType === 'mcq' && q?.options && typeof ans.selectedOptionIndex === 'number'
          ? q.options[ans.selectedOptionIndex]
          : null,
      correctOption:
        ans.questionType === 'mcq' && q?.options && typeof q.correctOptionIndex === 'number'
          ? q.options[q.correctOptionIndex]
          : null,
      submittedCode: ans.submittedCode || null,
      isCorrect: ans.isCorrect,
      earnedPoints: ans.earnedPoints,
      maxPoints: ans.maxPoints,
      evaluationNote: ans.evaluationNote,
      testResults: ans.testResults || [],
      referenceExplanation: q?.explanation || '',
    };
  });

  const prompt = `Analyze this developer's actual technical assessment performance objectively using ONLY the evidence below. Do not invent facts or scores not supported by their answers.

Assessment: ${attempt.assessmentTitle}
Skill: ${attempt.skill} (${attempt.category})
Difficulty: ${attempt.difficulty}
Verified Score: ${attempt.percentageScore}% (${attempt.rawScore}/${attempt.maxScore} points)
Passed Threshold: ${attempt.passed}
Time Spent: ${attempt.timeSpentSeconds} seconds

Question-by-Question Evidence:
${JSON.stringify(evidencePayload, null, 2)}

Provide an incisive engineering evaluation covering conceptual understanding, problem-solving ability, code correctness, logical reasoning, time complexity where applicable, concrete strengths, concrete technical weaknesses, topic-level explanations, and actionable improvement recommendations.`;

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: prompt,
      config: {
        systemInstruction:
          'You are a principal software engineer reviewing a candidate assessment on SkillProof. Base every observation strictly on the submitted answers, test-case outputs, and code.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            summary: { type: Type.STRING },
            conceptualUnderstanding: { type: Type.STRING },
            problemSolving: { type: Type.STRING },
            codeCorrectness: { type: Type.STRING },
            logicalReasoning: { type: Type.STRING },
            timeComplexityAnalysis: { type: Type.STRING },
            proficiencyLevel: {
              type: Type.STRING,
              description: 'Must be one of: Foundational, Developing, Proficient, Advanced',
            },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
            weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
            detailedExplanations: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  topic: { type: Type.STRING },
                  observation: { type: Type.STRING },
                  recommendation: { type: Type.STRING },
                },
                required: ['topic', 'observation', 'recommendation'],
              },
            },
            improvementRecommendations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
          },
          required: [
            'summary',
            'conceptualUnderstanding',
            'problemSolving',
            'codeCorrectness',
            'logicalReasoning',
            'timeComplexityAnalysis',
            'proficiencyLevel',
            'strengths',
            'weaknesses',
            'detailedExplanations',
            'improvementRecommendations',
          ],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim()) as Omit<
      IAiEvaluation,
      'generatedAt' | 'modelUsed'
    >;

    const allowedLevels = ['Foundational', 'Developing', 'Proficient', 'Advanced'] as const;
    const normalizedLevel = allowedLevels.includes(parsed.proficiencyLevel)
      ? parsed.proficiencyLevel
      : attempt.percentageScore >= 85
      ? 'Advanced'
      : attempt.percentageScore >= 70
      ? 'Proficient'
      : attempt.percentageScore >= 45
      ? 'Developing'
      : 'Foundational';

    return {
      ...parsed,
      proficiencyLevel: normalizedLevel,
      generatedAt: new Date(),
      modelUsed: DEFAULT_MODEL,
    };
  } catch (err) {
    handleGeminiError(err);
  }
}

export interface RoadmapPhase {
  phase: string;
  timeframe: string;
  focusSkill: string;
  objective: string;
  actionItems: string[];
  practiceMilestone: string;
}

export interface GeneratedRoadmap {
  headline: string;
  targetTrack: string;
  rationale: string;
  phases: RoadmapPhase[];
  generatedAt: string;
  modelUsed: string;
}

export async function generatePersonalizedRoadmap(
  user: IUser,
  skillBreakdown: SkillBreakdownItem[],
  recentAttempts: IAssessmentAttempt[],
  focusGoal?: string
): Promise<GeneratedRoadmap> {
  const ai = getGeminiClient();

  const context = {
    developerName: user.name,
    targetTrack: user.targetTrack,
    experienceLevel: user.experienceLevel,
    overallSkillProofScore: user.skillScores.overallScore,
    categoryScores: user.skillScores,
    skillBreakdown,
    recentWeaknesses: recentAttempts
      .flatMap((a) => a.aiEvaluation?.weaknesses || [])
      .slice(0, 8),
    recentScores: recentAttempts.slice(0, 6).map((a) => ({
      title: a.assessmentTitle,
      skill: a.skill,
      difficulty: a.difficulty,
      score: a.percentageScore,
      passed: a.passed,
    })),
    requestedFocusGoal: focusGoal || null,
  };

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Generate a structured 4-phase personalized engineering learning roadmap grounded in this developer's verified SkillProof data:\n${JSON.stringify(context, null, 2)}`,
      config: {
        systemInstruction:
          'You are an engineering mentor creating a pragmatic, concrete learning roadmap tailored to the developer’s lowest verified categories and target role.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            headline: { type: Type.STRING },
            targetTrack: { type: Type.STRING },
            rationale: { type: Type.STRING },
            phases: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  phase: { type: Type.STRING },
                  timeframe: { type: Type.STRING },
                  focusSkill: { type: Type.STRING },
                  objective: { type: Type.STRING },
                  actionItems: { type: Type.ARRAY, items: { type: Type.STRING } },
                  practiceMilestone: { type: Type.STRING },
                },
                required: [
                  'phase',
                  'timeframe',
                  'focusSkill',
                  'objective',
                  'actionItems',
                  'practiceMilestone',
                ],
              },
            },
          },
          required: ['headline', 'targetTrack', 'rationale', 'phases'],
        },
      },
    });

    const parsed = JSON.parse((response.text || '{}').trim()) as Omit<
      GeneratedRoadmap,
      'generatedAt' | 'modelUsed'
    >;

    return {
      ...parsed,
      generatedAt: new Date().toISOString(),
      modelUsed: DEFAULT_MODEL,
    };
  } catch (err) {
    handleGeminiError(err);
  }
}

export async function chatWithLearningAssistant(
  user: IUser,
  skillBreakdown: SkillBreakdownItem[],
  recentAttempts: IAssessmentAttempt[],
  messages: Array<{ role: 'user' | 'assistant'; content: string }>
): Promise<{ reply: string; modelUsed: string }> {
  const ai = getGeminiClient();

  const systemContext = {
    developer: {
      name: user.name,
      targetTrack: user.targetTrack,
      experienceLevel: user.experienceLevel,
      preferredSkills: user.preferredSkills,
    },
    skillScores: user.skillScores,
    skillBreakdown,
    recentAttempts: recentAttempts.slice(0, 8).map((a) => ({
      assessmentTitle: a.assessmentTitle,
      skill: a.skill,
      category: a.category,
      difficulty: a.difficulty,
      percentageScore: a.percentageScore,
      passed: a.passed,
      completedAt: a.completedAt,
      missedQuestions: a.answers
        .filter((ans) => !ans.isCorrect)
        .map((ans) => ans.evaluationNote),
      aiSummary: a.aiEvaluation?.summary || null,
      weaknesses: a.aiEvaluation?.weaknesses || [],
    })),
  };

  const conversationTranscript = messages
    .slice(-10)
    .map((m) => `${m.role === 'user' ? 'Developer' : 'SkillProof Coach'}: ${m.content}`)
    .join('\n\n');

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Verified SkillProof Profile & Assessment History:\n${JSON.stringify(systemContext, null, 2)}\n\nConversation:\n${conversationTranscript}\n\nRespond directly as SkillProof Coach.`,
      config: {
        systemInstruction:
          'You are the SkillProof AI Learning Assistant. Always cite the user’s actual SkillProof scores, completed assessments, missed checks, and unassessed categories when answering questions. If they have zero assessments completed yet, tell them transparently and recommend a specific starting assessment. Keep formatting clean with crisp bullet points and concise technical explanations.',
      },
    });

    return {
      reply: (response.text || 'I could not generate a response right now.').trim(),
      modelUsed: DEFAULT_MODEL,
    };
  } catch (err) {
    handleGeminiError(err);
  }
}

export async function generateSupplementalQuestions(
  skill: string,
  category: string,
  difficulty: string,
  existingPrompts: string[]
): Promise<
  Array<{
    type: 'mcq';
    prompt: string;
    options: string[];
    correctOptionIndex: number;
    explanation: string;
    points: number;
  }>
> {
  const ai = getGeminiClient();

  try {
    const response = await ai.models.generateContent({
      model: DEFAULT_MODEL,
      contents: `Generate 2 distinct, practical ${difficulty}-level multiple-choice technical questions for ${skill} (${category}). Avoid duplicating these existing prompts:\n${existingPrompts.join('\n- ')}`,
      config: {
        systemInstruction:
          'You are a senior technical interviewer authoring unambiguous, rigorous multiple-choice engineering questions with 4 options each.',
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              prompt: { type: Type.STRING },
              options: { type: Type.ARRAY, items: { type: Type.STRING } },
              correctOptionIndex: { type: Type.INTEGER },
              explanation: { type: Type.STRING },
            },
            required: ['prompt', 'options', 'correctOptionIndex', 'explanation'],
          },
        },
      },
    });

    const parsed = JSON.parse((response.text || '[]').trim()) as Array<{
      prompt: string;
      options: string[];
      correctOptionIndex: number;
      explanation: string;
    }>;

    return parsed
      .filter(
        (q) =>
          q.prompt &&
          Array.isArray(q.options) &&
          q.options.length === 4 &&
          q.correctOptionIndex >= 0 &&
          q.correctOptionIndex < 4
      )
      .slice(0, 2)
      .map((q) => ({
        type: 'mcq' as const,
        prompt: q.prompt,
        options: q.options,
        correctOptionIndex: q.correctOptionIndex,
        explanation: q.explanation,
        points: 15,
      }));
  } catch (err) {
    handleGeminiError(err);
  }
}
