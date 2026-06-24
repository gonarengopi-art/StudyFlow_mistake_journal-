/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo } from 'react';
import { Subject, MistakeEntry } from '../types';
import { BookOpen, Flame, ArrowRight, Award, AlertCircle, FileSpreadsheet, RotateCcw, Plus, Sparkles, TrendingUp, ChevronRight, HelpCircle } from 'lucide-react';

interface DashboardViewProps {
  subjects: Subject[];
  mistakes: MistakeEntry[];
  onNavigate: (view: 'dashboard' | 'topics' | 'add' | 'insights' | 'profile' | 'upgrade', targetSubjectId?: string) => void;
  onSelectMistake: (mistakeId: string) => void;
  onStartReview: () => void;
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

export function DashboardView({
  subjects,
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
  // Early Supporter Lifetime slots counter (FOMO psychology)
  const [supporterCount, setSupporterCount] = React.useState<number>(() => {
    const cached = localStorage.getItem('studyflow_supporter_count');
    if (cached) {
      const parsed = parseInt(cached, 10);
      if (!isNaN(parsed) && parsed >= 41 && parsed <= 50) {
        return parsed;
      }
    }
    // Initialize with a realistic number of early supporters (e.g., 42 out of 50)
    const initial = Math.floor(Math.random() * 3) + 41; // 41, 42, or 43
    localStorage.setItem('studyflow_supporter_count', initial.toString());
    return initial;
  });

  // Small effect to occasionally increment supporter count (FOMO)
  React.useEffect(() => {
    if (isPremium) {
      // Ensure premium users have their spot saved
      setSupporterCount(prev => {
        const next = Math.max(prev, 44);
        localStorage.setItem('studyflow_supporter_count', next.toString());
        return next;
      });
      return;
    }

    // Small chance to increment supporters count when viewing (capped at 48 to keep slot pressure open)
    const chance = Math.random();
    if (chance < 0.12 && supporterCount < 48) {
      const nextCount = supporterCount + 1;
      localStorage.setItem('studyflow_supporter_count', nextCount.toString());
      setSupporterCount(nextCount);
    }
  }, [isPremium]);

  // Compute analytics from current state
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
    return [...subjectStats]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [subjectStats]);

  // Mistakes in past 30 days grid generator
  const last30DaysGrid = useMemo(() => {
    const arr = [];
    const today = new Date();
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateString = d.toISOString().split('T')[0];
      const count = mistakes.filter((m) => m.dateLogged === dateString).length;
      arr.push({
        date: dateString,
        dayNum: d.getDate(),
        month: d.toLocaleString('default', { month: 'short' }),
        count,
      });
    }
    return arr;
  }, [mistakes]);

