import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AlertCircle, CheckCircle2, Search, XCircle } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { api, extractErrorMessage } from '../services/api';
import type { AssessmentHistoryItem, SkillAnalyticsResponse } from '../types';
import { formatDurationSeconds, formatShortDate, getScoreTierLabel } from '../utils/format';

export function AnalyticsPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<SkillAnalyticsResponse | null>(null);
  const [history, setHistory] = useState<AssessmentHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [historyFilter, setHistoryFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          api.get<SkillAnalyticsResponse>('/skills/analytics'),
          api.get<{ history: AssessmentHistoryItem[] }>('/assessments/history'),
        ]);
        if (!active) return;
        setAnalytics(analyticsRes.data);
        setHistory(historyRes.data.history);
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
  }, []);

  if (loading) {
    return (
      <DashboardLayout breadcrumb="Workspace / Skill Analytics">
        <div className="space-y-6 animate-pulse">
          <div className="h-44 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
          <div className="h-72 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout breadcrumb="Workspace / Skill Analytics">
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h1 className="font-semibold">Unable to load skill analytics</h1>
            <p className="text-sm mt-1">{error}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const uniqueSkills = ['All', ...Array.from(new Set(history.map((h) => h.skill)))];
  const filteredHistory = history.filter((item) => {
    if (historyFilter !== 'All' && item.skill !== historyFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        item.assessmentTitle.toLowerCase().includes(q) ||
        item.skill.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const categoryChartData = analytics.categoryScores.map((c) => ({
    name: c.category
      .replace('Programming Fundamentals', 'Fundamentals')
      .replace('Frontend Development', 'Frontend')
      .replace('Backend Development', 'Backend')
      .replace('Database Management', 'Databases')
      .replace('Data Structures & Algorithms', 'DSA')
      .replace('Software Engineering Concepts', 'Systems/Net'),
    score: c.score,
    attempts: c.attempts,
  }));

  return (
    <DashboardLayout breadcrumb="Workspace / Skill Analytics">
      <div className="space-y-8">
        {/* Header & Transparent Scoring Formula */}
        <section className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-4">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Verified SkillProof Index
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono tabular-nums text-5xl font-bold text-slate-900 dark:text-slate-50">
                {analytics.overallScore}
              </span>
              <span className="font-mono text-base text-slate-500 dark:text-slate-400">/ 100</span>
            </div>
            <div className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Tier: <span className="font-semibold">{getScoreTierLabel(analytics.overallScore)}</span> ·{' '}
              {analytics.assessedCategoriesCount} of {analytics.totalCategoriesCount} categories verified
            </div>
          </div>

          <div className="lg:col-span-8 lg:pl-6 lg:border-l border-slate-200 dark:border-slate-800 space-y-2">
            <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
              Transparent Scoring Methodology
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              {analytics.scoringFormula.description}
            </p>
            <div className="pt-1 flex flex-wrap gap-4 text-xs font-mono text-slate-500 dark:text-slate-400">
              <span>Beginner: 0.85x</span>
              <span>·</span>
              <span>Intermediate: 1.00x</span>
              <span>·</span>
              <span>Advanced: 1.12x</span>
            </div>
          </div>
        </section>

        {/* Category Scores Chart & Breakdown */}
        <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-1">
              Category Score Comparison
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-5">
              Aggregated performance across the 6 engineering domains
            </p>
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryChartData} layout="vertical" margin={{ left: 16, right: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.25} />
                  <XAxis type="number" domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                  <YAxis
                    type="category"
                    dataKey="name"
                    width={100}
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0F172A',
                      borderColor: '#1E293B',
                      borderRadius: '8px',
                      color: '#F8FAFC',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="score" name="Category Score" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="lg:col-span-5 p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Category Breakdown
            </h2>
            <div className="space-y-4">
              {analytics.categoryScores.map((cat) => (
                <div key={cat.category} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-800 dark:text-slate-200">
                      {cat.category}
                    </span>
                    <span className="font-mono tabular-nums text-slate-600 dark:text-slate-300">
                      {cat.attempts > 0 ? `${cat.score}/100 (${cat.attempts} runs)` : 'Not assessed'}
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div
                      className="h-full bg-blue-600 rounded-full transition-all"
                      style={{ width: `${cat.score}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Per-Skill Breakdown */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Individual Skill Performance
            </h2>
            <Link
              to="/assessments"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              Improve a skill
            </Link>
          </div>
          {analytics.skillBreakdown.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No skills assessed yet. Complete an assessment to unlock per-skill breakdowns.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Skill</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Attempts</th>
                    <th className="py-3 px-4 text-right">Average</th>
                    <th className="py-3 px-4 text-right">Best</th>
                    <th className="py-3 px-6 text-right">Latest</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {analytics.skillBreakdown.map((sk) => (
                    <tr key={sk.skill} className="hover:bg-slate-50 dark:hover:bg-slate-800/30">
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100">
                        {sk.skill}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {sk.category}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums">
                        {sk.attempts}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {sk.averageScore}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                        {sk.bestScore}%
                      </td>
                      <td className="py-3 px-6 text-right font-mono tabular-nums">
                        {sk.latestScore}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Full Assessment History */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Complete Assessment History
            </h2>

            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search history..."
                  className="pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <select
                aria-label="Filter history by skill"
                value={historyFilter}
                onChange={(e) => setHistoryFilter(e.target.value)}
                className="px-3 py-1.5 text-xs rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17]"
              >
                {uniqueSkills.map((s) => (
                  <option key={s} value={s}>
                    {s === 'All' ? 'All Assessed Skills' : s}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filteredHistory.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              {history.length === 0
                ? 'You have not completed any assessments yet.'
                : 'No assessment history entries match your filter.'}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Assessment</th>
                    <th className="py-3 px-4">Skill · Difficulty</th>
                    <th className="py-3 px-4">Outcome</th>
                    <th className="py-3 px-4 text-right">Points</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-4 text-right">Time</th>
                    <th className="py-3 px-6 text-right">Completed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {filteredHistory.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => navigate(`/assessments/attempts/${item.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100">
                        {item.assessmentTitle}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300 text-xs">
                        {item.skill} · {item.difficulty}
                      </td>
                      <td className="py-3 px-4">
                        {item.passed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                        {item.rawScore}/{item.maxScore}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold">
                        {item.percentageScore}%
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-xs text-slate-600 dark:text-slate-300">
                        {formatDurationSeconds(item.timeSpentSeconds)}
                      </td>
                      <td className="py-3 px-6 text-right text-xs text-slate-500 dark:text-slate-400">
                        {formatShortDate(item.completedAt)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </DashboardLayout>
  );
}
