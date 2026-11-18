import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Clock, Plus, Search, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { api, extractErrorMessage } from '../services/api';
import type { AssessmentListItem, DifficultyLevel } from '../types';

const SKILLS = [
  'All',
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
];

const DIFFICULTIES: Array<'All' | DifficultyLevel> = [
  'All',
  'Beginner',
  'Intermediate',
  'Advanced',
];

export function AssessmentsPage() {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<AssessmentListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [selectedSkill, setSelectedSkill] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | DifficultyLevel>('All');
  const [search, setSearch] = useState('');
  const [supplementingId, setSupplementingId] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState('');

  const fetchAssessments = async () => {
    setLoading(true);
    setError('');
    try {
      const { data } = await api.get<{ assessments: AssessmentListItem[] }>('/assessments');
      setAssessments(data.assessments);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void fetchAssessments();
  }, []);

  const handleSupplement = async (assessmentId: string) => {
    setSupplementingId(assessmentId);
    setActionMessage('');
    setError('');
    try {
      const { data } = await api.post<{ addedCount: number }>(
        `/assessments/${assessmentId}/supplement`
      );
      setActionMessage(`Added ${data.addedCount} Gemini-generated practice questions to the assessment.`);
      await fetchAssessments();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSupplementingId(null);
    }
  };

  const filtered = assessments.filter((item) => {
    if (selectedSkill !== 'All' && item.skill !== selectedSkill) return false;
    if (selectedDifficulty !== 'All' && item.difficulty !== selectedDifficulty) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      const hit =
        item.title.toLowerCase().includes(q) ||
        item.skill.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.topics.some((t) => t.toLowerCase().includes(q));
      if (!hit) return false;
    }
    return true;
  });

  return (
    <DashboardLayout breadcrumb="Workspace / Assessments">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              Technical Assessments
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Select a skill track and complete timed conceptual and coding challenges.
            </p>
          </div>
          <div className="text-xs font-mono tabular-nums text-slate-500 dark:text-slate-400">
            Showing {filtered.length} of {assessments.length} assessments
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col lg:flex-row gap-4 lg:items-center justify-between">
          <div className="flex flex-col sm:flex-row gap-3 flex-1">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search title, skill, or topic..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <select
              aria-label="Filter by skill"
              value={selectedSkill}
              onChange={(e) => setSelectedSkill(e.target.value)}
              className="px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              {SKILLS.map((s) => (
                <option key={s} value={s}>
                  {s === 'All' ? 'All Skills (10)' : s}
                </option>
              ))}
            </select>
          </div>

          <div
            role="group"
            aria-label="Filter by difficulty"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-lg border border-slate-200 dark:border-slate-800 self-start"
          >
            {DIFFICULTIES.map((diff) => (
              <button
                key={diff}
                type="button"
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                  selectedDifficulty === diff
                    ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {actionMessage && (
          <div className="p-3.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 text-sm flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{actionMessage}</span>
          </div>
        )}

        {error && (
          <div className="p-3.5 rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 text-sm flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-52 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] animate-pulse"
              />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              No assessments match the selected filters.
            </p>
            <button
              type="button"
              onClick={() => {
                setSelectedSkill('All');
                setSelectedDifficulty('All');
                setSearch('');
              }}
              className="mt-3 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              Reset filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filtered.map((item) => (
              <article
                key={item.id}
                className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col justify-between gap-5"
              >
                <div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-2 flex flex-wrap items-center gap-1.5">
                    <span className="font-medium text-slate-700 dark:text-slate-300">
                      {item.skill}
                    </span>
                    <span aria-hidden="true">·</span>
                    <span>{item.difficulty}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.category}</span>
                  </div>

                  <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                    {item.title}
                  </h2>

                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {item.description}
                  </p>

                  <div className="mt-4 text-xs text-slate-500 dark:text-slate-400">
                    Topics: {item.topics.join(' · ')}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-3 font-mono tabular-nums">
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {item.durationMinutes} min
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {item.questionMix.mcq} MCQ / {item.questionMix.coding} Coding
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>Pass {item.passingScore}%</span>
                    </div>

                    {item.userStats.attempts > 0 && (
                      <Link
                        to={`/assessments/attempts/${item.userStats.lastAttemptId}`}
                        className={`font-mono tabular-nums font-semibold hover:underline ${
                          item.userStats.passed
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-600 dark:text-amber-400'
                        }`}
                      >
                        Best: {item.userStats.bestScore}%
                      </Link>
                    )}
                  </div>

                  <div className="flex items-center gap-2.5">
                    <button
                      type="button"
                      onClick={() => navigate(`/assessments/${item.id}/take`)}
                      className="flex-1 py-2 px-4 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap"
                    >
                      {item.userStats.attempts > 0 ? 'Retake Assessment' : 'Start Assessment'}
                    </button>

                    <button
                      type="button"
                      disabled={supplementingId === item.id}
                      onClick={() => void handleSupplement(item.id)}
                      title="Use Gemini to add 2 fresh practice questions to this assessment"
                      className="py-2 px-3 text-xs font-medium rounded-lg border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap"
                    >
                      {supplementingId === item.id ? (
                        <>
                          <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <>
                          <Plus className="w-3.5 h-3.5" />
                          <span>AI Supplement</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
