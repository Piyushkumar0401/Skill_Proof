import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Code2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export function LandingPage() {
  const { user } = useAuth();
  const [heroImgFailed, setHeroImgFailed] = useState(false);
  const [portraitImgFailed, setPortraitImgFailed] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 dark:bg-[#0B0F17] dark:text-slate-100">
      {/* Top Bar Contract: 3 zones separated by gap-8 */}
      <header className="border-b border-slate-200 dark:border-slate-800/80 bg-white/90 dark:bg-[#0B0F17]/90 backdrop-blur-sm sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between gap-8">
          <Link
            to="/"
            className="font-display text-lg font-bold tracking-tight text-slate-900 dark:text-slate-100 whitespace-nowrap shrink-0"
          >
            SkillProof
          </Link>

          <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-600 dark:text-slate-300">
            <a
              href="#capabilities"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Assessments
            </a>
            <a
              href="#scoring"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              Scoring
            </a>
            <a
              href="#calibration"
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              AI Coach
            </a>
            <Link
              to={user ? '/dashboard' : '/login'}
              className="hover:text-slate-900 dark:hover:text-white hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Workspace' : 'Sign In'}
            </Link>
          </nav>

          <div className="shrink-0">
            <Link
              to={user ? '/dashboard' : '/register'}
              className="inline-flex items-center px-4 py-2 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap shrink-0"
            >
              {user ? 'Open Dashboard' : 'Start Verification'}
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section: 2-Column Balanced Split */}
      <section className="max-w-7xl mx-auto px-6 pt-12 pb-16 lg:pt-20 lg:pb-20">
        <div className="grid lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
          <div className="lg:col-span-6 flex flex-col justify-center">
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-4">
              Technical Skill Verification · Practical Coding & Systems Diagnostics
            </p>
            <h1 className="font-display text-[clamp(2.25rem,4vw,3.5rem)] font-bold tracking-tight leading-[1.08] text-slate-900 dark:text-slate-50 text-balance mb-6">
              Measure verified engineering skill, not self-reported keywords.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-xl mb-8">
              SkillProof evaluates developers through timed multiple-choice and sandboxed coding assessments across 10 core engineering disciplines, producing a transparent score out of 100 and evidence-backed Gemini diagnostics.
            </p>
            <div className="flex flex-wrap items-center gap-5">
              <Link
                to={user ? '/assessments' : '/register'}
                className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-colors whitespace-nowrap"
              >
                <span>{user ? 'Take an Assessment' : 'Verify Your Skills'}</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                to={user ? '/dashboard' : '/login'}
                className="text-sm font-medium text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white underline underline-offset-4 whitespace-nowrap"
              >
                {user ? 'View Developer Dashboard' : 'Sign in to existing account'}
              </Link>
            </div>
          </div>

          <div className="lg:col-span-6">
            <div className="h-full min-h-[280px] lg:min-h-[400px] rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
              {!heroImgFailed ? (
                <img
                  src="/src/assets/images/hero_skillproof_workbench_1795001357490.jpg"
                  alt="Software engineering workstation displaying code editor and SkillProof verification telemetry"
                  referrerPolicy="no-referrer"
                  onError={() => setHeroImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-8 bg-gradient-to-br from-slate-900 via-[#111827] to-slate-950 text-slate-300">
                  <Code2 className="w-10 h-10 text-blue-400 mb-3" />
                  <p className="text-sm font-medium">SkillProof Engineering Workbench</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 4-column summary strip below hero */}
        <div className="mt-14 pt-10 border-t border-slate-200 dark:border-slate-800 grid grid-cols-2 lg:grid-cols-4 gap-8">
          <div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              10
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Core technical skills from JavaScript and React to DBMS and OS
            </div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              6
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Weighted SkillProof scoring categories normalized out of 100
            </div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              node:vm
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Isolated test-case execution for JavaScript & DSA coding challenges
            </div>
          </div>
          <div>
            <div className="font-mono tabular-nums text-2xl font-bold text-slate-900 dark:text-slate-100">
              Gemini
            </div>
            <div className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Evidence-grounded evaluation reports and multi-phase roadmaps
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Asymmetric Bento */}
      <section
        id="capabilities"
        className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800/80"
      >
        <div className="max-w-2xl mb-12">
          <h2 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-slate-50 text-balance">
            Built to test real implementation under realistic constraints
          </h2>
          <p className="text-base text-slate-600 dark:text-slate-400 mt-3">
            Every SkillProof assessment pairs conceptual reasoning checks with practical coding or query problems stored in MongoDB.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 p-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              01. Practical Coding & Conceptual Bank
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed mb-5">
              Assessments span JavaScript, React, Node.js, Express.js, MongoDB, Python, Data Structures & Algorithms, DBMS, Computer Networks, and Operating Systems across Beginner, Intermediate, and Advanced tracks.
            </p>
            <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
              JavaScript · React · Node.js · Express.js · MongoDB · Python · DSA · DBMS · Networks · OS
            </div>
          </div>

          <div
            id="scoring"
            className="p-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]"
          >
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              02. Transparent Scoring Formula
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Your SkillProof Score is computed deterministically from verified assessment results, weighted by difficulty depth (0.85x Beginner, 1.00x Intermediate, 1.12x Advanced) and recency.
            </p>
          </div>

          <div className="p-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              03. Evidence-Backed AI Diagnostics
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Gemini reviews the exact questions you missed, your submitted code, and unit-test failures to surface conceptual gaps, time complexity insights, and concrete fixes.
            </p>
          </div>

          <div className="md:col-span-2 p-7 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
            <h3 className="font-display text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2">
              04. Grounded AI Learning Coach & Roadmaps
            </h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Ask why you received a score, inspect your weakest categories, or generate a 4-phase study roadmap calibrated directly against your MongoDB SkillHistory and recent attempt telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* Proof & Calibration */}
      <section
        id="calibration"
        className="max-w-7xl mx-auto px-6 py-16 border-t border-slate-200 dark:border-slate-800/80"
      >
        <div className="grid lg:grid-cols-12 gap-10 items-center">
          <div className="lg:col-span-4">
            <div className="aspect-square max-w-xs rounded-xl overflow-hidden border border-slate-200 dark:border-slate-800 bg-slate-900">
              {!portraitImgFailed ? (
                <img
                  src="/src/assets/images/engineer_portrait_proof_1795001358609.jpg"
                  alt="Kenji Takahashi, Principal Systems Engineer"
                  referrerPolicy="no-referrer"
                  onError={() => setPortraitImgFailed(true)}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-300 text-sm">
                  Engineering Benchmark Reviewer
                </div>
              )}
            </div>
          </div>
          <div className="lg:col-span-8">
            <blockquote className="text-lg sm:text-xl font-medium text-slate-900 dark:text-slate-100 leading-relaxed mb-5">
              “Resumes list React and Node.js indiscriminately. When our backend cohort moved from self-assessed checklists to timed SkillProof diagnostics, candidates cut blind spots in async event-loop behavior and MongoDB indexing by 41% within three assessment cycles.”
            </blockquote>
            <div className="text-sm text-slate-600 dark:text-slate-400">
              <span className="font-semibold text-slate-900 dark:text-slate-200">
                Kenji Takahashi
              </span>
              <span className="mx-2" aria-hidden="true">·</span>
              <span>Principal Systems Architect, Veridian Cloud Engineering</span>
            </div>
          </div>
        </div>
      </section>

      {/* Quiet Footer */}
      <footer className="border-t border-slate-200 dark:border-slate-800/80 py-10">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-slate-500 dark:text-slate-400">
          <div className="font-display font-semibold text-slate-900 dark:text-slate-200">
            SkillProof
          </div>
          <div className="flex items-center gap-6">
            <Link to="/login" className="hover:text-slate-900 dark:hover:text-slate-200">
              Sign In
            </Link>
            <Link to="/register" className="hover:text-slate-900 dark:hover:text-slate-200">
              Create Account
            </Link>
            <Link to="/assessments" className="hover:text-slate-900 dark:hover:text-slate-200">
              Assessments
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
