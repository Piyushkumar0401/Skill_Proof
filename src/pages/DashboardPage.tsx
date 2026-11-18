import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  Sparkles,
  TrendingUp,
  XCircle,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { api, extractErrorMessage } from '../services/api';
import type { SkillAnalyticsResponse, SkillHistoryEntry } from '../types';
import { formatDurationSeconds, formatShortDate, getScoreTierLabel } from '../utils/format';

export function DashboardPage() {
  const navigate = useNavigate();
  const [analytics, setAnalytics] = useState<SkillAnalyticsResponse | null>(null);
  const [history, setHistory] = useState<SkillHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      setError('');
      try {
        const [analyticsRes, historyRes] = await Promise.all([
          api.get<SkillAnalyticsResponse>('/skills/analytics'),
          api.get<{ history: SkillHistoryEntry[] }>('/skills/history'),
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
      <DashboardLayout>
        <div className="space-y-6 animate-pulse">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((n) => (
              <div
                key={n}
                className="h-28 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]"
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
            <div className="h-80 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]" />
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !analytics) {
    return (
      <DashboardLayout>
        <div className="p-6 rounded-xl border border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h2 className="font-semibold">Could not load dashboard metrics</h2>
            <p className="text-sm mt-1">{error || 'Unknown error loading skill analytics.'}</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const radarData = analytics.categoryScores.map((c) => ({
    subject: c.category
      .replace('Programming Fundamentals', 'Fundamentals')
      .replace('Frontend Development', 'Frontend')
      .replace('Backend Development', 'Backend')
      .replace('Database Management', 'Databases')
      .replace('Data Structures & Algorithms', 'DSA')
      .replace('Software Engineering Concepts', 'Systems & Net'),
    score: c.score,
    fullMark: 100,
  }));

  const progressData = history.map((h, idx) => ({
    index: `#${idx + 1}`,
    date: formatShortDate(h.recordedAt),
    skill: h.skill,
    assessmentScore: h.assessmentScore,
    overallScore: h.overallScoreAfter,
  }));

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Top KPI Strip */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Overall SkillProof Score
            </div>
            <div className="mt-2 flex items-baseline gap-2">
              <span className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-slate-50">
                {analytics.overallScore}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">/ 100</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {getScoreTierLabel(analytics.overallScore)} · {analytics.assessedCategoriesCount}/
              {analytics.totalCategoriesCount} categories verified
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Assessments Completed
            </div>
            <div className="mt-2 font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-slate-50">
              {analytics.totalAssessments}
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              {analytics.passedCount} passed · {analytics.totalAssessments - analytics.passedCount} below threshold
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Average Assessment Score
            </div>
            <div className="mt-2 flex items-baseline gap-1">
              <span className="font-mono tabular-nums text-3xl font-bold text-slate-900 dark:text-slate-50">
                {analytics.averageScore}
              </span>
              <span className="text-sm text-slate-500 dark:text-slate-400 font-mono">%</span>
            </div>
            <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
              Across all completed submissions
            </div>
          </div>

          <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col justify-between">
            <div className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Next Action
            </div>
            <div className="mt-2 text-sm font-medium text-slate-900 dark:text-slate-100">
              {analytics.totalAssessments === 0
                ? 'Complete your first diagnostic'
                : analytics.weakestSkills[0]
                ? `Reinforce ${analytics.weakestSkills[0].skill}`
                : 'Expand unassessed categories'}
            </div>
            <Link
              to="/assessments"
              className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
            >
              <span>Browse assessments</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </section>

        {/* Empty state prompt when zero assessments exist yet */}
        {analytics.totalAssessments === 0 && (
          <section className="p-6 sm:p-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <h2 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100">
                No verified assessment results yet
              </h2>
              <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
                Your SkillProof score and category analytics are computed strictly from completed assessments stored in MongoDB. Take a timed assessment to populate your radar chart, progress trajectory, and AI improvement plan.
              </p>
            </div>
            <Link
              to="/assessments"
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              <ClipboardCheck className="w-4 h-4" />
              <span>Take First Assessment</span>
            </Link>
          </section>
        )}

        {/* Charts Row */}
        <section className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Skill Category Distribution
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Verified proficiency across the 6 core engineering dimensions
                </p>
              </div>
              <Link
                to="/analytics"
                className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline whitespace-nowrap"
              >
                Formula details
              </Link>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="72%" data={radarData}>
                  <PolarGrid stroke="#334155" strokeOpacity={0.35} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{ fill: '#94A3B8', fontSize: 12 }}
                  />
                  <PolarRadiusAxis
                    angle={30}
                    domain={[0, 100]}
                    tick={{ fill: '#64748B', fontSize: 10 }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#3B82F6"
                    fill="#3B82F6"
                    fillOpacity={0.25}
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
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  Performance Progress
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Assessment score vs cumulative SkillProof index over time
                </p>
              </div>
              <TrendingUp className="w-4 h-4 text-slate-400" />
            </div>

            {progressData.length === 0 ? (
              <div className="h-72 flex flex-col items-center justify-center text-center px-4 text-sm text-slate-500 dark:text-slate-400">
                Complete at least one assessment to plot your score progression over time.
              </div>
            ) : (
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={progressData}>
                    <defs>
                      <linearGradient id="overallGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" strokeOpacity={0.25} />
                    <XAxis dataKey="index" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <YAxis domain={[0, 100]} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0F172A',
                        borderColor: '#1E293B',
                        borderRadius: '8px',
                        color: '#F8FAFC',
                        fontSize: '12px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="overallScore"
                      name="SkillProof Score"
                      stroke="#3B82F6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#overallGrad)"
                    />
                    <Area
                      type="monotone"
                      dataKey="assessmentScore"
                      name="Assessment Score"
                      stroke="#10B981"
                      strokeWidth={2}
                      fillOpacity={0}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </section>

        {/* Strongest & Weakest Skills + AI Suggestions */}
        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Strongest Technical Skills
            </h2>
            {analytics.strongestSkills.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Score 70% or higher on assessments to establish verified strengths.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {analytics.strongestSkills.map((item) => (
                  <li key={item.skill} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.skill}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} · {item.attempts} {item.attempts === 1 ? 'attempt' : 'attempts'}
                      </div>
                    </div>
                    <div className="font-mono tabular-nums text-sm font-semibold text-emerald-600 dark:text-emerald-400">
                      {item.averageScore}%
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100 mb-4">
              Weakest Technical Areas
            </h2>
            {analytics.weakestSkills.length === 0 ? (
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Complete assessments to identify skills needing deeper study.
              </p>
            ) : (
              <ul className="divide-y divide-slate-200 dark:divide-slate-800">
                {analytics.weakestSkills.map((item) => (
                  <li key={item.skill} className="py-3 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
                        {item.skill}
                      </div>
                      <div className="text-xs text-slate-500 dark:text-slate-400">
                        {item.category} · Best {item.bestScore}%
                      </div>
                    </div>
                    <div
                      className={`font-mono tabular-nums text-sm font-semibold ${
                        item.averageScore < 65
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {item.averageScore}%
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                  AI Improvement Suggestions
                </h2>
                <Sparkles className="w-4 h-4 text-blue-500" />
              </div>
              {analytics.aiSuggestions.length > 0 ? (
                <ul className="space-y-2.5 text-sm text-slate-600 dark:text-slate-300">
                  {analytics.aiSuggestions.slice(0, 3).map((rec, i) => (
                    <li key={i} className="leading-relaxed">
                      • {rec}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed">
                  {analytics.recentAttempts[0]
                    ? 'Open your latest assessment result to run an evidence-backed Gemini evaluation, or ask the AI Learning Assistant for targeted next steps.'
                    : 'Once you complete an assessment, Gemini will analyze your code and answers to generate actionable improvement advice here.'}
                </p>
              )}
            </div>
            <div className="mt-5 pt-4 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between">
              <Link
                to="/assistant"
                className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
              >
                Open AI Learning Assistant
              </Link>
              {analytics.recentAttempts[0] && !analytics.recentAttempts[0].hasAiEvaluation && (
                <Link
                  to={`/assessments/attempts/${analytics.recentAttempts[0].id}`}
                  className="text-xs font-medium text-slate-600 dark:text-slate-300 hover:underline"
                >
                  Evaluate latest attempt
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Recent Assessment Activity Table */}
        <section className="rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Recent Assessment Activity
            </h2>
            <Link
              to="/analytics"
              className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline"
            >
              View full history
            </Link>
          </div>

          {analytics.recentAttempts.length === 0 ? (
            <div className="p-8 text-center text-sm text-slate-500 dark:text-slate-400">
              No assessment attempts recorded yet.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-500 dark:text-slate-400">
                    <th className="py-3 px-6">Assessment</th>
                    <th className="py-3 px-4">Skill</th>
                    <th className="py-3 px-4">Difficulty</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Duration</th>
                    <th className="py-3 px-4 text-right">Score</th>
                    <th className="py-3 px-6 text-right">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800 text-sm">
                  {analytics.recentAttempts.map((attempt) => (
                    <tr
                      key={attempt.id}
                      onClick={() => navigate(`/assessments/attempts/${attempt.id}`)}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors"
                    >
                      <td className="py-3 px-6 font-medium text-slate-900 dark:text-slate-100">
                        {attempt.assessmentTitle}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {attempt.skill}
                      </td>
                      <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                        {attempt.difficulty}
                      </td>
                      <td className="py-3 px-4">
                        {attempt.passed ? (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Passed</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Review</span>
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-600 dark:text-slate-300">
                        {formatDurationSeconds(attempt.timeSpentSeconds)}
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums font-semibold text-slate-900 dark:text-slate-100">
                        {attempt.percentageScore}%
                      </td>
                      <td className="py-3 px-6 text-right text-xs text-slate-500 dark:text-slate-400">
                        {formatShortDate(attempt.completedAt)}
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
