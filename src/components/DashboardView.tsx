/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Subject, Topic, MistakeEntry, MistakeCategory } from '../types';
import {
  BookOpen,
  Flame,
  ArrowRight,
  Award,
  AlertCircle,
  RotateCcw,
  Plus,
  Sparkles,
  TrendingUp,
  ChevronRight,
  HelpCircle,
  Trophy,
  Target,
  Crosshair,
  Quote,
  Eye,
  EyeOff,
  CheckCircle2,
  Calendar,
  RefreshCw,
  Zap,
  Sun,
  Sunset,
  Moon,
  Layers,
  X,
  Clock,
} from 'lucide-react';
import { safeSetItem, safeGetItem } from '../utils/storage';

interface DashboardViewProps {
  subjects: Subject[];
  topics?: Topic[];
  mistakes: MistakeEntry[];
  onNavigate: (view: 'dashboard' | 'topics' | 'add' | 'insights' | 'profile' | 'upgrade', targetSubjectId?: string) => void;
  onSelectMistake: (mistakeId: string) => void;
  onStartReview: (subjectId?: string, topicId?: string, categories?: MistakeCategory[]) => void;
  userName: string;
  onOpenQuickAdd?: () => void;
  onOpenOnboarding?: () => void;
  quotaReads?: number;
  quotaLimit?: number;
  isQuotaExceeded?: boolean;
  user?: any;
  isAdmin?: boolean;
  totalLiveReadsToday?: number;
  allUsers?: any[];
  isPremium?: boolean;
}

const SCHOLARLY_QUOTES = [
  { text: "Mistakes are the portals of discovery.", author: "James Joyce" },
  { text: "An expert is a person who has made all the mistakes that can be made in a very narrow field.", author: "Niels Bohr" },
  { text: "I have not failed. I've just found 10,000 ways that won't work.", author: "Thomas Edison" },
  { text: "You must not fool yourself, and you are the easiest person to fool.", author: "Richard Feynman" },
  { text: "Nothing in life is to be feared; it is only to be understood.", author: "Marie Curie" },
  { text: "The only real mistake is the one from which we learn nothing.", author: "Henry Ford" },
  { text: "We do not learn so much from good results as from our mistakes.", author: "Sir Humphry Davy" },
];

