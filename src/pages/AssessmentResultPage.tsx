import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  XCircle,
} from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { api, extractErrorMessage } from '../services/api';
import { useAuth } from '../context/AuthContext';
import type { AiEvaluation, DetailedAttempt } from '../types';
import { formatDurationSeconds, formatShortDate } from '../utils/format';

export function AssessmentResultPage() {
  const { attemptId } = useParams<{ attemptId: string }>();
  const { refreshUser } = useAuth();

  const [attempt, setAttempt] = useState<DetailedAttempt | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState('');

  const runAiAnalysis = useCallback(async (id: string, forceRefresh = false) => {
    setAiLoading(true);
    setAiError('');
    try {
      const { data } = await api.post<{ evaluation: AiEvaluation }>('/ai/analyze', {
        attemptId: id,
        forceRefresh,
      });
      setAttempt((prev) => (prev ? { ...prev, aiEvaluation: data.evaluation } : prev));
    } catch (err) {
      setAiError(extractErrorMessage(err));
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!attemptId) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.get<{ attempt: DetailedAttempt }>(
          `/assessments/attempts/${attemptId}`
        );
        if (!active) return;
        setAttempt(data.attempt);
        void refreshUser();
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [attemptId, refreshUser]);

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Workspace / Assessment Result">
        <div className="space-y-6 animate-pulse">
          <div className="h-36 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
          <div className="h-64 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !attempt) {
    return (
      <DashboardLayout breadcrumb="Workspace / Assessment Result">
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h1 className="font-semibold">Could not load assessment result</h1>
            <p className="text-sm mt-1">{error || 'Attempt record not found.'}</p>
            <Link
              to="/assessments"
              className="inline-block mt-3 text-xs font-semibold underline"
            >
              Return to Assessments
            </Link>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const aiEval = attempt.aiEvaluation;

  return (
    <DashboardLayout breadcrumb={`Workspace / Results / ${attempt.assessmentTitle}`}>
      <div className="space-y-8">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <Link
            to="/assessments"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Assessments</span>
          </Link>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Completed {formatShortDate(attempt.completedAt)}
          </div>
        </div>

        {/* Summary Header Card */}
        <section className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mb-2">
              {attempt.skill} · {attempt.category} · {attempt.difficulty}
            </div>
            <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-slate-50">
              {attempt.assessmentTitle}
            </h1>
            <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
              {attempt.passed ? (
                <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-600 dark:text-emerald-400">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Passed Benchmark</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 font-semibold text-amber-600 dark:text-amber-400">
                  <XCircle className="w-4 h-4" />
                  <span>Below Passing Threshold</span>
                </span>
              )}
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                Points: {attempt.rawScore}/{attempt.maxScore}
              </span>
              <span className="text-slate-400" aria-hidden="true">·</span>
              <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                Time: {formatDurationSeconds(attempt.timeSpentSeconds)}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-6 shrink-0">
            <div className="text-right">
              <div className="text-xs text-slate-500 dark:text-slate-400">Verified Score</div>
              <div className="font-mono tabular-nums text-4xl font-bold text-slate-900 dark:text-slate-50">
                {attempt.percentageScore}%
              </div>
            </div>
            <Link
              to="/analytics"
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors whitespace-nowrap"
            >
              View Skill Impact
            </Link>
          </div>
        </section>

        {/* Gemini AI Evaluation Section */}
        <section className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-500" />
                <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                  AI-Powered Skill Evaluation
                </h2>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Grounded in your submitted answers, unit-test outputs, and problem-solving patterns.
              </p>
            </div>

            <button
              type="button"
              disabled={aiLoading}
              onClick={() => void runAiAnalysis(attempt.id, Boolean(aiEval))}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors whitespace-nowrap self-start sm:self-auto"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${aiLoading ? 'animate-spin' : ''}`} />
              <span>
                {aiLoading
                  ? 'Analyzing Performance...'
                  : aiEval
                  ? 'Regenerate AI Review'
                  : 'Generate AI Evaluation'}
              </span>
            </button>
          </div>

          {aiError && (
            <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <div className="font-medium">AI evaluation unavailable</div>
                <p className="text-xs mt-1 leading-relaxed">{aiError}</p>
              </div>
            </div>
          )}

          {!aiEval && !aiLoading && !aiError && (
            <div className="p-6 rounded-lg border border-dashed border-slate-300 dark:border-slate-700 text-sm text-slate-600 dark:text-slate-400">
              Click <span className="font-semibold text-slate-900 dark:text-slate-200">Generate AI Evaluation</span> above to run a Gemini review of your conceptual understanding, code correctness, time complexity, and technical gaps for this attempt.
            </div>
          )}

          {aiEval && (
            <div className="space-y-6">
              <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800">
                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-1">
                  Proficiency Classification: <span className="text-slate-900 dark:text-slate-100 font-semibold">{aiEval.proficiencyLevel}</span>
                </div>
                <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                  {aiEval.summary}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Conceptual Understanding', text: aiEval.conceptualUnderstanding },
                  { label: 'Problem-Solving Ability', text: aiEval.problemSolving },
                  { label: 'Code Correctness', text: aiEval.codeCorrectness },
                  { label: 'Logical Reasoning', text: aiEval.logicalReasoning },
                  { label: 'Time & Space Complexity', text: aiEval.timeComplexityAnalysis },
                ].map((dim) => (
                  <div
                    key={dim.label}
                    className="p-4 rounded-lg border border-slate-200 dark:border-slate-800"
                  >
                    <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 mb-1.5">
                      {dim.label}
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                      {dim.text}
                    </p>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                <div>
                  <h3 className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mb-2.5">
                    Demonstrated Strengths
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {aiEval.strengths.map((s, i) => (
                      <li key={i} className="leading-relaxed">• {s}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-400 mb-2.5">
                    Technical Weaknesses Identified
                  </h3>
                  <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                    {aiEval.weaknesses.map((w, i) => (
                      <li key={i} className="leading-relaxed">• {w}</li>
                    ))}
                  </ul>
                </div>
              </div>

              {aiEval.detailedExplanations.length > 0 && (
                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">
                    Topic-Level Explanations
                  </h3>
                  <div className="space-y-3">
                    {aiEval.detailedExplanations.map((item, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-sm space-y-1"
                      >
                        <div className="font-semibold text-slate-900 dark:text-slate-100">
                          {item.topic}
                        </div>
                        <p className="text-slate-600 dark:text-slate-400 text-xs leading-relaxed">
                          {item.observation}
                        </p>
                        <p className="text-blue-600 dark:text-blue-400 text-xs leading-relaxed">
                          Next step: {item.recommendation}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-slate-200 dark:border-slate-800">
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100 mb-2">
                  Improvement Recommendations
                </h3>
                <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                  {aiEval.improvementRecommendations.map((rec, idx) => (
                    <li key={idx}>• {rec}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
        </section>

        {/* Question-by-Question Review */}
        <section className="space-y-4">
          <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
            Question Breakdown
          </h2>

          {attempt.answers.map((ans, index) => (
            <div
              key={ans.questionId}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-4"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs text-slate-500 dark:text-slate-400">
                  Question {index + 1} · {ans.questionType === 'mcq' ? 'Multiple Choice' : 'Coding Challenge'}
                </div>
                <div className="flex items-center gap-3 text-xs font-mono tabular-nums">
                  {ans.isCorrect ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Correct</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-rose-600 dark:text-rose-400 font-semibold">
                      <XCircle className="w-3.5 h-3.5" />
                      <span>{ans.earnedPoints > 0 ? 'Partial' : 'Incorrect'}</span>
                    </span>
                  )}
                  <span className="text-slate-600 dark:text-slate-300">
                    {ans.earnedPoints}/{ans.maxPoints} pts
                  </span>
                </div>
              </div>

              <p className="text-sm font-medium text-slate-900 dark:text-slate-100 leading-relaxed">
                {ans.prompt}
              </p>

              {ans.codeSnippet && (
                <pre className="p-3.5 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                  <code>{ans.codeSnippet}</code>
                </pre>
              )}

              {ans.questionType === 'mcq' && ans.options && (
                <div className="space-y-2">
                  {ans.options.map((opt, oIdx) => {
                    const isUserPick = ans.selectedOptionIndex === oIdx;
                    const isCorrectPick = ans.correctOptionIndex === oIdx;
                    return (
                      <div
                        key={oIdx}
                        className={`p-3 rounded-lg border text-xs flex items-center justify-between gap-3 ${
                          isCorrectPick
                            ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200'
                            : isUserPick
                            ? 'border-rose-500/40 bg-rose-500/10 text-rose-800 dark:text-rose-200'
                            : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400'
                        }`}
                      >
                        <span>
                          {String.fromCharCode(65 + oIdx)}. {opt}
                        </span>
                        <span className="font-medium shrink-0">
                          {isCorrectPick ? 'Correct Option' : isUserPick ? 'Your Choice' : ''}
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}

              {ans.questionType === 'coding' && (
                <div className="space-y-3">
                  <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 text-xs font-mono overflow-x-auto">
                    <code>{ans.submittedCode || '// No code submitted'}</code>
                  </pre>

                  {ans.testResults && ans.testResults.length > 0 && (
                    <div className="border border-slate-200 dark:border-slate-800 rounded-lg divide-y divide-slate-200 dark:divide-slate-800 text-xs">
                      {ans.testResults.map((tc, tIdx) => (
                        <div key={tIdx} className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                          <div className="flex items-center gap-2">
                            {tc.passed ? (
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                            ) : (
                              <XCircle className="w-3.5 h-3.5 text-rose-500 shrink-0" />
                            )}
                            <span className="text-slate-800 dark:text-slate-200">
                              {tc.description}
                            </span>
                          </div>
                          {!tc.passed && tc.expected && (
                            <div className="font-mono text-slate-500 dark:text-slate-400">
                              Expected: {tc.expected} · Got: {tc.actual}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                <span className="font-semibold text-slate-900 dark:text-slate-100">Explanation: </span>
                {ans.explanation}
              </div>
            </div>
          ))}
        </section>
      </div>
    </DashboardLayout>
  );
}
