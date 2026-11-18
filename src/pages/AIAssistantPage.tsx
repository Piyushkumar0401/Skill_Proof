import { useState, type FormEvent } from 'react';
import { AlertCircle, Bot, Compass, Send, Sparkles } from 'lucide-react';
import { DashboardLayout } from '../layouts/DashboardLayout';
import { api, extractErrorMessage } from '../services/api';
import type { GeneratedRoadmap } from '../types';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_PROMPTS = [
  'What are my weakest technical areas?',
  'What should I learn next?',
  'How can I improve my JavaScript?',
  'What should I study to become a full-stack developer?',
  'Why did I receive my latest assessment score?',
];

export function AIAssistantPage() {
  const [activeTab, setActiveTab] = useState<'chat' | 'roadmap'>('chat');

  // Chat state
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content:
        'Ask me about your verified SkillProof scores, assessment mistakes, or what engineering topics to prioritize next. All answers use your actual assessment history in MongoDB.',
    },
  ]);
  const [input, setInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [chatError, setChatError] = useState('');

  // Roadmap state
  const [focusGoal, setFocusGoal] = useState('');
  const [roadmap, setRoadmap] = useState<GeneratedRoadmap | null>(null);
  const [roadmapLoading, setRoadmapLoading] = useState(false);
  const [roadmapError, setRoadmapError] = useState('');

  const sendMessage = async (text: string) => {
    const trimmed = text.trim();
    if (!trimmed || chatLoading) return;

    const nextMessages: ChatMessage[] = [...messages, { role: 'user', content: trimmed }];
    setMessages(nextMessages);
    setInput('');
    setChatError('');
    setChatLoading(true);

    try {
      const { data } = await api.post<{ reply: string }>('/ai/chat', {
        messages: nextMessages.filter((m, idx) => !(idx === 0 && m.role === 'assistant')),
      });
      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      setChatError(extractErrorMessage(err));
    } finally {
      setChatLoading(false);
    }
  };

  const handleChatSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleGenerateRoadmap = async (e: FormEvent) => {
    e.preventDefault();
    setRoadmapLoading(true);
    setRoadmapError('');
    try {
      const { data } = await api.post<{ roadmap: GeneratedRoadmap }>('/ai/roadmap', {
        focusGoal: focusGoal.trim() || undefined,
      });
      setRoadmap(data.roadmap);
    } catch (err) {
      setRoadmapError(extractErrorMessage(err));
    } finally {
      setRoadmapLoading(false);
    }
  };

  return (
    <DashboardLayout breadcrumb="Workspace / AI Learning Assistant">
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-slate-50">
              AI Learning Assistant
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
              Grounded in your SkillProof assessment history, missed questions, and category analytics.
            </p>
          </div>

          <div
            role="tablist"
            className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-[#111722] rounded-lg border border-slate-200 dark:border-slate-800 self-start"
          >
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'chat'}
              onClick={() => setActiveTab('chat')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'chat'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Skill Coach Chat</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'roadmap'}
              onClick={() => setActiveTab('roadmap')}
              className={`inline-flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
                activeTab === 'roadmap'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              <span>Learning Roadmap</span>
            </button>
          </div>
        </div>

        {activeTab === 'chat' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Suggested Prompts */}
            <aside className="lg:col-span-4 space-y-4">
              <div className="p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-3">
                <h2 className="font-display text-sm font-semibold text-slate-900 dark:text-slate-100">
                  Diagnostic Prompts
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Click any question to query Gemini with your verified assessment profile.
                </p>
                <div className="space-y-2 pt-1">
                  {SUGGESTED_PROMPTS.map((q) => (
                    <button
                      key={q}
                      type="button"
                      disabled={chatLoading}
                      onClick={() => void sendMessage(q)}
                      className="w-full text-left p-3 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              </div>
            </aside>

            {/* Chat Thread */}
            <section className="lg:col-span-8 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col min-h-[540px]">
              <div className="flex-1 p-5 sm:p-6 space-y-4 overflow-y-auto max-h-[560px]">
                {messages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-200'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}

                {chatLoading && (
                  <div className="flex justify-start">
                    <div className="rounded-xl px-4 py-3 text-sm bg-slate-100 dark:bg-[#0B0F17] border border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400">
                      Reviewing your assessment history...
                    </div>
                  </div>
                )}

                {chatError && (
                  <div className="p-3.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{chatError}</span>
                  </div>
                )}
              </div>

              <form
                onSubmit={handleChatSubmit}
                className="p-4 border-t border-slate-200 dark:border-slate-800 flex items-center gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask about your scores, missed questions, or next study topic..."
                  className="flex-1 px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
                <button
                  type="submit"
                  disabled={chatLoading || !input.trim()}
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white transition-colors whitespace-nowrap"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send</span>
                </button>
              </form>
            </section>
          </div>
        ) : (
          <div className="space-y-6">
            <form
              onSubmit={handleGenerateRoadmap}
              className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] flex flex-col sm:flex-row gap-4 sm:items-end"
            >
              <div className="flex-1">
                <label
                  htmlFor="roadmap-goal"
                  className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5"
                >
                  Optional Focus Goal (e.g., "Prepare for senior backend interviews" or "Master async JS & MongoDB")
                </label>
                <input
                  id="roadmap-goal"
                  type="text"
                  value={focusGoal}
                  onChange={(e) => setFocusGoal(e.target.value)}
                  placeholder="Leave blank to optimize automatically around your weakest SkillProof categories"
                  className="w-full px-3.5 py-2.5 text-sm rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#0B0F17] focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>
              <button
                type="submit"
                disabled={roadmapLoading}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white transition-colors whitespace-nowrap shrink-0"
              >
                <Sparkles className={`w-3.5 h-3.5 ${roadmapLoading ? 'animate-spin' : ''}`} />
                <span>{roadmapLoading ? 'Building Roadmap...' : 'Generate Personalized Roadmap'}</span>
              </button>
            </form>

            {roadmapError && (
              <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-800 dark:text-amber-200 text-sm flex items-start gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{roadmapError}</span>
              </div>
            )}

            {!roadmap && !roadmapLoading && !roadmapError && (
              <div className="p-10 text-center rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] text-sm text-slate-600 dark:text-slate-400">
                Click <span className="font-semibold text-slate-900 dark:text-slate-200">Generate Personalized Roadmap</span> to build a 4-phase engineering study plan based on your verified scores and target track.
              </div>
            )}

            {roadmap && (
              <div className="space-y-6">
                <div className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722]">
                  <div className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                    Track: {roadmap.targetTrack}
                  </div>
                  <h2 className="font-display text-xl font-bold text-slate-900 dark:text-slate-50">
                    {roadmap.headline}
                  </h2>
                  <p className="text-sm text-slate-600 dark:text-slate-400 mt-2 leading-relaxed">
                    {roadmap.rationale}
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {roadmap.phases.map((p, idx) => (
                    <div
                      key={idx}
                      className="p-6 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111722] space-y-3"
                    >
                      <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {p.phase}
                        </span>
                        <span className="font-mono">{p.timeframe}</span>
                      </div>
                      <h3 className="font-display text-base font-semibold text-slate-900 dark:text-slate-100">
                        {p.focusSkill}: {p.objective}
                      </h3>
                      <ul className="space-y-1.5 text-sm text-slate-600 dark:text-slate-300">
                        {p.actionItems.map((item, i) => (
                          <li key={i}>• {item}</li>
                        ))}
                      </ul>
                      <div className="pt-3 border-t border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
                        <span className="font-semibold text-slate-900 dark:text-slate-200">
                          Verification Milestone:{' '}
                        </span>
                        {p.practiceMilestone}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
