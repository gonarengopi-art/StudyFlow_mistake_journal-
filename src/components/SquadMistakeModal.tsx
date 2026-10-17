/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, BookOpen, AlertCircle, Sparkles, Check } from 'lucide-react';
import { SquadMistakeEntry, MistakeCategory, Subject } from '../types';

interface SquadMistakeModalProps {
  isOpen: boolean;
  onClose: () => void;
  squadId: string;
  squadSubjectId: string;
  subjects: Subject[];
  initialMistake?: SquadMistakeEntry | null;
  onSave: (mistakeData: any) => Promise<void>;
}

const ALL_CATEGORIES: MistakeCategory[] = [
  'Careless Error',
  'Content Gap',
  'Misread Question',
  'Exam Technique',
  'Timing Issue',
  'Calculation Error',
  'Knowledge Recall',
  'Other',
];

export function SquadMistakeModal({
  isOpen,
  onClose,
  squadId,
  squadSubjectId,
  subjects,
  initialMistake,
  onSave,
}: SquadMistakeModalProps) {
  const isEditing = Boolean(initialMistake);

  const [title, setTitle] = useState(initialMistake?.title || '');
  const [originalQuestion, setOriginalQuestion] = useState(initialMistake?.originalQuestion || '');
  const [myAnswer, setMyAnswer] = useState(initialMistake?.myAnswer || '');
  const [correctAnswer, setCorrectAnswer] = useState(initialMistake?.correctAnswer || '');
  const [whatIGotWrong, setWhatIGotWrong] = useState(initialMistake?.whatIGotWrong || '');
  const [correctExplanation, setCorrectExplanation] = useState(initialMistake?.correctExplanation || '');
  const [futureAdvice, setFutureAdvice] = useState(initialMistake?.futureAdvice || '');
  const [categories, setCategories] = useState<MistakeCategory[]>(
    initialMistake?.categories || ['Careless Error']
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const toggleCategory = (cat: MistakeCategory) => {
    setCategories((prev) =>
      prev.includes(cat) ? (prev.length > 1 ? prev.filter((c) => c !== cat) : prev) : [...prev, cat]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Please provide a title for this mistake.');
      return;
    }
    if (!originalQuestion.trim()) {
      setError('Please include the original question or problem statement.');
      return;
    }
    if (!correctAnswer.trim() && !correctExplanation.trim()) {
      setError('Please provide either the correct answer or key explanation.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSave({
        title: title.trim(),
        subjectId: squadSubjectId,
        originalQuestion: originalQuestion.trim(),
        myAnswer: myAnswer.trim(),
        correctAnswer: correctAnswer.trim(),
        whatIGotWrong: whatIGotWrong.trim(),
        correctExplanation: correctExplanation.trim(),
        futureAdvice: futureAdvice.trim(),
        categories,
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to save mistake to squad.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/50 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto p-5 sm:p-7 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9A9184] hover:text-[#2D2A26] rounded-full hover:bg-[#F0EAE1] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#D98A6C]">
              {isEditing ? 'Collaborative Edit' : 'New Squad Card'}
            </span>
            {initialMistake?.authorName && (
              <span className="text-[11px] text-[#7A7265]">
                · Originally contributed by <strong className="font-semibold text-[#2D2A26]">{initialMistake.authorName}</strong>
              </span>
            )}
          </div>
          <h3 className="font-serif font-black text-2xl text-[#2D2A26]">
            {isEditing ? 'Refine Squad Mistake' : 'Add Mistake to Squad'}
          </h3>
          <p className="font-sans text-xs text-[#7A7265] mt-0.5">
            Document tricky problem traps, alternative solution nuances, or key takeaways for your cohort.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 max-h-[72vh] overflow-y-auto pr-1">
          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1">
              Title / Concept Trap *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Di-hybrid cross ratio vs phenotypic ratio"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20"
              maxLength={120}
              autoFocus
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1">
              Problem / Question Statement *
            </label>
            <textarea
              value={originalQuestion}
              onChange={(e) => setOriginalQuestion(e.target.value)}
              placeholder="Paste or write the exam question..."
              rows={3}
              className="w-full px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-sans text-xs font-semibold text-rose-800 mb-1">
                Common Student Attempt / Wrong Answer
              </label>
              <textarea
                value={myAnswer}
                onChange={(e) => setMyAnswer(e.target.value)}
                placeholder="e.g. 1:2:1 (confusing genotypic with phenotypic)"
                rows={2}
                className="w-full px-3.5 py-2 bg-rose-50/40 border border-rose-200 rounded-xl text-xs sm:text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-rose-400"
              />
            </div>
            <div>
              <label className="block font-sans text-xs font-semibold text-emerald-800 mb-1">
                Correct Answer *
              </label>
              <textarea
                value={correctAnswer}
                onChange={(e) => setCorrectAnswer(e.target.value)}
                placeholder="e.g. 3:1 (dominant purple masks white)"
                rows={2}
                className="w-full px-3.5 py-2 bg-emerald-50/40 border border-emerald-200 rounded-xl text-xs sm:text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-emerald-400"
              />
            </div>
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1">
              Step-by-Step Solution & Concept Nuance
            </label>
            <textarea
              value={correctExplanation}
              onChange={(e) => setCorrectExplanation(e.target.value)}
              placeholder="Explain the rigorous reason or formula derivation..."
              rows={3}
              className="w-full px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20"
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1">
              Advice for Squad Members (How to avoid this next time)
            </label>
            <input
              type="text"
              value={futureAdvice}
              onChange={(e) => setFutureAdvice(e.target.value)}
              placeholder="e.g. Always underline whether the question asks for phenotypic or genotypic ratio!"
              className="w-full px-3.5 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs sm:text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20"
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
              Error Category
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ALL_CATEGORIES.map((cat) => {
                const isSelected = categories.includes(cat);
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => toggleCategory(cat)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-sans transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-[#2D2A26] text-white font-semibold'
                        : 'bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#7A7265]'
                    }`}
                  >
                    {cat}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#5A5A40] font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:bg-[#E8E2D9] text-white disabled:text-[#9A9184] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSubmitting ? 'Saving...' : isEditing ? 'Save Changes' : 'Post to Squad'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