export function DashboardView({
  subjects,
  topics = [],
  mistakes,
  onNavigate,
  onSelectMistake,
  onStartReview,
  userName,
  onOpenQuickAdd,
  onOpenOnboarding,
  quotaReads = 0,
  quotaLimit = 1000,
  isQuotaExceeded = false,
  user,
  isAdmin = false,
  totalLiveReadsToday = 0,
  allUsers = [],
  isPremium = false,
}: DashboardViewProps) {
  // Feature 1: Time-Aware Greeting & Inspiring Scholarly Quotes
  const greetingInfo = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      return { text: 'Good morning', icon: Sun, color: 'text-amber-500' };
    }
    if (hour < 17) {
      return { text: 'Good afternoon', icon: Sunset, color: 'text-orange-500' };
    }
    return { text: 'Good evening', icon: Moon, color: 'text-indigo-400' };
  }, []);

  const [quoteIndex, setQuoteIndex] = useState(() => {
    return Math.floor(Math.random() * SCHOLARLY_QUOTES.length);
  });

  const nextQuote = () => {
    setQuoteIndex((prev) => (prev + 1) % SCHOLARLY_QUOTES.length);
  };

  // Feature 2: Daily Study Target & Mastery Momentum
  const [dailyTarget, setDailyTarget] = useState<number>(() => {
    const saved = safeGetItem('studyflow_daily_target');
    if (saved) {
      const parsed = parseInt(saved, 10);
      if (!isNaN(parsed) && parsed > 0 && parsed <= 30) return parsed;
    }
    return 5;
  });

  const handleSetTarget = (target: number) => {
    setDailyTarget(target);
    safeSetItem('studyflow_daily_target', target.toString());
  };

  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);

  // Today's completed reviews or logs
  const todayCount = useMemo(() => {
    return mistakes.filter((m) => m.dateLogged === todayStr).length;
  }, [mistakes, todayStr]);

  const targetProgress = Math.min(100, Math.round((todayCount / dailyTarget) * 100));
  const isTargetAchieved = todayCount >= dailyTarget;

  // Compute analytics
  const totalMistakesCount = mistakes.length;

  const newMistakesCount = useMemo(() => {
    return mistakes.filter((m) => m.status === 'New').length;
  }, [mistakes]);

  const reviewingMistakesCount = useMemo(() => {
    return mistakes.filter((m) => m.status === 'Reviewing').length;
  }, [mistakes]);

  const masteredMistakesCount = useMemo(() => {
    return mistakes.filter((m) => m.status === 'Mastered').length;
  }, [mistakes]);

  const readyForReviewCount = useMemo(() => {
    return mistakes.filter((m) => m.status !== 'Mastered').length;
  }, [mistakes]);

  const overallMasteryRate = totalMistakesCount > 0
    ? Math.round((masteredMistakesCount / totalMistakesCount) * 100)
    : 100;

  // Feature 3: Diagnostic Spotlight (High-Yield Error Attack)
  const diagnosticSpotlight = useMemo(() => {
    if (!topics || topics.length === 0 || mistakes.length === 0) return null;

    const topicMistakeMap: Record<
      string,
      {
        topic: Topic;
        subject?: Subject;
        mistakes: MistakeEntry[];
        unmastered: MistakeEntry[];
        categories: Record<string, number>;
      }
    > = {};

    topics.forEach((tp) => {
      const topicMistakes = mistakes.filter((m) => m.topicId === tp.id);
      if (topicMistakes.length > 0) {
        const unmastered = topicMistakes.filter((m) => m.status !== 'Mastered');
        const subject = subjects.find((s) => s.id === tp.subjectId);

        const catCounts: Record<string, number> = {};
        topicMistakes.forEach((m) => {
          (m.categories || []).forEach((c) => {
            catCounts[c] = (catCounts[c] || 0) + 1;
          });
        });

        topicMistakeMap[tp.id] = {
          topic: tp,
          subject,
          mistakes: topicMistakes,
          unmastered,
          categories: catCounts,
        };
      }
    });

    const entries = Object.values(topicMistakeMap);
    if (entries.length === 0) return null;

    // Prioritize topic with the most unmastered mistakes
    entries.sort((a, b) => {
      if (b.unmastered.length !== a.unmastered.length) {
        return b.unmastered.length - a.unmastered.length;
      }
      return b.mistakes.length - a.mistakes.length;
    });

    const topVulnerable = entries[0];
    if (!topVulnerable || topVulnerable.unmastered.length === 0) return null;

    const topCategoryEntry = Object.entries(topVulnerable.categories).sort((a, b) => b[1] - a[1])[0];

    return {
      topic: topVulnerable.topic,
      subject: topVulnerable.subject,
      unmasteredCount: topVulnerable.unmastered.length,
      totalCount: topVulnerable.mistakes.length,
      masteryRate: Math.round(
        ((topVulnerable.mistakes.length - topVulnerable.unmastered.length) / topVulnerable.mistakes.length) * 100
      ),
      topCategory: topCategoryEntry ? (topCategoryEntry[0] as MistakeCategory) : undefined,
    };
  }, [topics, subjects, mistakes]);

  // Feature 4: Recent Mistakes to Revisit with Quick Flip / Solution Peek
  const recentMistakes = useMemo(() => {
    return [...mistakes]
      .sort((a, b) => (b.dateLogged || '').localeCompare(a.dateLogged || ''))
      .slice(0, 3);
  }, [mistakes]);

  const [flippedCards, setFlippedCards] = useState<Record<string, boolean>>({});

  const toggleFlip = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setFlippedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Compute subject statistics
  const subjectStats = useMemo(() => {
    return subjects.map((sub) => {
      const subMistakes = mistakes.filter((m) => m.subjectId === sub.id);
      const total = subMistakes.length;
      const subNew = subMistakes.filter((m) => m.status === 'New').length;
      const subReviewing = subMistakes.filter((m) => m.status === 'Reviewing').length;
      const subMastered = subMistakes.filter((m) => m.status === 'Mastered').length;
      const masteryRate = total > 0 ? Math.round((subMastered / total) * 100) : 100;
      return {
        id: sub.id,
        name: sub.name,
        count: total,
        newCount: subNew,
        reviewingCount: subReviewing,
        masteredCount: subMastered,
        mastery: masteryRate,
      };
    });
  }, [subjects, mistakes]);

  // Sort and select top 5 subjects with most mistakes
  const topFiveSubjects = useMemo(() => {
    return [...subjectStats].sort((a, b) => b.count - a.count).slice(0, 5);
  }, [subjectStats]);

  // Mistakes in past 30 days grid generator
  const last30DaysGrid = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const count = mistakes.filter((m) => m && m.dateLogged === dateString).length;
      arr.push({
        dateString,
        dayNum: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        count,
      });
    }
    return arr;
  }, [mistakes]);

  // Feature 6: Interactive Heatmap Day Inspector
  const [selectedHeatmapDate, setSelectedHeatmapDate] = useState<string | null>(null);

  const selectedDayMistakes = useMemo(() => {
    if (!selectedHeatmapDate) return [];
    return mistakes.filter((m) => m.dateLogged === selectedHeatmapDate);
  }, [mistakes, selectedHeatmapDate]);

  // Calculate continuous consecutive days streak
  const currentStreak = useMemo(() => {
    if (!mistakes || mistakes.length === 0) return 0;
    const loggedDates = new Set(mistakes.map((m) => m && m.dateLogged).filter(Boolean));
    if (loggedDates.size === 0) return 0;

    let streak = 0;
    const today = new Date();
    const todayFormatted = today.toISOString().split('T')[0];

    let checkDate = new Date(today);
    if (!loggedDates.has(todayFormatted)) {
      checkDate.setDate(checkDate.getDate() - 1);
      const yesterdayStr = checkDate.toISOString().split('T')[0];
      if (!loggedDates.has(yesterdayStr)) {
        return 0;
      }
    }

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (loggedDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  }, [mistakes]);

  // Achievements count
  const unlockedAchievementsCount = useMemo(() => {
    let count = 0;
    const totalMistakes = mistakes.length;
    const masteredCount = mistakes.filter((m) => m.status === 'Mastered').length;
    const totalSubjects = subjects.length;
    const totalTopics = topics.length;

    if (totalMistakes >= 1) count++;
    if (totalMistakes >= 5) count++;
    if (masteredCount >= 3) count++;
    if (masteredCount >= 10) count++;
    if (totalSubjects >= 3) count++;
    if (totalTopics >= 5) count++;
    return count;
  }, [mistakes, subjects, topics]);

  // Feature 5: Color-coded Subject Styling
  const getSubjectColorTheme = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('bio') || lower.includes('life') || lower.includes('cell')) {
      return {
        bg: 'bg-emerald-50/70 hover:bg-emerald-50',
        text: 'text-emerald-950',
        border: 'border-emerald-200/80 hover:border-emerald-300',
        bar: 'bg-emerald-600',
        badge: 'bg-emerald-100 text-emerald-800',
        iconBg: 'bg-emerald-500/15 text-emerald-700',
        icon: 'biotech',
      };
    }
    if (lower.includes('chem') || lower.includes('organic')) {
      return {
        bg: 'bg-amber-50/70 hover:bg-amber-50',
        text: 'text-amber-950',
        border: 'border-amber-200/80 hover:border-amber-300',
        bar: 'bg-amber-600',
        badge: 'bg-amber-100 text-amber-800',
        iconBg: 'bg-amber-500/15 text-amber-700',
        icon: 'science',
      };
    }
    if (lower.includes('phys') || lower.includes('quantum')) {
      return {
        bg: 'bg-purple-50/70 hover:bg-purple-50',
        text: 'text-purple-950',
        border: 'border-purple-200/80 hover:border-purple-300',
        bar: 'bg-purple-600',
        badge: 'bg-purple-100 text-purple-800',
        iconBg: 'bg-purple-500/15 text-purple-700',
        icon: 'psychology',
      };
    }
    if (lower.includes('math') || lower.includes('calc') || lower.includes('algebra') || lower.includes('stat')) {
      return {
        bg: 'bg-indigo-50/70 hover:bg-indigo-50',
        text: 'text-indigo-950',
        border: 'border-indigo-200/80 hover:border-indigo-300',
        bar: 'bg-indigo-600',
        badge: 'bg-indigo-100 text-indigo-800',
        iconBg: 'bg-indigo-500/15 text-indigo-700',
        icon: 'calculate',
      };
    }
    if (lower.includes('econ') || lower.includes('biz') || lower.includes('finance')) {
      return {
        bg: 'bg-teal-50/70 hover:bg-teal-50',
        text: 'text-teal-950',
        border: 'border-teal-200/80 hover:border-teal-300',
        bar: 'bg-teal-600',
        badge: 'bg-teal-100 text-teal-800',
        iconBg: 'bg-teal-500/15 text-teal-700',
        icon: 'bar_chart',
      };
    }
    if (lower.includes('ucat') || lower.includes('med') || lower.includes('mcat')) {
      return {
        bg: 'bg-rose-50/70 hover:bg-rose-50',
        text: 'text-rose-950',
        border: 'border-rose-200/80 hover:border-rose-300',
        bar: 'bg-rose-600',
        badge: 'bg-rose-100 text-rose-800',
        iconBg: 'bg-rose-500/15 text-rose-700',
        icon: 'school',
      };
    }
    return {
      bg: 'bg-stone-50/70 hover:bg-stone-50',
      text: 'text-stone-900',
      border: 'border-[#E8E2D9] hover:border-stone-300',
      bar: 'bg-[#5A5A40]',
      badge: 'bg-stone-100 text-stone-800',
      iconBg: 'bg-[#5A5A40]/10 text-[#5A5A40]',
      icon: 'menu_book',
    };
  };

  const currentQuote = SCHOLARLY_QUOTES[quoteIndex];
  const GreetingIcon = greetingInfo.icon;

  return (
    <div className="space-y-8 animate-fade-in text-left">
      {/* SECTION 1: Time-Aware Hero & Daily Scientific Quote */}
      <section className="py-2 border-b border-[#E8E2D9] pb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
        <div className="space-y-2 max-w-2xl">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[#6B6357]">
            <GreetingIcon className={`w-4 h-4 ${greetingInfo.color}`} />
            <span>{greetingInfo.text}</span>
            <span className="text-[#9A9184]">·</span>
            <span className="text-[#5A5A40] font-mono">Scholarly Journal</span>
          </div>

          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#2D2A26] tracking-tight">
            Welcome back, {userName}.
          </h2>

          {/* Daily Scientific Quote Pill */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs text-[#6B6357] shadow-2xs group">
            <Quote className="w-3.5 h-3.5 text-[#D98A6C] shrink-0" />
            <span className="italic font-serif">"{currentQuote.text}"</span>
            <span className="font-mono text-[10px] text-[#9A9184] not-italic font-bold">
              — {currentQuote.author}
            </span>
            <button
              onClick={nextQuote}
              type="button"
              className="p-1 text-[#9A9184] hover:text-[#2D2A26] transition-colors rounded-full hover:bg-stone-200/50 cursor-pointer ml-1"
              title="Read another quote"
            >
              <RefreshCw className="w-3 h-3 group-hover:rotate-45 transition-transform" />
            </button>
          </div>
        </div>

        {/* Action Button Controls */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="px-4 py-3 bg-white hover:bg-[#F5F2ED] text-[#5A5A40] border border-[#E8E2D9] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="View step-by-step app user guide"
            >
              <HelpCircle className="w-4 h-4 text-[#D98A6C]" /> Take a Tour
            </button>
          )}

          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="px-4.5 py-3 bg-[#5A5A40] hover:bg-[#4A453E] text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-98"
              title="Add a core mistake immediately"
            >
              <Plus className="w-4 h-4" /> Quick Add Mistake
            </button>
          )}

          <button
            id="dashboard-quick-review"
            onClick={() => onStartReview()}
            disabled={readyForReviewCount === 0}
            className={`px-5 py-3 bg-[#D98A6C] hover:bg-[#C17A5E] text-[#FDFCF8] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm hover:scale-[1.01] active:scale-98 ${
              readyForReviewCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
            }`}
            title="Start a rapid study session on pending mistakes"
          >
            <Flame className="w-4 h-4 text-white fill-white" /> Quick Review ({readyForReviewCount})
          </button>

          <button
            onClick={() => onNavigate('add')}
            className="px-4 py-3 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#2D2A26] border border-[#E8E2D9] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            Full Form
          </button>
        </div>
      </section>

      {/* SECTION 2: Dynamic Two-Column Spotlight Grid */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Widget A: Daily Study Target & Mastery Momentum (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs relative overflow-hidden flex flex-col justify-between">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[#D98A6C]/5 rounded-full blur-2xl pointer-events-none"></div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg">
                  <Target className="w-4 h-4" />
                </span>
                <span className="font-mono text-xs font-bold text-[#5A5A40] uppercase tracking-wider">
                  Daily Mastery Target
                </span>
              </div>

              {/* Target adjusters */}
              <div className="flex items-center gap-1 bg-[#FAF8F5] border border-[#E8E2D9] p-0.5 rounded-full text-[10px] font-mono">
                <span className="text-[#9A9184] px-1.5 font-bold uppercase">Goal:</span>
                {[3, 5, 10].map((num) => (
                  <button
                    key={num}
                    type="button"
                    onClick={() => handleSetTarget(num)}
                    className={`px-2 py-0.5 rounded-full font-bold transition-colors cursor-pointer ${
                      dailyTarget === num
                        ? 'bg-[#5A5A40] text-white shadow-2xs'
                        : 'text-[#6B6357] hover:text-[#2D2A26]'
                    }`}
                  >
                    {num}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Progress Bar & Stats */}
            <div className="space-y-3">
              <div className="flex items-baseline justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-bold text-[#2D2A26]">
                    {todayCount} <span className="text-sm font-sans font-normal text-[#6B6357]">of {dailyTarget} cards completed today</span>
                  </h3>
                  <p className="text-xs text-[#6B6357] mt-0.5">
                    {isTargetAchieved
                      ? '🎯 Daily target achieved! Active recall reinforces retention by 8x.'
                      : `${dailyTarget - todayCount} more logs or reviews needed to hit your daily mastery benchmark.`}
                  </p>
                </div>

                <span
                  className={`font-mono text-sm font-extrabold px-2.5 py-1 rounded-full border ${
                    isTargetAchieved
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-amber-50 text-amber-800 border-amber-200'
                  }`}
                >
                  {targetProgress}%
                </span>
              </div>

              {/* Visual Progress Bar */}
              <div className="w-full bg-[#FAF8F5] border border-[#E8E2D9] rounded-full h-3 overflow-hidden p-0.5">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${
                    isTargetAchieved
                      ? 'bg-gradient-to-r from-[#8DA38A] to-emerald-600'
                      : 'bg-gradient-to-r from-[#5A5A40] to-[#D98A6C]'
                  }`}
                  style={{ width: `${targetProgress}%` }}
                ></div>
              </div>
            </div>
          </div>

          {/* Bottom momentum badges */}
          <div className="mt-5 pt-4 border-t border-[#E8E2D9]/60 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-50 border border-amber-200/80 rounded-full text-xs font-mono font-bold text-amber-900">
                <Flame className="w-4 h-4 text-[#D98A6C] fill-[#D98A6C] animate-pulse" />
                <span>{currentStreak} Day Streak</span>
              </div>
              <span className="text-xs text-[#6B6357] hidden sm:inline">
                {readyForReviewCount} pending review
              </span>
            </div>

            <button
              onClick={() => onStartReview()}
              disabled={readyForReviewCount === 0}
              className={`px-4 py-2 bg-[#5A5A40] hover:bg-[#4A453E] text-white text-xs font-bold rounded-xl flex items-center gap-1.5 transition-all cursor-pointer shadow-xs ${
                readyForReviewCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <span>Practice Today's Queue</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Widget B: Diagnostic Spotlight (High-Yield Error Attack) (5 cols) */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#FAF8F5] via-white to-[#F5F2ED] border border-[#E8E2D9] rounded-2xl p-6 shadow-xs flex flex-col justify-between relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1.5 bg-[#D98A6C]/15 text-[#D98A6C] rounded-lg">
                <Crosshair className="w-4 h-4" />
              </span>
              <span className="font-mono text-xs font-bold text-[#D98A6C] uppercase tracking-wider">
                Diagnostic Spotlight
              </span>
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
              High-Yield Error
            </span>
          </div>

          {diagnosticSpotlight ? (
            <div className="space-y-3">
              <div>
                <span className="text-[10px] font-bold text-[#9A9184] uppercase tracking-widest block">
                  Top Priority Blindspot
                </span>
                <h4 className="font-serif text-xl font-bold text-[#2D2A26] mt-0.5">
                  {diagnosticSpotlight.topic.name}
                </h4>
                {diagnosticSpotlight.subject && (
                  <span className="text-xs text-[#6B6357] font-medium block">
                    in {diagnosticSpotlight.subject.name}
                  </span>
                )}
              </div>

              {/* Stats badges */}
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div className="p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-left">
                  <span className="text-[10px] text-[#9A9184] font-bold uppercase block">Unmastered</span>
                  <span className="font-serif text-lg font-bold text-[#C17A5E]">
                    {diagnosticSpotlight.unmasteredCount} cards
                  </span>
                </div>

                <div className="p-2.5 bg-white border border-[#E8E2D9] rounded-xl text-left">
                  <span className="text-[10px] text-[#9A9184] font-bold uppercase block">Retention Rate</span>
                  <span className="font-serif text-lg font-bold text-[#5A5A40]">
                    {diagnosticSpotlight.masteryRate}%
                  </span>
                </div>
              </div>

              {diagnosticSpotlight.topCategory && (
                <div className="text-xs text-[#6B6357] flex items-center gap-1.5">
                  <AlertCircle className="w-3.5 h-3.5 text-[#D98A6C] shrink-0" />
                  <span>Frequent error type: <strong>{diagnosticSpotlight.topCategory}</strong></span>
                </div>
              )}

              <button
                type="button"
                onClick={() =>
                  onStartReview(
                    diagnosticSpotlight.subject?.id,
                    diagnosticSpotlight.topic.id
                  )
                }
                className="w-full mt-2 py-2.5 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs hover:shadow-sm"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>Drill This Topic ({diagnosticSpotlight.unmasteredCount} Cards)</span>
              </button>
            </div>
          ) : (
            <div className="py-6 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
              <h4 className="font-serif text-lg font-bold text-[#2D2A26]">All Topics Fortified!</h4>
              <p className="text-xs text-[#6B6357] max-w-xs mx-auto">
                No acute blindspots detected. Log new mistakes as you solve test papers or run a full review cycle.
              </p>
              <button
                onClick={() => onStartReview()}
                className="mt-2 px-4 py-2 bg-[#5A5A40] text-white text-xs font-bold rounded-full cursor-pointer hover:bg-[#4A453E]"
              >
                Start Comprehensive Review
              </button>
            </div>
          )}
        </div>
      </section>

      {/* Daily Quota Indicator */}
      {user && (
        isAdmin ? (
          /* Admin Special Unlimited Control Hub & Metrics */
          <section id="daily-quota-hud" className="bg-white border-2 border-[#5A5A40]/40 rounded-2xl p-6 text-left transition-all hover:shadow-xs space-y-5">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-[#E8E2D9] pb-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-500 animate-pulse"></span>
                  <h3 className="font-mono text-[10.5px] font-extrabold text-[#6B6357] uppercase tracking-widest">
                    Creator Admin Control Panel
                  </h3>
                </div>
                <h4 className="text-lg font-serif font-black text-[#2D2A26]">
                  Real-time Server Quota Pulse
                </h4>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="py-1 px-3 bg-indigo-50 border border-indigo-200 text-indigo-800 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Admin Status: Unlimited
                </span>
                <span className="py-1 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider">
                  Firebase Telemetry Direct
                </span>
              </div>
            </div>

            {/* Simulated Firebase Panel */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-stone-50/50 p-4 rounded-xl border border-stone-100">
              {/* Left Column: Firebase-style metrics block */}
              <div className="lg:col-span-5 space-y-4">
                <h5 className="font-sans font-bold text-xs uppercase text-[#6B6357] tracking-wider mb-2">
                  Billable Metrics Summary
                </h5>

                {/* Reads Block */}
                <div className="p-4 bg-white border border-[#E8E2D9] rounded-xl flex items-start gap-3.5 shadow-xs">
                  <div className="mt-1 h-4 w-4 shrink-0 rounded bg-[#1E88E5] flex items-center justify-center text-white text-[10px] font-bold">
                    ✓
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-[#6B6357] tracking-widest leading-none mb-1">Total Web Reads Today</span>
                    <span className="font-mono text-3xl font-extrabold text-[#1E88E5] block tracking-tight">
                      {totalLiveReadsToday >= 1000 ? `${(totalLiveReadsToday / 1000).toFixed(1)}K` : totalLiveReadsToday}
                      <span className="text-sm font-sans font-normal text-stone-500 ml-1.5 font-bold">total</span>
                    </span>
                    <span className="text-[10px] text-[#6B6357] mt-1 block">Cumulative Firestore queries performed programmatically by all active users today</span>
                  </div>
                </div>

                {/* Individual admin card */}
                <div className="p-3.5 bg-white border border-dashed border-[#E8E2D9] rounded-xl flex items-center justify-between text-xs text-[#2D2A26]">
                  <div className="flex items-center gap-2 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-stone-400"></span>
                    <span>Your session reads today:</span>
                  </div>
                  <span className="font-mono font-bold bg-[#FAF8F5] px-2 py-0.5 border border-[#E8E2D9] rounded text-emerald-800">
                    {quotaReads} / ∞ (Exempt)
                  </span>
                </div>
              </div>

              {/* Right Column: User traffic breakdowns */}
              <div className="lg:col-span-7 flex flex-col justify-between">
                <div>
                  <h5 className="font-sans font-bold text-xs uppercase text-[#6B6357] tracking-wider mb-3">
                    Active Readers Breakdown
                  </h5>

                  {allUsers.filter((u) => (u.dailyQuotaReads || 0) > 0).length === 0 ? (
                    <div className="p-8 bg-dashed border border-stone-200 rounded-xl text-center text-stone-400 text-xs">
                      No customer read events counted today yet. Users will appear here when they open StudyFlow.
                    </div>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto border border-stone-200/60 rounded-xl divide-y divide-[#E8E2D9]/40 bg-white">
                      {allUsers
                        .filter((u) => (u.dailyQuotaReads || 0) > 0)
                        .sort((a, b) => (b.dailyQuotaReads || 0) - (a.dailyQuotaReads || 0))
                        .map((u) => {
                          const isMe = u.id === user?.uid;
                          return (
                            <div key={u.id} className="p-2.5 flex items-center justify-between hover:bg-stone-50 transition-colors text-xs text-left">
                              <div className="flex flex-col max-w-[70%]">
                                <span className={`font-medium text-[#2D2A26] truncate ${isMe ? 'font-bold' : ''}`}>
                                  {u.email || 'Anonymous Student'} {isMe && <span className="text-[10px] text-indigo-600 font-mono">(You)</span>}
                                </span>
                                <span className="text-[9px] text-[#6B6357] font-mono leading-none mt-0.5">
                                  UID: {u.id.substring(0, 8)}...
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-[#6B6357] font-mono">{u.dailyQuotaDate}</span>
                                <span className="px-2 py-0.5 font-mono font-bold text-xs rounded bg-stone-100 text-stone-700">
                                  {u.dailyQuotaReads || 0} reads
                                </span>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </div>

                <div className="text-[10.5px] text-[#6B6357] text-left mt-3 pt-3 border-t border-dashed border-stone-200/80 flex items-center gap-1.5 animate-fade-in">
                  <span className="font-semibold text-indigo-600 font-mono">Note:</span>
                  <span>Admin limits are completely disabled. These charts update dynamically in real time and mirror Firebase Cloud usage indexes directly.</span>
                </div>
              </div>
            </div>
          </section>
        ) : (
          /* Normal User HUD Display */
          <section id="daily-quota-hud" className="bg-white border border-[#E8E2D9] rounded-2xl p-5 text-left transition-all hover:shadow-xs">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
              <div className="space-y-1">
                <h3 className="font-mono text-[10px] font-extrabold text-[#6B6357] uppercase tracking-widest flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full animate-pulse ${isQuotaExceeded ? 'bg-orange-400' : 'bg-[#5A5A40]'}`}></span>
                  Daily Reads Pulse
                </h3>
                <p className="text-sm font-serif font-semibold text-[#2D2A26]">
                  Today you have consumed <span className="font-mono text-[#D98A6C]">{quotaReads}</span> reads out of your <span className="font-mono">{quotaLimit}</span> allowance
                </p>
              </div>
              <div>
                {isQuotaExceeded ? (
                  <span className="py-1 px-3 bg-[#D98A6C]/10 border border-[#D98A6C]/30 text-[#D98A6C] rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider">
                    Offline Caching Active
                  </span>
                ) : (
                  <span className="py-1 px-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10.5px] font-mono font-bold uppercase tracking-wider">
                    Live Cloud Sync Active
                  </span>
                )}
              </div>
            </div>

            {/* Progress Bar */}
            <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden border border-stone-200/50 mb-1.5">
              <div
                className={`h-full transition-all duration-300 rounded-full ${isQuotaExceeded ? 'bg-[#D98A6C]' : 'bg-[#5A5A40]'}`}
                style={{ width: `${Math.min(100, Math.round((quotaReads / quotaLimit) * 100))}%` }}
              ></div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-[#6B6357] font-mono">
              <span>0%</span>
              <span>{Math.min(100, Math.round((quotaReads / quotaLimit) * 100))}% consumed ({quotaReads} of {quotaLimit} reads)</span>
              <span>100%</span>
            </div>
          </section>
        )
      )}

      {/* SECTION 3: Enhanced Metric Cards with Progress Meters */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#5A5A40]/40 hover:shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-[#2D2A26]/5 flex items-center justify-center shrink-0 text-[#2D2A26]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest leading-none mb-1">
              Total Logged
            </span>
            <span className="font-serif text-3xl font-semibold text-[#2D2A26] block leading-none">
              {totalMistakesCount}
            </span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Mastery baseline</span>
          </div>
        </div>

        {/* New Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#C17A5E]/40 hover:shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-[#C17A5E]/10 flex items-center justify-center shrink-0 text-[#C17A5E]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest leading-none mb-1">
              New
            </span>
            <span className="font-serif text-3xl font-semibold text-[#C17A5E] block leading-none">
              {newMistakesCount}
            </span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Needs triage</span>
          </div>
        </div>

        {/* Reviewing Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#D98A6C]/40 hover:shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-[#D98A6C]/10 flex items-center justify-center shrink-0 text-[#D98A6C]">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#D98A6C] uppercase tracking-widest leading-none mb-1">
              Reviewing
            </span>
            <span className="font-serif text-3xl font-semibold text-[#D98A6C] block leading-none">
              {reviewingMistakesCount}
            </span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Active recovery</span>
          </div>
        </div>

        {/* Mastered Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#8DA38A]/40 hover:shadow-sm">
          <div className="w-11 h-11 rounded-2xl bg-[#8DA38A]/10 flex items-center justify-center shrink-0 text-[#8DA38A]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 leading-none mb-1">
              <span className="text-[10px] font-bold text-[#8DA38A] uppercase tracking-widest">
                Mastered
              </span>
              <span className="text-[9px] font-mono font-bold bg-[#8DA38A]/15 text-[#5A5A40] px-1.5 py-0.2 rounded-full">
                {overallMasteryRate}%
              </span>
            </div>
            <span className="font-serif text-3xl font-semibold text-[#8DA38A] block leading-none">
              {masteredMistakesCount}
            </span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Fully resolved</span>
          </div>
        </div>
      </section>

      {/* SECTION 4: Recent Mistakes to Revisit Shelf (Quick Recall Deck) */}
      <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-xs space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#E8E2D9]/60 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h3 className="font-serif text-lg font-bold text-[#2D2A26]">
                Recent Mistakes to Revisit
              </h3>
              <p className="text-xs text-[#6B6357]">
                Test your recall immediately or flip to peek at the underlying concept.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigate('insights')}
            className="text-xs font-bold text-[#5A5A40] hover:text-[#2D2A26] flex items-center gap-1 transition-colors cursor-pointer"
          >
            <span>View All in Library</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentMistakes.length === 0 ? (
          <div className="py-8 text-center text-[#9A9184] space-y-2">
            <BookOpen className="w-8 h-8 mx-auto opacity-50" />
            <p className="text-xs">No mistakes logged yet. Click "Quick Add Mistake" above to start your journal.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {recentMistakes.map((m) => {
              const sub = subjects.find((s) => s.id === m.subjectId);
              const top = topics.find((t) => t.id === m.topicId);
              const isFlipped = !!flippedCards[m.id];
              const theme = getSubjectColorTheme(sub?.name || '');

              return (
                <div
                  key={m.id}
                  onClick={() => onSelectMistake(m.id)}
                  className="p-4 border border-[#E8E2D9] hover:border-[#5A5A40]/40 rounded-2xl bg-[#FAF8F5]/60 hover:bg-white transition-all cursor-pointer flex flex-col justify-between group shadow-2xs space-y-3 relative overflow-hidden"
                >
                  <div className="space-y-2">
                    {/* Header: Subject & Date */}
                    <div className="flex items-center justify-between gap-2">
                      <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full ${theme.badge}`}>
                        {sub?.name || 'General'}
                      </span>
                      <span className="text-[10px] text-[#9A9184] font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {m.dateLogged}
                      </span>
                    </div>

                    {/* Topic & Title */}
                    <div>
                      {top && (
                        <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider block">
                          {top.name}
                        </span>
                      )}
                      <h4 className="font-serif text-sm font-semibold text-[#2D2A26] line-clamp-2 mt-0.5 group-hover:text-[#5A5A40] transition-colors">
                        {m.title || m.originalQuestion || 'Mistake Log'}
                      </h4>
                    </div>

                    {/* Front: Question snippet / Categories */}
                    {!isFlipped ? (
                      <div className="space-y-2">
                        {m.originalQuestion && (
                          <p className="text-xs text-[#6B6357] line-clamp-2 italic bg-white p-2 rounded-lg border border-[#E8E2D9]/60">
                            "{m.originalQuestion}"
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1">
                          {(m.categories || []).slice(0, 2).map((cat) => (
                            <span
                              key={cat}
                              className="text-[9px] font-semibold px-1.5 py-0.5 bg-stone-100 text-stone-700 rounded-md"
                            >
                              {cat}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : (
                      /* Back: Quick Solution Peek */
                      <div className="space-y-1.5 bg-emerald-50/80 border border-emerald-200/80 p-2.5 rounded-xl animate-fade-in text-xs text-emerald-950">
                        <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-emerald-800">
                          <CheckCircle2 className="w-3 h-3" /> Key Solution
                        </div>
                        <p className="text-[11px] leading-relaxed line-clamp-3">
                          {m.correctExplanation || m.correctAnswer || 'Review your notes to master this solution.'}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Actions footer */}
                  <div className="pt-2 border-t border-[#E8E2D9]/60 flex items-center justify-between text-xs">
                    <button
                      type="button"
                      onClick={(e) => toggleFlip(m.id, e)}
                      className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D9] text-[#5A5A40] hover:text-[#2D2A26] hover:bg-[#F5F2ED] transition-colors font-bold text-[10px] flex items-center gap-1 cursor-pointer"
                    >
                      {isFlipped ? (
                        <>
                          <EyeOff className="w-3 h-3" /> Hide Answer
                        </>
                      ) : (
                        <>
                          <Eye className="w-3 h-3" /> Peek Solution
                        </>
                      )}
                    </button>

                    <span className="text-[10px] font-bold text-[#5A5A40] group-hover:translate-x-0.5 transition-transform flex items-center gap-1">
                      Details <ChevronRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 5: Main Grid Area (Ranked Subjects Left, Streak/Achievements Right) */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Top 5 Subjects with the Most Mistakes */}
        <div className="lg:col-span-2 bg-white border border-[#E8E2D9] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#E8E2D9]/60 pb-3 mb-4">
              <h3 className="font-serif text-xl font-medium text-[#2D2A26] flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#5A5A40]" />
                Top Subjects by Mistake Load
              </h3>
              <span className="font-sans text-[10px] font-bold text-[#9A9184] tracking-widest uppercase bg-[#F5F2ED] px-2.5 py-1 rounded">
                Ranked #1 - #5
              </span>
            </div>

            {topFiveSubjects.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-[#9A9184] mx-auto mb-2 opacity-60" />
                <p className="font-sans text-xs text-[#6B6357]">No mistakes mapped yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topFiveSubjects.map((sub, index) => {
                  const theme = getSubjectColorTheme(sub.name);

                  return (
                    <div
                      key={sub.id}
                      onClick={() => onNavigate('topics', sub.id)}
                      className="p-4 border border-[#E8E2D9]/75 hover:border-[#5A5A40]/30 hover:bg-[#FDFCF8] rounded-xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                    >
                      <div className="flex items-center gap-3">
                        <span className="font-sans text-xs font-bold text-[#9A9184] w-6 shrink-0">
                          0{index + 1}
                        </span>
                        <div>
                          <h4 className="font-serif text-base font-semibold text-[#2D2A26] group-hover:text-[#5A5A40] transition-colors">
                            {sub.name}
                          </h4>
                          <div className="flex flex-wrap gap-1.5 mt-1.5">
                            {sub.newCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-red-50 text-[#C17A5E] text-[9px] font-bold uppercase rounded">
                                {sub.newCount} New
                              </span>
                            )}
                            {sub.reviewingCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-[#D98A6C]/10 text-[#D98A6C] text-[9px] font-bold uppercase rounded">
                                {sub.reviewingCount} Reviewing
                              </span>
                            )}
                            {sub.masteredCount > 0 && (
                              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-bold uppercase rounded">
                                {sub.masteredCount} Mastered
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-5 sm:text-right shrink-0">
                        <div>
                          <span className="block font-sans text-xs text-[#6B6357] font-medium leading-none">
                            <strong className="text-[#2D2A26]/90 font-bold">{sub.count}</strong>{' '}
                            {sub.count === 1 ? 'mistake' : 'mistakes'}
                          </span>
                          <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider block mt-1">
                            {sub.mastery}% Mastered
                          </span>
                        </div>

                        {/* Visual Mini Progress Bar */}
                        <div className="w-16 h-1.5 bg-[#F5F2ED] border border-[#E8E2D9] rounded-full overflow-hidden hidden sm:block">
                          <div className={`h-full ${theme.bar}`} style={{ width: `${sub.mastery}%` }}></div>
                        </div>

                        <ChevronRight className="w-4 h-4 text-[#9A9184] group-hover:text-[#5A5A40] transition-colors" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <button
            onClick={() => onNavigate('topics')}
            className="w-full mt-4 py-2.5 text-[#5A5A40] hover:text-[#2D2A26] border border-dashed border-[#E8E2D9] rounded-xl text-xs font-semibold uppercase tracking-wider hover:bg-[#F5F2ED]/55 transition-colors cursor-pointer text-center"
          >
            Explore All Subjects & Topic Maps
          </button>
        </div>

        {/* Right Column: Streak Card and Quick Review Panel */}
        <div className="space-y-6">
          {/* Streak Counter widget */}
          <div className="bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2A26] rounded-2xl p-6 flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
            <div>
              <span className="font-sans text-xs font-bold tracking-widest text-[#9A9184] uppercase">
                CURRENT STREAK
              </span>
              <p className="font-serif text-4xl font-semibold mt-2 flex items-baseline gap-1 text-[#2D2A26]">
                {currentStreak} {currentStreak === 1 ? 'Day' : 'Days'}
                <Flame className="w-6 h-6 text-[#D98A6C] fill-[#D98A6C] animate-pulse ml-2 inline-block self-center align-middle" />
              </p>
              <p className="text-xs text-[#6B6357] mt-2">
                Consistent daily reflection drives 8x better retention and reduces repeat errors on exams.
              </p>
            </div>

            <button
              onClick={() => onStartReview()}
              disabled={readyForReviewCount === 0}
              className={`w-full mt-4 py-3.5 bg-[#D98A6C] text-[#FDFCF8] rounded-full font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#C17A5E] transition-all active:scale-95 duration-200 shadow-sm cursor-pointer ${
                readyForReviewCount === 0 ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              <Flame className="w-4 h-4 text-[#FDFCF8] fill-[#FDFCF8]" />
              Quick Review ({readyForReviewCount})
            </button>
          </div>

          {/* Achievements & Badges Teaser Card */}
          <div
            onClick={() => onNavigate('profile')}
            className="bg-white border border-[#E8E2D9] rounded-2xl p-5 space-y-3 cursor-pointer group transition-all duration-300 hover:border-[#5A5A40]/40 hover:shadow-xs relative overflow-hidden text-left"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-amber-500/5 rounded-full blur-xl pointer-events-none"></div>

            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-1">
                <Trophy className="w-3.5 h-3.5 text-amber-500" /> Academic Achievements
              </span>
              <span className="text-[10px] font-mono font-bold text-[#2D2A26] bg-[#FAF8F5] border border-[#E8E2D9] px-2 py-0.5 rounded-full">
                {unlockedAchievementsCount} / 6 Earned
              </span>
            </div>

            <p className="text-xs text-[#6B6357] leading-relaxed">
              You've unlocked <strong>{unlockedAchievementsCount} out of 6</strong> academic milestone badges! Check out your custom sharing certificates inside your profile tab.
            </p>

            <div className="pt-1 flex items-center justify-between text-xs text-[#5A5A40] font-bold">
              <span>View Milestone Badges</span>
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>

          {/* Quick Study Tip Box */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 space-y-3">
            <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest block flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Study Principle
            </span>
            <p className="text-xs text-[#6B6357] leading-relaxed">
              Logging errors within <strong>30 minutes</strong> of finishing a practice test captures reasoning slips before cognitive fatigue dissolves diagnostic memory.
            </p>
          </div>
        </div>
      </section>

      {/* SECTION 6: Interactive Heatmap with Day Activity Inspector */}
      <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 flex flex-col justify-between space-y-4">
        <div className="flex justify-between items-end border-b border-[#E8E2D9]/60 pb-3">
          <div>
            <h3 className="font-serif text-xl font-medium text-[#2D2A26]">Mistake History Heatmap</h3>
            <p className="text-xs text-[#6B6357] mt-0.5">
              Click any date below to inspect errors logged on that day.
            </p>
          </div>
          <span className="font-sans text-xs font-semibold text-[#9A9184] tracking-wider uppercase">
            PAST 30 DAYS
          </span>
        </div>

        {/* Heatmap Grid */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 py-2">
          {last30DaysGrid.map((day, idx) => {
            const isSelected = selectedHeatmapDate === day.dateString;
            let bgColor = 'bg-[#F5F2ED] border-dashed border border-[#E8E2D9]';
            if (day.count === 1) bgColor = 'bg-[#E8E2D9] border border-[#E8E2D9]';
            else if (day.count === 2) bgColor = 'bg-[#5A5A40]/45 text-white';
            else if (day.count > 2) bgColor = 'bg-[#5A5A40] text-white';

            return (
              <div
                key={idx}
                onClick={() => setSelectedHeatmapDate(isSelected ? null : day.dateString)}
                className={`aspect-square rounded-xl flex flex-col items-center justify-center relative group cursor-pointer transition-all duration-200 hover:scale-105 ${bgColor} ${
                  isSelected ? 'ring-2 ring-[#D98A6C] ring-offset-2' : ''
                }`}
                title={`${day.count} logged on ${day.month} ${day.dayNum} (click to inspect)`}
              >
                <span className={`text-[10px] select-none font-medium ${day.count >= 2 ? 'text-white' : 'text-[#6B6357]'}`}>
                  {day.dayNum}
                </span>
                {day.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D98A6C] text-[#FDFCF8] text-[9px] font-bold rounded-full flex items-center justify-center">
                    {day.count}
                  </span>
                )}
              </div>
            );
          })}
        </div>

        <div className="flex justify-between text-[11px] text-[#9A9184] font-medium">
          <span>30 days ago</span>
          <span>Today</span>
        </div>

        {/* Day Activity Inspector Flyout */}
        {selectedHeatmapDate && (
          <div className="mt-4 p-4 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl animate-fade-in space-y-3">
            <div className="flex items-center justify-between border-b border-[#E8E2D9]/80 pb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-[#5A5A40]" />
                <span className="text-xs font-bold text-[#2D2A26]">
                  Logged on {selectedHeatmapDate} ({selectedDayMistakes.length}{' '}
                  {selectedDayMistakes.length === 1 ? 'mistake' : 'mistakes'})
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedHeatmapDate(null)}
                className="p-1 text-[#9A9184] hover:text-[#2D2A26] rounded-full hover:bg-stone-200/50 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {selectedDayMistakes.length === 0 ? (
              <p className="text-xs text-[#9A9184] italic py-2">
                No mistakes were recorded on this date.
              </p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {selectedDayMistakes.map((m) => {
                  const sub = subjects.find((s) => s.id === m.subjectId);
                  return (
                    <div
                      key={m.id}
                      onClick={() => onSelectMistake(m.id)}
                      className="p-3 bg-white border border-[#E8E2D9] hover:border-[#5A5A40]/40 rounded-xl cursor-pointer transition-all hover:shadow-2xs space-y-1 text-left"
                    >
                      <div className="flex items-center justify-between text-[9px] font-mono">
                        <span className="font-bold text-[#5A5A40] truncate max-w-[120px]">
                          {sub?.name || 'General'}
                        </span>
                        <span
                          className={`px-1.5 py-0.2 rounded ${
                            m.status === 'Mastered'
                              ? 'bg-emerald-50 text-emerald-800'
                              : m.status === 'Reviewing'
                              ? 'bg-amber-50 text-amber-800'
                              : 'bg-red-50 text-red-800'
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                      <h5 className="font-serif text-xs font-semibold text-[#2D2A26] line-clamp-1">
                        {m.title || m.originalQuestion || 'Mistake Entry'}
                      </h5>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </section>

      {/* SECTION 7: All Mapped Subjects Grid with Academic Themes */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="font-serif text-2xl text-[#2D2A26]">All Mapped Subjects</h3>
            <p className="text-xs text-[#6B6357]">
              Explore topic sub-branches and log mistakes organized by syllabus.
            </p>
          </div>
          <button
            onClick={() => onNavigate('topics')}
            className="text-[#2D2A26] font-semibold text-sm flex items-center gap-1.5 hover:text-[#5A5A40] transition-colors cursor-pointer"
          >
            <span>View Subject Maps</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {subjectStats.length === 0 ? (
          <div className="bg-[#FDFCF8] border border-dashed border-[#E8E2D9] rounded-2xl p-12 text-center">
            <AlertCircle className="w-8 h-8 text-[#9A9184] mx-auto mb-2" />
            <p className="font-sans text-sm text-[#9A9184]">
              No subjects created yet. Click below or go to Topics tab to add one.
            </p>
            <button
              onClick={() => onNavigate('topics')}
              className="mt-4 px-4 py-2 bg-[#D98A6C] text-white text-xs font-bold rounded-full cursor-pointer hover:bg-[#C17A5E] transition-colors"
            >
              + Create First Subject
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {subjectStats.map((sub) => {
              const theme = getSubjectColorTheme(sub.name);

              return (
                <div
                  key={sub.id}
                  onClick={() => onNavigate('topics', sub.id)}
                  className={`bg-white border ${theme.border} rounded-2xl p-6 hover:shadow-md transition-all duration-300 group cursor-pointer hover:translate-y-[-2px] flex flex-col justify-between`}
                >
                  <div>
                    <div
                      className={`w-12 h-12 rounded-2xl ${theme.iconBg} flex items-center justify-center mb-4 group-hover:scale-105 transition-transform`}
                    >
                      <span className="material-symbols-outlined font-normal text-2xl">
                        {theme.icon}
                      </span>
                    </div>
                    <h4 className="font-serif text-xl font-bold text-[#2D2A26] mb-1 group-hover:text-[#5A5A40] transition-colors">
                      {sub.name}
                    </h4>
                    <p className="font-sans text-xs text-[#6B6357] mb-6">
                      {sub.count} {sub.count === 1 ? 'Mistake' : 'Mistakes'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between font-sans text-xs font-semibold text-[#9A9184] uppercase tracking-wider">
                      <span>Mastery</span>
                      <span className="font-bold text-[#2D2A26]">{sub.mastery}%</span>
                    </div>
                    <div className="h-2 w-full bg-[#F5F2ED] rounded-full overflow-hidden border border-[#E8E2D9]">
                      <div
                        className={`h-full ${theme.bar} transition-all duration-700`}
                        style={{ width: `${sub.mastery}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* SECTION 8: Insights Banner */}
      <section className="mt-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#5A5A40] text-[#FDFCF8] p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-xl">
            <span className="text-xs font-mono font-bold uppercase tracking-widest text-[#D98A6C] block mb-2">
              Cognitive Diagnostics
            </span>
            <h3 className="font-serif text-2xl md:text-3.5xl font-medium mb-4">
              Identify your academic blind spots.
            </h3>
            <p className="font-sans text-base text-[#E8E2D9] leading-relaxed mb-6">
              Review history suggests study session focus pays off. Deliberate practice on repeat error patterns converts persistent mistakes into long-term intuition.
            </p>
            <button
              onClick={() => onNavigate('insights')}
              className="bg-[#D98A6C] text-[#FDFCF8] px-6 py-2.5 rounded-full font-bold font-sans text-sm hover:bg-[#C17A5E] hover:opacity-95 transition-all cursor-pointer active:scale-95 duration-150"
            >
              Deep Dive Insights
            </button>
          </div>
          <div className="absolute right-[-10%] top-[-10%] w-96 h-96 bg-[#D98A6C] opacity-10 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute right-[5%] bottom-[-15%] w-60 h-60 border-[20px] border-[#FDFCF8]/5 rounded-full pointer-events-none"></div>
        </div>
      </section>
    </div>
  );
}
