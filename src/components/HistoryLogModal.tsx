/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Search, 
  Calendar, 
  Filter, 
  ArrowUpRight, 
  BookOpen, 
  Clock, 
  CheckCircle, 
  RotateCcw,
  Sparkles,
  Bookmark
} from 'lucide-react';
import { Subject, Topic, MistakeEntry, ReviewStatus } from '../types';

interface HistoryLogModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  mistakes: MistakeEntry[];
  onSelectMistake: (id: string) => void;
}

export function HistoryLogModal({
  isOpen,
  onClose,
  subjects,
  topics,
  mistakes,
  onSelectMistake,
}: HistoryLogModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Filter & search logic
  const filteredMistakes = useMemo(() => {
    let result = [...mistakes];

    // Search query matches title, reflection, whatIGotWrong, originalQuestion
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.reflection.toLowerCase().includes(q) ||
          m.whatIGotWrong.toLowerCase().includes(q) ||
          m.originalQuestion.toLowerCase().includes(q)
      );
    }

    // Filter by subject
    if (selectedSubjectId) {
      result = result.filter((m) => m.subjectId === selectedSubjectId);
    }

    // Filter by status
    if (selectedStatus) {
      result = result.filter((m) => m.status === selectedStatus);
    }

    // Sort by date
    result.sort((a, b) => {
      const dateA = new Date(a.dateLogged).getTime();
      const dateB = new Date(b.dateLogged).getTime();
      return sortBy === 'newest' ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [mistakes, searchQuery, selectedSubjectId, selectedStatus, sortBy]);

  // Map subjects for easy lookup
  const subjectMap = useMemo(() => {
    const map: Record<string, Subject> = {};
    subjects.forEach((s) => {
      map[s.id] = s;
    });
    return map;
  }, [subjects]);

  // Map topics for easy lookup
  const topicMap = useMemo(() => {
    const map: Record<string, Topic> = {};
    topics.forEach((t) => {
      map[t.id] = t;
    });
    return map;
  }, [topics]);

  const handleSelectAndClose = (id: string) => {
    onSelectMistake(id);
    onClose();
  };

  const getStatusBadgeStyle = (status: ReviewStatus) => {
    switch (status) {
      case 'Mastered':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'Reviewing':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={onClose}
    >
      <div 
        className="bg-[#FDFCF8] border border-stone-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl max-h-[85vh] animate-scale-up flex flex-col relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top orange ribbon accent */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D98A6C]" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 mb-4">
          <div className="text-left">
            <h3 className="font-serif text-2xl font-bold text-[#2D2A26] flex items-center gap-2">
              <Bookmark className="w-5 h-5 text-[#D98A6C]" /> Log History
            </h3>
            <p className="text-xs text-[#6B6357]">
              Browse all {mistakes.length} logged mistakes, search your stack, and click any to open details.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-100 text-[#9A9184] hover:text-[#2D2A26] transition-colors cursor-pointer"
            title="Close History Log"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Filters and Search Bar */}
        <div className="space-y-3 mb-4 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#9A9184] w-4 h-4" />
            <input
              type="text"
              placeholder="Search history by title, reflection, question..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-sm pl-10 pr-4 py-2.5 bg-[#FAF8F5] border border-[#E8E2D9] focus:border-[#5A5A40] focus:bg-white rounded-xl outline-none transition-all text-[#2D2A26]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {/* Subject Filter */}
            <select
              value={selectedSubjectId}
              onChange={(e) => setSelectedSubjectId(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>

            {/* Status Filter */}
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Mastered">Mastered</option>
            </select>

            {/* Date Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="w-full p-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>
          </div>
        </div>

        {/* Main mistakes list */}
        <div className="flex-1 overflow-y-auto pr-1 space-y-2.5 min-h-[300px] max-h-[50vh]">
          {filteredMistakes.length === 0 ? (
            <div className="text-center py-12 bg-[#FAF8F5] rounded-2xl border border-dashed border-[#E8E2D9] space-y-3">
              <BookOpen className="w-8 h-8 text-[#9A9184] mx-auto opacity-50" />
              <p className="text-sm font-medium text-[#2D2A26]">No logged mistakes found</p>
              <p className="text-xs text-[#6B6357] max-w-md mx-auto px-4">
                {searchQuery || selectedSubjectId || selectedStatus
                  ? "Try resetting your search query or choosing another subject filter above."
                  : "Start logging your academic errors to cultivate active recall mastery!"}
              </p>
            </div>
          ) : (
            filteredMistakes.map((mistake) => {
              const sub = subjectMap[mistake.subjectId];
              const top = topicMap[mistake.topicId];
              const formattedDate = new Date(mistake.dateLogged).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });

              return (
                <div
                  key={mistake.id}
                  onClick={() => handleSelectAndClose(mistake.id)}
                  className="bg-white border border-[#E8E2D9] hover:border-[#5A5A40]/50 rounded-xl p-3.5 text-left cursor-pointer transition-all hover:shadow-xs group flex items-start justify-between gap-4"
                >
                  <div className="space-y-1.5 flex-1 min-w-0">
                    {/* Metadata line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[9px] font-mono font-bold tracking-wider text-[#9A9184] uppercase flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {formattedDate}
                      </span>
                      {sub && (
                        <span className="text-[9px] bg-[#5A5A40]/10 text-[#5A5A40] px-1.5 py-0.2 rounded font-sans font-bold">
                          {sub.name}
                        </span>
                      )}
                      {top && (
                        <span className="text-[9px] bg-[#FAF8F5] border border-[#E8E2D9] text-[#6B6357] px-1.5 py-0.2 rounded font-sans">
                          {top.name}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h4 className="text-sm font-bold text-[#2D2A26] font-serif group-hover:text-[#5A5A40] transition-colors leading-snug truncate">
                      {mistake.title}
                    </h4>

                    {/* What I got wrong preview snippet */}
                    {mistake.whatIGotWrong && (
                      <p className="text-xs text-[#6B6357] line-clamp-1 italic">
                        "{mistake.whatIGotWrong}"
                      </p>
                    )}
                  </div>

                  {/* Status indicator and action arrow */}
                  <div className="flex flex-col items-end gap-2 shrink-0">
                    <span className={`text-[9px] border px-2 py-0.5 rounded-full font-bold uppercase ${getStatusBadgeStyle(mistake.status)}`}>
                      {mistake.status}
                    </span>
                    <span className="text-xs text-[#9A9184] group-hover:text-[#5A5A40] flex items-center gap-0.5 transition-colors font-semibold">
                      Open <ArrowUpRight className="w-3.5 h-3.5 transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer with counts info */}
        <div className="mt-4 pt-3 border-t border-[#E8E2D9] flex justify-between items-center text-xs text-[#6B6357] shrink-0 font-sans">
          <span>
            Showing <strong className="text-[#2D2A26]">{filteredMistakes.length}</strong> of {mistakes.length} records
          </span>
          <button
            onClick={onClose}
            className="text-[#5A5A40] hover:text-[#2D2A26] font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
}