  // Render iconic cards based on subjects
  const getSubjectIcon = (name: string) => {
    const lower = name.toLowerCase();
    if (lower.includes('bio')) return 'biotech';
    if (lower.includes('chem')) return 'science';
    if (lower.includes('phys')) return 'psychology';
    if (lower.includes('ucat')) return 'school';
    if (lower.includes('math')) return 'calculate';
    if (lower.includes('econ')) return 'bar_chart';
    return 'menu_book';
  };

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Hero */}
      <section className="text-left py-2 border-b border-[#E8E2D9] pb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="font-serif text-3xl md:text-5xl font-semibold text-[#2D2A26] tracking-tight mb-2">
            Good morning, {userName}.
          </h2>
          <p className="font-sans text-base text-[#6B6357]">
            You have <span className="font-semibold text-[#2D2A26]">{readyForReviewCount} mistakes</span> ready for review today across your mapped subjects.
          </p>
        </div>

        {/* Quick Action Buttons on Dashboard */}
        <div className="flex flex-wrap items-center gap-2.5">
          {onOpenOnboarding && (
            <button
              onClick={onOpenOnboarding}
              className="px-4.5 py-3.5 bg-white hover:bg-[#F5F2ED] text-[#5A5A40] border border-[#E8E2D9] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
              title="View step-by-step app user guide"
            >
              <HelpCircle className="w-4 h-4 text-[#D98A6C]" /> Take a Tour
            </button>
          )}
          {onOpenQuickAdd && (
            <button
              onClick={onOpenQuickAdd}
              className="px-4.5 py-3.5 bg-[#5A5A40] hover:bg-[#4A453E] text-white rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer shadow-sm"
              title="Add a core mistake immediately"
            >
              <Plus className="w-4 h-4" /> Quick Add Mistake
            </button>
          )}
          <button
            onClick={() => onNavigate('add')}
            className="px-4.5 py-3.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#2D2A26] border border-[#E8E2D9] rounded-full font-sans font-bold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
          >
            Full Form
          </button>
        </div>
      </section>

      {/* Early Supporter Lifetime Slots FOMO Card */}
      <section className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-5 text-left transition-all hover:border-[#D98A6C]/45 hover:shadow-xs relative overflow-hidden">
        {/* Subtle decorative background light effect */}
        <div className="absolute right-0 top-0 w-32 h-32 bg-[#D98A6C]/5 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 relative z-10">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="py-0.5 px-2 bg-[#D98A6C]/10 border border-[#D98A6C]/30 text-[#D98A6C] rounded-full text-[10px] font-mono font-bold uppercase tracking-wider flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-[#D98A6C] animate-pulse"></span>
                Limited Supporter Promotion
              </span>
              {!isPremium && (
                <span className="py-0.5 px-2 bg-amber-50 border border-amber-200 text-amber-800 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider animate-pulse">
                  Only {50 - supporterCount} slots left
                </span>
              )}
            </div>

            {isPremium ? (
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#2D2A26] flex items-center gap-1.5">
                  <Award className="w-5 h-5 text-[#5A5A40]" />
                  You are early supporter #{supporterCount - 1}!
                </h3>
                <p className="text-xs text-[#6B6357] leading-relaxed max-w-xl">
                  Thank you for being an early lifetime supporter. You have bypassed all future monthly subscriptions. Your scholastic journals are fully unlocked with a 100,000+ daily server quota.
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <h3 className="font-serif text-lg font-bold text-[#2D2A26] flex items-center gap-1.5">
                  <Flame className="w-5 h-5 text-[#D98A6C]" />
                  Early Supporter Lifetime Deal Is Ending
                </h3>
                <p className="text-xs text-[#6B6357] leading-relaxed max-w-xl">
                  Join <span className="font-bold text-[#2D2A26]">{supporterCount} forward-thinking students</span> who locked in complete cloud backup and unlimited study quota with a single flat payment. Once all <span className="font-bold">50 slots</span> are taken, StudyFlow shifts to a <span className="font-bold text-[#2D2A26]">$9/month</span> model.
                </p>
              </div>
            )}

            {/* Visual Supporter Slot Progress bar */}
            <div className="space-y-1 max-w-md pt-1">
              <div className="w-full bg-stone-100 rounded-full h-2 overflow-hidden border border-stone-200/50">
                <div 
                  className="h-full transition-all duration-1000 rounded-full bg-gradient-to-r from-[#5A5A40] to-[#D98A6C]"
                  style={{ width: `${(supporterCount / 50) * 100}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[9px] text-[#9A9184] font-mono">
                <span>{supporterCount} Claimed</span>
                <span>{50 - supporterCount} Available Slots</span>
                <span>50 Max Supporter Tier</span>
              </div>
            </div>
          </div>

          {!isPremium && (
            <button
              onClick={() => onNavigate('upgrade')}
              className="px-5 py-3 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 hover:scale-[1.02] active:scale-98 shadow-sm hover:shadow-md group"
            >
              Secure My Lifetime Spot
              <ChevronRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>
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
                  
                  {allUsers.filter(u => (u.dailyQuotaReads || 0) > 0).length === 0 ? (
                    <div className="p-8 bg-dashed border border-stone-200 rounded-xl text-center text-stone-400 text-xs">
                      No customer read events counted today yet. Users will appear here when they open StudyFlow.
                    </div>
                  ) : (
                    <div className="max-h-[160px] overflow-y-auto border border-stone-200/60 rounded-xl divide-y divide-[#E8E2D9]/40 bg-white">
                      {allUsers
                        .filter(u => (u.dailyQuotaReads || 0) > 0)
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

      {/* NEW SECTION: Total Mistakes, New, Reviewing, Mastered Status Grid */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#9A9184]/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#2D2A26]/5 flex items-center justify-center shrink-0 text-[#2D2A26]">
            <BookOpen className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest leading-none mb-1">Total Logged</span>
            <span className="font-serif text-2xl font-semibold text-[#2D2A26] block leading-none">{totalMistakesCount}</span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Lifetime errors</span>
          </div>
        </div>

        {/* New Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#C17A5E]/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#C17A5E]/10 flex items-center justify-center shrink-0 text-[#C17A5E]">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest leading-none mb-1">New</span>
            <span className="font-serif text-2xl font-semibold text-[#C17A5E] block leading-none">{newMistakesCount}</span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Needs evaluation</span>
          </div>
        </div>

        {/* Reviewing Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#D98A6C]/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#D98A6C]/10 flex items-center justify-center shrink-0 text-[#D98A6C]">
            <RotateCcw className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#D98A6C] uppercase tracking-widest leading-none mb-1">Reviewing</span>
            <span className="font-serif text-2xl font-semibold text-[#D98A6C] block leading-none">{reviewingMistakesCount}</span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Active recovery</span>
          </div>
        </div>

        {/* Mastered Card */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 flex items-center gap-4 transition-all hover:border-[#8DA38A]/40 hover:shadow-sm">
          <div className="w-10 h-10 rounded-full bg-[#8DA38A]/10 flex items-center justify-center shrink-0 text-[#8DA38A]">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <span className="block text-[10px] font-bold text-[#8DA38A] uppercase tracking-widest leading-none mb-1">Mastered</span>
            <span className="font-serif text-2xl font-semibold text-[#8DA38A] block leading-none">{masteredMistakesCount}</span>
            <span className="text-[10px] text-[#6B6357] mt-1 block">Concept resolved</span>
          </div>
        </div>
      </section>

      {/* Main Grid Content Area: Top 5 Subjects Left, Streak / Review Right */}
      <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Top 5 Subjects with the Most Mistakes */}
        <div className="lg:col-span-2 bg-white border border-[#E8E2D9] rounded-2xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex justify-between items-center border-b border-[#E8E2D9]/60 pb-3 mb-4">
              <h3 className="font-serif text-xl font-medium text-[#2D2A26] flex items-center gap-2">
                <TrendingUp className="w-4.5 h-4.5 text-[#5A5A40]">test</TrendingUp>
                Top Subjects by Mistake Load
              </h3>
              <span className="font-sans text-[10px] font-bold text-[#9A9184] tracking-widest uppercase bg-[#F5F2ED] px-2.5 py-1 rounded">Ranked #1 - #5</span>
            </div>

            {topFiveSubjects.length === 0 ? (
              <div className="text-center py-10">
                <AlertCircle className="w-8 h-8 text-[#9A9184] mx-auto mb-2 opacity-60" />
                <p className="font-sans text-xs text-[#6B6357]">No mistakes mapped yet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topFiveSubjects.map((sub, index) => (
                  <div
                    key={sub.id}
                    onClick={() => onNavigate('topics', sub.id)}
                    className="p-4 border border-[#E8E2D9]/75 hover:border-[#5A5A40]/30 hover:bg-[#FDFCF8] rounded-xl transition-all cursor-pointer group flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-sans text-xs font-bold text-[#9A9184] w-6 shrink-0">0{index + 1}</span>
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
                            <span className="px-1.5 py-0.5 bg-[#8DA38A]/10 text-[#8DA38A] text-[9px] font-bold uppercase rounded">
                              {sub.masteredCount} Mastered
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-5 sm:text-right shrink-0">
                      <div>
                        <span className="block font-sans text-xs text-[#6B6357] font-medium leading-none">
                          <strong className="text-[#2D2A26]/90 font-bold">{sub.count}</strong> {sub.count === 1 ? 'mistake' : 'mistakes'}
                        </span>
                        <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider block mt-1">
                          {sub.mastery}% Mastered
                        </span>
                      </div>
                      
                      {/* Visual Mini Progress Bar */}
                      <div className="w-16 h-1 w-full bg-[#F5F2ED] border border-[#E8E2D9] rounded-full overflow-hidden hidden sm:block">
                        <div
                          className="h-full bg-[#5A5A40]"
                          style={{ width: `${sub.mastery}%` }}
                        ></div>
                      </div>
                      
                      <ChevronRight className="w-4 h-4 text-[#9A9184] group-hover:text-[#5A5A40] transition-colors" />
                    </div>
                  </div>
                ))}
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
              <span className="font-sans text-xs font-bold tracking-widest text-[#9A9184] uppercase">CURRENT STREAK</span>
              <p className="font-serif text-4xl font-semibold mt-2 flex items-baseline gap-1 text-[#2D2A26]">
                12 Days
                <Flame className="w-6 h-6 text-[#D98A6C] fill-[#D98A6C] animate-pulse ml-2 inline-block self-center align-middle" />
              </p>
              <p className="text-xs text-[#6B6357] mt-2">Consistent daily reflection drives 8x better exam performance.</p>
            </div>
            
            <button
              onClick={onStartReview}
              disabled={readyForReviewCount === 0}
              className={`w-full mt-4 py-3.5 bg-[#D98A6C] text-[#FDFCF8] rounded-full font-sans font-bold flex items-center justify-center gap-2 hover:bg-[#C17A5E] transition-all active:scale-95 duration-200 shadow-sm cursor-pointer ${readyForReviewCount === 0 ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <Flame className="w-4 h-4 text-[#FDFCF8] fill-[#FDFCF8]" />
              Quick Review ({readyForReviewCount})
            </button>
          </div>

          {/* Quick Info Box */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 space-y-3">
            <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest block">Study Tip</span>
            <p className="text-xs text-[#6B6357] leading-relaxed">
              Writing down your mistakes immediately in the <strong>Mistake Journal</strong> preserves contextual clarity before fatigue erases diagnostic memory. Take 2 minutes to rapid log now!
            </p>
          </div>

        </div>

      </section>

      {/* Heatmap Section */}
      <section className="bg-white border border-[#E8E2D9] rounded-2xl p-6 flex flex-col justify-between">
        <div className="flex justify-between items-end mb-4">
          <h3 className="font-serif text-xl font-medium text-[#2D2A26]">Mistake History Heatmap</h3>
          <span className="font-sans text-xs font-semibold text-[#9A9184] tracking-wider uppercase">PAST 30 DAYS</span>
        </div>

        {/* Grid representation */}
        <div className="grid grid-cols-5 sm:grid-cols-10 gap-2 py-4">
          {last30DaysGrid.map((day, idx) => {
            // opacity color based on count
            let bgColor = 'bg-[#F5F2ED] border-dashed border border-[#E8E2D9]';
            if (day.count === 1) bgColor = 'bg-[#E8E2D9] border border-[#E8E2D9]';
            else if (day.count === 2) bgColor = 'bg-[#5A5A40]/45';
            else if (day.count > 2) bgColor = 'bg-[#5A5A40] text-white';

            return (
              <div
                key={idx}
                className={`aspect-square rounded-lg flex flex-col items-center justify-center relative group cursor-pointer transition-transform duration-200 hover:scale-105 ${bgColor}`}
                title={`${day.count} logged on ${day.month} ${day.dayNum}`}
              >
                <span className="text-[10px] text-[#6B6357] select-none font-medium">{day.dayNum}</span>
                {day.count > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#D98A6C] text-[#FDFCF8] text-[9px] font-bold rounded-full flex items-center justify-center">
                    {day.count}
                  </span>
                )}
                {/* Tooltip */}
                <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-[#2D2A26] text-[#FDFCF8] text-[10px] font-medium rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap shadow-sm">
                  {day.count} {day.count === 1 ? 'mistake' : 'mistakes'} logged ({day.month} {day.dayNum})
                </div>
              </div>
            );
          })}
        </div>
        <div className="flex justify-between mt-1 text-[11px] text-[#9A9184] font-medium">
          <span>30 days ago</span>
          <span>Today</span>
        </div>
      </section>

      {/* Your Subjects Grid List */}
      <section>
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-serif text-2xl text-[#2D2A26]">All Mapped Subjects</h3>
          <button
            onClick={() => onNavigate('topics')}
            className="text-[#2D2A26] font-semibold text-sm flex items-center gap-1.5 hover:text-[#5A5A40] transition-colors cursor-pointer"
          >
            View Subject Maps <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {useMemo(() => {
          if (subjectStats.length === 0) {
            return (
              <div className="bg-[#FDFCF8] border border-dashed border-[#E8E2D9] rounded-2xl p-12 text-center1">
                <AlertCircle className="w-8 h-8 text-[#9A9184] mx-auto mb-2" />
                <p className="font-sans text-sm text-[#9A9184]">No subjects created yet. Click below or go to Topics tab to add one.</p>
                <button
                  onClick={() => onNavigate('topics')}
                  className="mt-4 px-4 py-2 bg-[#D98A6C] text-white text-xs font-bold rounded-full cursor-pointer hover:bg-[#C17A5E] transition-colors"
                >
                  + Create First Subject
                </button>
              </div>
            );
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {subjectStats.map((sub) => {
                const icon = getSubjectIcon(sub.name);
                return (
                  <div
                    key={sub.id}
                    onClick={() => {
                      onNavigate('topics', sub.id);
                    }}
                    className="bg-white border border-[#E8E2D9] rounded-2xl p-6 hover:shadow-md hover:border-[#5A5A40]/30 transition-all duration-300 group cursor-pointer hover:translate-y-[-2px]"
                  >
                    <div className="w-12 h-12 rounded-full bg-[#5A5A40]/10 flex items-center justify-center mb-4 text-[#5A5A40] group-hover:bg-[#5A5A40]/15 transition-colors">
                      <span className="material-symbols-outlined font-normal text-2xl">{icon}</span>
                    </div>
                    <h4 className="font-serif text-xl text-[#2D2A26] mb-1 group-hover:text-[#5A5A40] transition-colors">{sub.name}</h4>
                    <p className="font-sans text-sm text-[#6B6357] mb-6">{sub.count} {sub.count === 1 ? 'Mistake' : 'Mistakes'}</p>

                    <div className="space-y-2">
                      <div className="flex justify-between font-sans text-xs font-semibold text-[#9A9184] uppercase tracking-wider">
                        <span>Mastery</span>
                        <span>{sub.mastery}%</span>
                      </div>
                      <div className="h-1.5 w-full bg-[#F5F2ED] rounded-full overflow-hidden border border-[#E8E2D9]">
                        <div
                          className="h-full bg-[#5A5A40] transition-all duration-700"
                          style={{ width: `${sub.mastery}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          );
        }, [subjectStats, onNavigate])}
      </section>

      {/* Insights Banner */}
      <section className="mt-8">
        <div className="relative overflow-hidden rounded-2xl bg-[#5A5A40] text-[#FDFCF8] p-8 md:p-12 shadow-sm">
          <div className="relative z-10 max-w-xl">
            <h3 className="font-serif text-2xl md:text-3.5xl font-medium mb-4">
              Identify your blind spots.
            </h3>
            <p className="font-sans text-base text-[#E8E2D9] leading-relaxed mb-6">
              Review history suggests study session focus pays off. You have achieved <span className="font-bold text-[#D98A6C]">83% mastery rate</span> in biology genetics, but calculation errors in chemistry remain prominent. Start a review to isolate calculations.
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
