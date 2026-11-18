import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, CheckCircle2, ChevronLeft, ChevronRight, Clock, RotateCcw } from 'lucide-react';
import { api, extractErrorMessage } from '../services/api';
import type { SanitizedQuestion, StartedAttemptSession } from '../types';
import { formatCountdown } from '../utils/format';

interface AnswerDraft {
  selectedOptionIndex: number | null;
  submittedCode: string;
}

export function AssessmentInterfacePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<StartedAttemptSession | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, AnswerDraft>>({});
  const [secondsLeft, setSecondsLeft] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [error, setError] = useState('');
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    let active = true;
    async function start() {
      if (!id) return;
      setLoading(true);
      setError('');
      try {
        const { data } = await api.post<StartedAttemptSession>(`/assessments/${id}/start`);
        if (!active) return;

        setSession(data);

        const initialDrafts: Record<string, AnswerDraft> = {};
        for (const q of data.questions) {
          initialDrafts[q.id] = {
            selectedOptionIndex: null,
            submittedCode: q.starterCode || '',
          };
        }
        setAnswers(initialDrafts);

        const expiresMs = new Date(data.attempt.expiresAt).getTime();
        const remaining = Math.max(1, Math.floor((expiresMs - Date.now()) / 1000));
        setSecondsLeft(remaining);
      } catch (err) {
        if (!active) return;
        setError(extractErrorMessage(err));
      } finally {
        if (active) setLoading(false);
      }
    }
    void start();
    return () => {
      active = false;
    };
  }, [id]);

  const handleSubmit = useCallback(async () => {
    if (!session || !id || submitting) return;
    setSubmitting(true);
    setConfirmOpen(false);
    setError('');

    try {
      const payloadAnswers = session.questions.map((q) => {
        const draft = answers[q.id];
        return {
          questionId: q.id,
          selectedOptionIndex: draft?.selectedOptionIndex ?? null,
          submittedCode: draft?.submittedCode ?? '',
        };
      });

      const { data } = await api.post<{ attemptId: string }>(
        `/assessments/${id}/submit`,
        {
          attemptId: session.attempt.id,
          answers: payloadAnswers,
        }
      );

      navigate(`/assessments/attempts/${data.attemptId}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
      setSubmitting(false);
    }
  }, [answers, id, navigate, session, submitting]);

  // Countdown timer
  useEffect(() => {
    if (!session || submitting) return;
    const timer = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          window.clearInterval(timer);
          if (!autoSubmittedRef.current) {
            autoSubmittedRef.current = true;
            void handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => window.clearInterval(timer);
  }, [handleSubmit, session, submitting]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F17] text-slate-600 dark:text-slate-300">
        <div className="text-center space-y-3">
          <div className="w-7 h-7 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium">Initializing timed assessment environment...</p>
        </div>
      </div>
    );
  }

  if (error && !session) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50 dark:bg-[#0B0F17]">
        <div className="max-w-md w-full p-6 rounded-xl border border-rose-500/30 bg-white dark:bg-[#111722] space-y-4">
          <div className="flex items-start gap-3 text-rose-600 dark:text-rose-400">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <h1 className="font-semibold">Unable to start assessment</h1>
              <p className="text-sm mt-1">{error}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => navigate('/assessments')}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 text-white"
          >
            Back to Assessments
          </button>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const questions = session.questions;
  const currentQuestion: SanitizedQuestion = questions[currentIndex];
  const currentDraft = answers[currentQuestion.id] || {
    selectedOptionIndex: null,
    submittedCode: currentQuestion.starterCode || '',
  };

  const isAnswered = (q: SanitizedQuestion) => {
    const d = answers[q.id];
    if (!d) return false;
    if (q.type === 'mcq') return d.selectedOptionIndex !== null;
    return d.submittedCode.trim().length > 0 && d.submittedCode.trim() !== (q.starterCode || '').trim();
  };

  const answeredCount = questions.filter(isAnswered).length;

  const handleCodeKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault();
      const target = e.currentTarget;
      const start = target.selectionStart;
      const end = target.selectionEnd;
      const val = currentDraft.submittedCode;
      const updated = `${val.substring(0, start)}  ${val.substring(end)}`;
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: { ...currentDraft, submittedCode: updated },
      }));
      window.requestAnimationFrame(() => {
        target.selectionStart = target.selectionEnd = start + 2;
      });
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100">
      {/* Assessment Top Header */}
      <header className="h-16 px-4 sm:px-8 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F141F] flex items-center justify-between gap-4 sticky top-0 z-30">
        <div className="min-w-0">
          <div className="text-sm font-semibold text-slate-900 dark:text-slate-100 truncate">
            {session.attempt.assessmentTitle}
          </div>
          <div className="text-xs text-slate-500 dark:text-slate-400 truncate">
            {session.attempt.skill} · {session.attempt.difficulty} · Question {currentIndex + 1} of{' '}
            {questions.length}
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border font-mono tabular-nums text-sm font-semibold ${
              secondsLeft <= 120
                ? 'border-rose-500/40 bg-rose-500/10 text-rose-600 dark:text-rose-400'
                : 'border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#0B0F17] text-slate-900 dark:text-slate-100'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>{formatCountdown(secondsLeft)}</span>
          </div>

          <button
            type="button"
            disabled={submitting}
            onClick={() => setConfirmOpen(true)}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors whitespace-nowrap"
          >
            {submitting ? 'Evaluating...' : 'Submit Assessment'}
          </button>
        </div>
      </header>

      {error && (
        <div className="max-w-6xl mx-auto w-full px-6 pt-4">
          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        </div>
      )}

      <div className="flex-1 max-w-6xl w-full mx-auto p-4 sm:p-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Question Navigator Rail */}
        <aside className="lg:col-span-3 space-y-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="flex items-center justify-between text-xs font-medium text-slate-500 dark:text-slate-400 mb-3">
              <span>Questions</span>
              <span className="font-mono tabular-nums">
                {answeredCount}/{questions.length} answered
              </span>
            </div>

            <div className="grid grid-cols-5 lg:grid-cols-4 gap-2">
              {questions.map((q, idx) => {
                const active = idx === currentIndex;
                const done = isAnswered(q);
                return (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => setCurrentIndex(idx)}
                    className={`h-10 rounded-lg font-mono tabular-nums text-xs font-semibold border transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600 text-white'
                        : done
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] text-xs text-slate-600 dark:text-slate-400 space-y-2">
            <div className="font-semibold text-slate-900 dark:text-slate-200">
              Question Details
            </div>
            <div>
              Type: {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Practical Coding'}
            </div>
            <div className="font-mono tabular-nums">Weight: {currentQuestion.points} pts</div>
            {currentQuestion.language && currentQuestion.type === 'coding' && (
              <div>Language: {currentQuestion.language.toUpperCase()}</div>
            )}
          </div>
        </aside>

        {/* Question Workspace */}
        <section className="lg:col-span-9 flex flex-col justify-between gap-6">
          <div className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-6">
            <div>
              <div className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">
                Question {currentIndex + 1} · {currentQuestion.type === 'mcq' ? 'Conceptual Check' : 'Code Implementation'} ·{' '}
                <span className="font-mono tabular-nums">{currentQuestion.points} points</span>
              </div>
              <h2 className="text-base sm:text-lg font-medium text-slate-900 dark:text-slate-100 leading-relaxed whitespace-pre-wrap">
                {currentQuestion.prompt}
              </h2>
            </div>

            {currentQuestion.codeSnippet && (
              <pre className="p-4 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 text-xs sm:text-sm font-mono overflow-x-auto leading-relaxed">
                <code>{currentQuestion.codeSnippet}</code>
              </pre>
            )}

            {currentQuestion.type === 'mcq' && currentQuestion.options && (
              <div className="space-y-3" role="radiogroup" aria-label="Answer options">
                {currentQuestion.options.map((option, optIdx) => {
                  const selected = currentDraft.selectedOptionIndex === optIdx;
                  return (
                    <button
                      key={optIdx}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() =>
                        setAnswers((prev) => ({
                          ...prev,
                          [currentQuestion.id]: {
                            ...currentDraft,
                            selectedOptionIndex: optIdx,
                          },
                        }))
                      }
                      className={`w-full text-left p-4 rounded-lg border text-sm transition-colors flex items-start gap-3 ${
                        selected
                          ? 'border-blue-600 bg-blue-600/10 text-slate-900 dark:text-slate-50'
                          : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <span
                        className={`w-5 h-5 rounded-full border shrink-0 mt-0.5 flex items-center justify-center text-xs font-mono ${
                          selected
                            ? 'border-blue-600 bg-blue-600 text-white'
                            : 'border-slate-400 dark:border-slate-600'
                        }`}
                      >
                        {String.fromCharCode(65 + optIdx)}
                      </span>
                      <span className="leading-relaxed">{option}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {currentQuestion.type === 'coding' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Code Editor ({currentQuestion.language || 'javascript'})
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAnswers((prev) => ({
                        ...prev,
                        [currentQuestion.id]: {
                          ...currentDraft,
                          submittedCode: currentQuestion.starterCode || '',
                        },
                      }))
                    }
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset starter code</span>
                  </button>
                </div>

                <textarea
                  value={currentDraft.submittedCode}
                  onChange={(e) =>
                    setAnswers((prev) => ({
                      ...prev,
                      [currentQuestion.id]: {
                        ...currentDraft,
                        submittedCode: e.target.value,
                      },
                    }))
                  }
                  onKeyDown={handleCodeKeyDown}
                  spellCheck={false}
                  rows={12}
                  aria-label="Solution code editor"
                  className="w-full p-4 rounded-lg bg-slate-950 text-slate-100 border border-slate-800 font-mono text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-blue-600"
                />

                {currentQuestion.sampleTests && currentQuestion.sampleTests.length > 0 && (
                  <div className="p-4 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-[#0B0F17] text-xs space-y-1.5">
                    <div className="font-semibold text-slate-700 dark:text-slate-300">
                      Verified Test Expectations
                    </div>
                    {currentQuestion.sampleTests.map((desc, i) => (
                      <div key={i} className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span>{desc}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Bottom Navigation Bar */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              disabled={currentIndex === 0}
              onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Previous</span>
            </button>

            {currentIndex < questions.length - 1 ? (
              <button
                type="button"
                onClick={() => setCurrentIndex((i) => Math.min(questions.length - 1, i + 1))}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 hover:opacity-90 transition-opacity"
              >
                <span>Next Question</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                disabled={submitting}
                onClick={() => setConfirmOpen(true)}
                className="px-5 py-2 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                Review & Submit
              </button>
            )}
          </div>
        </section>
      </div>

      {/* In-app Submit Confirmation Modal */}
      {confirmOpen && (
        <div
          className="fixed inset-0 z-50 bg-slate-950/70 flex items-center justify-center p-4"
          role="dialog"
          aria-modal="true"
          aria-labelledby="confirm-submit-title"
        >
          <div className="max-w-md w-full p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-4">
            <h2 id="confirm-submit-title" className="font-display text-lg font-semibold">
              Submit Assessment?
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              You have answered{' '}
              <span className="font-mono font-semibold text-slate-900 dark:text-slate-100">
                {answeredCount} of {questions.length}
              </span>{' '}
              questions. Once submitted, your code will be executed against test assertions and your SkillProof score will be updated.
            </p>
            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                Continue Editing
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={() => void handleSubmit()}
                className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white"
              >
                {submitting ? 'Submitting...' : 'Confirm Submit'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
