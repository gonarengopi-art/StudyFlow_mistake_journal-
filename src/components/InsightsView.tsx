/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useMemo, useState } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry } from '../types';
import { Sparkles, AlertTriangle, AreaChart, Zap, Calendar, HeartPulse, Flame, Search } from 'lucide-react';

interface InsightsViewProps {
  subjects: Subject[];
  topics: Topic[];
  mistakes: MistakeEntry[];
  onTriggerReviewForTopic: (topicId: string) => void;
}

export function InsightsView({
  subjects,
  topics,
  mistakes,
  onTriggerReviewForTopic,
}: InsightsViewProps) {
  
  // 1. Calculate active statistics
  const totalMistakesCount = mistakes.length;
  const masteredCount = useMemo(() => {
    return mistakes.filter((m) => m.status === 'Mastered').length;
  }, [mistakes]);

  const retentionPercent = totalMistakesCount > 0 ? Math.round((masteredCount / totalMistakesCount) * 105) : 80;

  // 2. Compute Weakest Topic based on Unresolved Mistakes ratio (most count wins title)
  const weakestTopicDetails = useMemo(() => {
    if (mistakes.length === 0 || topics.length === 0) {
      return { name: 'None yet', count: 0, subjectName: '', id: '' };
    }

    const topicCounts: Record<string, number> = {};
    mistakes.forEach((m) => {
      if (m.status !== 'Mastered') {
        topicCounts[m.topicId] = (topicCounts[m.topicId] || 0) + 1;
      }
    });

    let maxCount = -1;
    let weakestTopicId = '';

    Object.entries(topicCounts).forEach(([tid, count]) => {
      if (count > maxCount) {
        maxCount = count;
        weakestTopicId = tid;
      }
    });

    if (!weakestTopicId) {
      // If everything is mastered or empty
      return { name: 'All Mastered!', count: 0, subjectName: 'Exemplary', id: '' };
    }

    const topic = topics.find((t) => t.id === weakestTopicId);
    const subject = subjects.find((s) => s?.id === topic?.subjectId);

    return {
      id: weakestTopicId,
      name: topic ? topic.name : 'Unknown Module',
      subjectName: subject ? subject.name : 'Unknown Subject',
      count: maxCount,
    };
  }, [mistakes, topics, subjects]);

  // 3. GitHub contributions styled Full Year Heatmap grid mapping (52 weeks = 364 days count)
  const fullYearHeatGrid = useMemo(() => {
    const today = new Date();
    const gridDays = [];

    // Jump back 52 weeks ago to get exact starting date
    const startDate = new Date();
    startDate.setDate(today.getDate() - 363); // 364 days total

    // Generate consecutive dates
    for (let i = 0; i < 364; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      const dateStr = currentDate.toISOString().split('T')[0];
      const count = mistakes.filter((m) => m.dateLogged === dateStr).length;

      gridDays.push({
        date: dateStr,
        dayNum: currentDate.getDate(),
        month: currentDate.toLocaleString('default', { month: 'short' }),
        count,
      });
    }

    return gridDays;
  }, [mistakes]);

  // Find which weeks cross into a new month to write week labels in correct columns
  const weekLabels = useMemo(() => {
    const labels = [];
    let prevMonth = '';
    for (let i = 0; i < 52; i++) {
      const firstDayOfWeek = fullYearHeatGrid[i * 7];
      if (!firstDayOfWeek) {
        labels.push('');
        continue;
      }
      const currentMonth = firstDayOfWeek.month;
      if (currentMonth !== prevMonth) {
        labels.push(currentMonth);
        prevMonth = currentMonth;
      } else {
        labels.push('');
      }
    }
    return labels;
  }, [fullYearHeatGrid]);

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Editorial Title */}
      <section className="border-b border-gray-100 pb-5">
        <h1 className="font-serif text-3xl md:text-5xl font-semibold text-black tracking-tight mb-2">Insights</h1>
        <p className="font-sans text-lg text-gray-400">Visualize your learning journey and bridge the gaps.</p>
      </section>

      {/* Main Grid Full-width container */}
      <div className="space-y-6">
        
        {/* Mistake Heatmap and Weaknesses cards */}
        <div className="space-y-6">
          
          {/* Heatmap Card */}
          <div className="bg-white border border-gray-100 p-6 rounded-2xl shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
              <h2 className="font-serif text-xl font-medium text-black">Mistake Heatmap</h2>
              
              <div className="flex items-center gap-2 text-xs font-sans text-gray-400">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 bg-stone-50 border border-gray-200 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#E6E1FF]/30 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#E6E1FF]/70 rounded-sm"></div>
                  <div className="w-3 h-3 bg-[#8c7df0] rounded-sm"></div>
                </div>
                <span>More</span>
              </div>
            </div>

            {/* Scrollable Container for Heatmap Contribution grid */}
            <div className="overflow-x-auto pb-2 scrollbar-none">
              <div className="min-w-max flex flex-col">
                <div className="grid grid-rows-7 grid-flow-col gap-1.5">
                  {fullYearHeatGrid.map((day, idx) => {
                    let bgColor = 'bg-stone-50 border border-gray-200/50 border-dashed';
                    if (day.count === 1) bgColor = 'bg-[#E6E1FF]/40 border border-[#E6E1FF]/50';
                    else if (day.count === 2) bgColor = 'bg-[#E6E1FF]/80';
                    else if (day.count > 2) bgColor = 'bg-[#8c7df0]';

                    return (
                      <div
                        key={idx}
                        className={`w-3.5 h-3.5 rounded-sm transition-transform duration-150 hover:scale-125 cursor-pointer relative group ${bgColor}`}
                      >
                        {/* Tooltip */}
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2.5 py-1 bg-black text-white text-[9px] font-bold rounded opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-150 z-20 whitespace-nowrap shadow-sm">
                          {day.count} {day.count === 1 ? 'log' : 'logs'} on {day.month} {day.dayNum}
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Dynamic Month Labels aligned exactly to the week columns below the heatmap */}
                <div className="relative h-4 mt-3 font-sans text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">
                  {weekLabels.map((label, colIdx) => {
                    if (!label) return null;
                    const leftOffset = colIdx * 20; // 14px (cell width) + 6px (gap) = 20px per week-column
                    return (
                      <span
                        key={colIdx}
                        className="absolute text-[10px] whitespace-nowrap"
                        style={{ left: `${leftOffset}px` }}
                      >
                        {label}
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Double split bento statistics details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Weakest Topic Card */}
            <div className="bg-white border border-gray-150/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="p-3 bg-red-50 text-red-500 rounded-full flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </span>
                
                <span className="font-sans text-xs font-bold text-red-500 uppercase tracking-widest">
                  Action Required
                </span>
              </div>

              <div>
                <h3 className="font-sans text-sm text-gray-400 mb-1">Weakest Topic</h3>
                <p className="font-serif text-3xl font-semibold text-black italic leading-tight mb-2 truncate">
                  {weakestTopicDetails.name}
                </p>
                <span className="text-xs bg-stone-50 px-2 py-0.5 rounded-md font-sans font-bold text-stone-500 uppercase">
                  {weakestTopicDetails.subjectName || 'None'}
                </span>
              </div>

              <div className="mt-6 flex items-center justify-between border-t border-gray-50 pt-3">
                <span className="font-sans text-[11px] text-gray-400">
                  {weakestTopicDetails.count ? `${weakestTopicDetails.count} unresolved failures` : 'All topics healthy'}
                </span>
                {weakestTopicDetails.id && (
                  <button
                    onClick={() => onTriggerReviewForTopic(weakestTopicDetails.id)}
                    className="bg-black hover:bg-stone-900 text-white px-4 py-2 rounded-full font-sans text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-sm"
                  >
                    Review Now
                  </button>
                )}
              </div>
            </div>

            {/* Retention Statistics Card */}
            <div className="bg-white border border-gray-150/10 p-6 rounded-2xl shadow-sm flex flex-col justify-between hover:translate-y-[-2px] transition-transform duration-300">
              <div className="flex items-start justify-between mb-4">
                <span className="p-3 bg-[#E6E1FF]/40 text-[#5e5c75] rounded-full flex items-center justify-center">
                  <AreaChart className="w-5 h-5" />
                </span>
                
                <span className="font-sans text-xs font-bold text-[#5e5c75] uppercase tracking-widest">
                  Retention
                </span>
              </div>

              <div>
                <h3 className="font-sans text-sm text-gray-400 mb-1">Total Mistakes Mapped</h3>
                <p className="font-serif text-4xl font-semibold text-black leading-tight mb-2">
                  {totalMistakesCount} Items
                </p>
              </div>

              <div className="mt-6 space-y-1.5 border-t border-gray-50 pt-3">
                <div className="flex justify-between text-[10px] font-sans font-bold text-gray-400 uppercase">
                  <span>General mastery level</span>
                  <span>{retentionPercent}%</span>
                </div>
                <div className="w-full bg-stone-50 h-1.5 rounded-full overflow-hidden border border-stone-100">
                  <div className="h-full bg-black transition-all duration-700" style={{ width: `${Math.min(retentionPercent, 100)}%` }}></div>
                </div>
                <p className="text-[10px] text-gray-400 leading-tight">12% decrease from base mistake velocity last month</p>
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
