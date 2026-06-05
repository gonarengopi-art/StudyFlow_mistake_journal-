/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry, MistakeCategory, ReviewStatus } from '../types';
import { Search, Filter, ArrowUpDown, RefreshCcw, Eye, Calendar, Tag, Layers, CheckSquare, Trash2 } from 'lucide-react';

interface MistakeLibraryViewProps {
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  mistakes: MistakeEntry[];
  onSelectMistake: (id: string) => void;
  deleteMistake: (id: string) => void;
}

export function MistakeLibraryView({
  subjects,
  topics,
  subtopics,
  mistakes,
  onSelectMistake,
  deleteMistake,
}: MistakeLibraryViewProps) {
  
  // States for query, filters and sorts
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'title'>('newest');
  const [mistakeToDelete, setMistakeToDelete] = useState<MistakeEntry | null>(null);

  // Categories list
  const allCategories: MistakeCategory[] = [
    'Careless Error',
    'Content Gap',
    'Misread Question',
    'Exam Technique',
    'Timing Issue',
    'Calculation Error',
    'Knowledge Recall',
    'Other'
  ];

  // Topics filtered by selected subject
  const currentTopics = useMemo(() => {
    if (!selectedSubjectId) return [];
    return topics.filter((t) => t.subjectId === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  // Subtopics filtered by selected topic
  const currentSubtopics = useMemo(() => {
    if (!selectedTopicId) return [];
    return subtopics.filter((st) => st.topicId === selectedTopicId);
  }, [subtopics, selectedTopicId]);

  // Reset dependent filters if parent updates
  const handleSubjectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedSubjectId(e.target.value);
    setSelectedTopicId('');
    setSelectedSubtopicId('');
  };

  const handleTopicChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedTopicId(e.target.value);
    setSelectedSubtopicId('');
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedSubjectId('');
    setSelectedTopicId('');
    setSelectedSubtopicId('');
    setSelectedStatus('');
    setSelectedCategory('');
    setSortBy('newest');
  };

  // Computed filter system matching specifications of Feature 5
  const filteredMistakes = useMemo(() => {
    let result = [...mistakes];

    // 1. Search Query (Title, Reflection, Explanations, Advice/Notes)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter((m) => {
        return (
          m.title.toLowerCase().includes(q) ||
          m.reflection.toLowerCase().includes(q) ||
          m.correctExplanation.toLowerCase().includes(q) ||
          m.futureAdvice.toLowerCase().includes(q) ||
          m.originalQuestion.toLowerCase().includes(q) ||
          m.whatIGotWrong.toLowerCase().includes(q)
        );
      });
    }

    // 2. Select Subject Filter
    if (selectedSubjectId) {
      result = result.filter((m) => m.subjectId === selectedSubjectId);
    }

    // 3. Select Topic Filter
    if (selectedTopicId) {
      result = result.filter((m) => m.topicId === selectedTopicId);
    }

    // 4. Select Subtopic Filter
    if (selectedSubtopicId) {
      result = result.filter((m) => m.subtopicId === selectedSubtopicId);
    }

    // 5. Status Filter
    if (selectedStatus) {
      result = result.filter((m) => m.status === selectedStatus);
    }

    // 6. Category/Tag Filter
    if (selectedCategory) {
      result = result.filter((m) => m.categories.includes(selectedCategory as MistakeCategory));
    }

    // Sort order
    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.dateLogged).getTime() - new Date(a.dateLogged).getTime();
      } else if (sortBy === 'oldest') {
        return new Date(a.dateLogged).getTime() - new Date(b.dateLogged).getTime();
      } else {
        return a.title.localeCompare(b.title);
      }
    });

    return result;
  }, [mistakes, searchQuery, selectedSubjectId, selectedTopicId, selectedSubtopicId, selectedStatus, selectedCategory, sortBy]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-[#E8E2D9] pb-5">
        <div>
          <h2 className="font-serif text-3xl font-semibold text-[#2D2A26] tracking-tight mb-2">
            Mistake Library
          </h2>
          <p className="font-sans text-sm text-[#6B6357]">
            Search, sort, filter, and review your compiled log records instantly.
          </p>
        </div>
        
        <button
          onClick={handleResetFilters}
          className="px-4 py-2 bg-[#F5F2ED] border border-[#E8E2D9] hover:bg-[#E8E2D9] rounded-full font-sans text-xs font-semibold text-[#2D2A26] flex items-center gap-1.5 self-start cursor-pointer transition-colors"
        >
          <RefreshCcw className="w-3.5 h-3.5 text-[#5A5A40]" /> Reset Filters
        </button>
      </div>

      {/* SEARCH BAR & GENERAL FILTERS BOX */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm space-y-4">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-[#9A9184] w-4 h-4" />
          <input
            type="text"
            placeholder="Search across mistake titles, reflections, advice notes, questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-sm pl-11 pr-4 py-3 bg-[#F5F2ED] border border-[#E8E2D9] focus:border-[#5A5A40] focus:bg-white rounded-xl outline-none transition-all text-[#2D2A26]"
          />
        </div>

        {/* Filters Matrix */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          
          {/* Subject Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Subject</label>
            <select
              value={selectedSubjectId}
              onChange={handleSubjectChange}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="">All Subjects</option>
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          {/* Topic Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Topic</label>
            <select
              value={selectedTopicId}
              onChange={handleTopicChange}
              disabled={!selectedSubjectId}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] disabled:opacity-50 text-[#2D2A26]"
            >
              <option value="">All Topics</option>
              {currentTopics.map((t) => (
                <option key={t.id} value={t.id}>{t.name}</option>
              ))}
            </select>
          </div>

          {/* Subtopic Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Subtopic</label>
            <select
              value={selectedSubtopicId}
              onChange={(e) => setSelectedSubtopicId(e.target.value)}
              disabled={!selectedTopicId}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] disabled:opacity-50 text-[#2D2A26]"
            >
              <option value="">All Subtopics</option>
              {currentSubtopics.map((st) => (
                <option key={st.id} value={st.id}>{st.name}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="">All Statuses</option>
              <option value="New">New</option>
              <option value="Reviewing">Reviewing</option>
              <option value="Mastered">Mastered</option>
            </select>
          </div>

          {/* Tag Filter */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Mistake Tag</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="">All Tags</option>
              {allCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort selection */}
          <div className="space-y-1">
            <label className="text-[10px] font-bold text-[#9A9184] uppercase tracking-wider block">Sort Order</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full p-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl text-xs outline-none focus:border-[#5A5A40] text-[#2D2A26]"
            >
              <option value="newest">Newest Log Date</option>
              <option value="oldest">Oldest Log Date</option>
              <option value="title">Alphabetical (A-Z)</option>
            </select>
          </div>

        </div>
      </div>

      {/* MISTAKES COUNTER */}
      <div className="px-1 flex justify-between items-center text-xs text-[#9A9184]">
        <span>Found {filteredMistakes.length} mistakes matching filters</span>
        <span>Total Library: {mistakes.length} logs</span>
      </div>

      {/* RESULTS LIST DECK */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredMistakes.length === 0 ? (
          <div className="md:col-span-2 bg-[#F5F2ED] border border-dashed border-[#E8E2D9] rounded-2xl p-16 text-center text-[#9A9184] animate-fade-in">
            <Filter className="w-8 h-8 text-[#5A5A40] mx-auto mb-2" />
            <p className="text-sm font-semibold mb-1">No Mistakes found matching criteria</p>
            <p className="text-xs mb-4">Try clearing filters or performing a broader search.</p>
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-[#D18A6C] text-white text-xs font-semibold rounded-full cursor-pointer hover:bg-[#C17A5E] transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          filteredMistakes.map((log) => {
            const subjectName = subjects.find((s) => s.id === log.subjectId)?.name || 'Unknown';
            const topicName = topics.find((t) => t.id === log.topicId)?.name || 'Unknown';
            const subtopicName = subtopics.find((st) => st.id === log.subtopicId)?.name || '';

            return (
              <div
                key={log.id}
                onClick={() => onSelectMistake(log.id)}
                className="bg-white border border-[#E8E2D9] rounded-2xl p-5 hover:shadow-md hover:border-[#5A5A40]/30 transition-all cursor-pointer flex flex-col justify-between group h-full relative"
              >
                <div>
                  {/* Top line mapping details */}
                  <div className="flex justify-between items-start gap-4 mb-2">
                    <span className="text-[10px] font-bold text-[#9A9184] uppercase tracking-widest truncate max-w-[65%]">
                      {subjectName} <span className="opacity-40 font-normal">/</span> {topicName} {subtopicName && <><span className="opacity-40 font-normal">/</span> {subtopicName}</>}
                    </span>
                    
                    <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                      <span className={`text-[10px] py-1 px-3.5 font-bold rounded-full ${log.status === 'Mastered' ? 'bg-[#8DA38A] text-white' : log.status === 'Reviewing' ? 'bg-[#D98A6C] text-white' : 'bg-[#E8E2D9] text-[#2D2A26]'}`}>
                        {log.status}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setMistakeToDelete(log);
                        }}
                        className="p-1 px-1.5 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded-md transition-colors cursor-pointer flex items-center justify-center self-center"
                        title="Delete Mistake Log"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-serif text-xl font-bold text-[#2D2A26] mb-2 group-hover:text-[#5A5A40] transition-colors">
                    {log.title}
                  </h3>

                  {/* Summary of reflection snippet */}
                  <p className="font-sans text-xs text-[#6B6357] line-clamp-3 mb-4 leading-relaxed bg-[#F5F2ED]/50 p-2.5 rounded-lg border border-[#E8E2D9]">
                    <span className="font-semibold text-[#2D2A26]">Reflection: </span>
                    {log.reflection || log.whatIGotWrong || log.originalQuestion}
                  </p>
                </div>

                {/* Footer labels */}
                <div className="border-t border-[#E8E2D9] pt-3 flex flex-wrap gap-2 items-center justify-between text-xs text-[#6B6357] mt-2 font-medium">
                  <div className="flex items-center gap-1 text-[#9A9184]">
                    <Calendar className="w-3.5 h-3.5 opacity-60" />
                    <span>{log.dateLogged}</span>
                  </div>

                  {/* Category badges */}
                  <div className="flex gap-1">
                    {log.categories.slice(0, 2).map((cat) => (
                      <span key={cat} className="text-[8px] bg-[#E8E2D9] text-[#4A453E] px-2 py-0.5 rounded-md font-sans uppercase font-bold tracking-tight border border-[#E8E2D9]">
                        {cat}
                      </span>
                    ))}
                    {log.categories.length > 2 && (
                      <span className="text-[8px] bg-[#E8E2D9] text-[#4A453E] px-1.5 py-0.5 rounded-md font-bold border border-[#E8E2D9]">
                        +{log.categories.length - 2}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {mistakeToDelete && (
        <div className="fixed inset-0 bg-[#2D2A26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-2xl p-6 shadow-xl max-w-sm w-full animate-scale-up space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#2D2A26]">Confirm Deletion</h4>
              <p className="text-xs text-[#6B6357] mt-2 leading-relaxed">
                Deletions are permanent! Are you sure you want to delete the mistake log <strong>"{mistakeToDelete.title}"</strong>?
              </p>
            </div>
            <div className="flex gap-2 justify-center font-sans text-xs pt-1">
              <button
                type="button"
                onClick={() => setMistakeToDelete(null)}
                className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] rounded-full transition-colors cursor-pointer font-bold"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteMistake(mistakeToDelete.id);
                  setMistakeToDelete(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
