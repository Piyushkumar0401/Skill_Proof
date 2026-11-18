import { useState, type FormEvent } from 'react';
import { AlertCircle, CheckCircle2, Moon, Sun } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api, extractErrorMessage } from '../services/api';
import type { DifficultyLevel, User } from '../types';

const ALL_SKILLS = [
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

const TRACK_OPTIONS = [
  'Full-Stack Developer',
  'Frontend Engineer',
  'Backend Engineer',
  'Systems & Cloud Engineer',
  'Data & Algorithms Track',
];

export function SettingsPage() {
  const { user, setUser } = useAuth();
  const { theme, setTheme } = useTheme();

  const [name, setName] = useState(user?.name || '');
  const [headline, setHeadline] = useState(user?.headline || '');
  const [targetTrack, setTargetTrack] = useState(user?.targetTrack || 'Full-Stack Developer');
  const [experienceLevel, setExperienceLevel] = useState<DifficultyLevel>(
    user?.experienceLevel || 'Intermediate'
  );
  const [preferredSkills, setPreferredSkills] = useState<string[]>(user?.preferredSkills || []);

  const [profileSaving, setProfileSaving] = useState(false);
  const [profileStatus, setProfileStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(
    null
  );

  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwSaving, setPwSaving] = useState(false);
  const [pwStatus, setPwStatus] = useState<{ type: 'ok' | 'err'; text: string } | null>(null);

  const toggleSkill = (skill: string) => {
    setPreferredSkills((prev) =>
      prev.includes(skill) ? prev.filter((s) => s !== skill) : [...prev, skill]
    );
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileStatus(null);
    try {
      const { data } = await api.put<{ user: User }>('/auth/profile', {
        name: name.trim(),
        headline: headline.trim(),
        targetTrack,
        experienceLevel,
        themePreference: theme,
        preferredSkills,
      });
      setUser(data.user);
      setProfileStatus({ type: 'ok', text: 'Profile settings saved to MongoDB.' });
    } catch (err) {
      setProfileStatus({ type: 'err', text: extractErrorMessage(err) });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleThemeSelect = async (next: 'dark' | 'light') => {
    setTheme(next);
    try {
      const { data } = await api.put<{ user: User }>('/auth/profile', { themePreference: next });
      setUser(data.user);
    } catch {
      // Theme remains updated locally
    }
  };

  const handlePasswordSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setPwStatus(null);
    if (newPassword.length < 8) {
      setPwStatus({ type: 'err', text: 'New password must be at least 8 characters.' });
      return;
    }
    setPwSaving(true);
    try {
      await api.put('/auth/password', { currentPassword, newPassword });
      setCurrentPassword('');
      setNewPassword('');
      setPwStatus({ type: 'ok', text: 'Password updated successfully.' });
    } catch (err) {
      setPwStatus({ type: 'err', text: extractErrorMessage(err) });
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <DashboardLayout breadcrumb="Workspace / Settings">
      <div className="max-w-3xl space-y-8">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
            Account & Preferences
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            Manage your developer profile, target track, theme, and security credentials.
          </p>
        </div>

        {/* Profile Form */}
        <form
          onSubmit={handleSaveProfile}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-5"
        >
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Developer Profile
          </h2>

          {profileStatus && (
            <div
              className={`p-3.5 rounded-lg border text-sm flex items-center gap-2 ${
                profileStatus.type === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              {profileStatus.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{profileStatus.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-name" className="block text-xs font-medium mb-1.5">
                Full Name
              </label>
              <input
                id="set-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="set-email" className="block text-xs font-medium mb-1.5">
                Email Address
              </label>
              <input
                id="set-email"
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-[#0B0F17]/60 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>

          <div>
            <label htmlFor="set-headline" className="block text-xs font-medium mb-1.5">
              Engineering Headline
            </label>
            <input
              id="set-headline"
              type="text"
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g., Full-Stack TypeScript & Distributed Systems Developer"
              className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="set-track" className="block text-xs font-medium mb-1.5">
                Target Role Track
              </label>
              <select
                id="set-track"
                value={targetTrack}
                onChange={(e) => setTargetTrack(e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {TRACK_OPTIONS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="set-level" className="block text-xs font-medium mb-1.5">
                Target Difficulty Level
              </label>
              <select
                id="set-level"
                value={experienceLevel}
                onChange={(e) => setExperienceLevel(e.target.value as DifficultyLevel)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                <option value="Beginner">Beginner</option>
                <option value="Intermediate">Intermediate</option>
                <option value="Advanced">Advanced</option>
              </select>
            </div>
          </div>

          <div>
            <div className="text-xs font-medium mb-2">Focus Skills</div>
            <div className="flex flex-wrap gap-2">
              {ALL_SKILLS.map((sk) => {
                const active = preferredSkills.includes(sk);
                return (
                  <button
                    key={sk}
                    type="button"
                    onClick={() => toggleSkill(sk)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                      active
                        ? 'border-blue-600 bg-blue-600/15 text-blue-600 dark:text-blue-400'
                        : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                    }`}
                  >
                    {sk}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={profileSaving}
              className="px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors"
            >
              {profileSaving ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </form>

        {/* Appearance */}
        <section className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
              Interface Theme
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Switch between dark navy developer mode and clean light mode.
            </p>
          </div>

          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#0B0F17] rounded-lg border border-slate-200 dark:border-slate-800 self-start">
            <button
              type="button"
              onClick={() => void handleThemeSelect('dark')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                theme === 'dark'
                  ? 'bg-slate-800 text-white shadow-sm'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              <span>Dark</span>
            </button>
            <button
              type="button"
              onClick={() => void handleThemeSelect('light')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                theme === 'light'
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              <span>Light</span>
            </button>
          </div>
        </section>

        {/* Password Change */}
        <form
          onSubmit={handlePasswordSubmit}
          className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-4"
        >
          <h2 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
            Update Password
          </h2>

          {pwStatus && (
            <div
              className={`p-3.5 rounded-lg border text-sm flex items-center gap-2 ${
                pwStatus.type === 'ok'
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-rose-500/30 bg-rose-500/10 text-rose-700 dark:text-rose-300'
              }`}
            >
              {pwStatus.type === 'ok' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span>{pwStatus.text}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="pw-current" className="block text-xs font-medium mb-1.5">
                Current Password
              </label>
              <input
                id="pw-current"
                type="password"
                required
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="pw-new" className="block text-xs font-medium mb-1.5">
                New Password
              </label>
              <input
                id="pw-new"
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Minimum 8 characters"
                className="w-full px-3.5 py-2 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={pwSaving}
            className="px-5 py-2.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-60 transition-colors"
          >
            {pwSaving ? 'Updating...' : 'Change Password'}
          </button>
        </form>
      </div>
    </DashboardLayout>
  );
}
