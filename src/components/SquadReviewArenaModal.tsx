/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  ArrowRight,
  Sparkles,
  Trophy,
  BrainCircuit,
  Eye,
  FileEdit,
  ThumbsUp,
} from 'lucide-react';
import { StudySquad, SquadMistakeEntry } from '../types';

interface SquadReviewArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  squad: StudySquad;
  mistakes: SquadMistakeEntry[];
  onFinishSession: (accuracy: number, cardsCount: number, masteredCount: number) => void;
}

export function SquadReviewArenaModal({
  isOpen,
  onClose,
  squad,
  mistakes,
  onFinishSession,
}: SquadReviewArenaModalProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isRevealed, setIsRevealed] = useState(false);
  const [scratchpad, setScratchpad] = useState('');
  const [showScratchpad, setShowScratchpad] = useState(false);

  // Scoring
  const [results, setResults] = useState<Array<'tricky' | 'partial' | 'mastered'>>([]);
  const [isFinished, setIsFinished] = useState(false);

  if (!isOpen) return null;

  if (mistakes.length === 0) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl w-full max-w-md shadow-2xl p-6 text-center">
          <BrainCircuit className="w-12 h-12 text-[#9A9184] mx-auto mb-3" />
          <h3 className="font-serif font-black text-xl text-[#2D2A26] mb-1">Squad Deck Empty</h3>
          <p className="font-sans text-xs text-[#7A7265] mb-5">
            This squad doesn't have any mistake cards yet. Publish cards from your personal mistake journal or click "Add Mistake"!
          </p>
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-[#2D2A26] text-white font-sans text-xs font-bold rounded-xl hover:bg-[#4A453E] transition-colors"
          >
            Back to Squad
          </button>
        </div>
      </div>
    );
  }

  const currentMistake = mistakes[currentIndex];
  const progressPercent = Math.round(((currentIndex) / mistakes.length) * 100);

  const handleScore = (outcome: 'tricky' | 'partial' | 'mastered') => {
    const updated = [...results, outcome];
    setResults(updated);
    setScratchpad('');
    setIsRevealed(false);

    if (currentIndex + 1 < mistakes.length) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Calculate final accuracy
      const totalPoints = updated.reduce((acc, curr) => {
        if (curr === 'mastered') return acc + 100;
        if (curr === 'partial') return acc + 50;
        return acc + 0;
      }, 0);
      const avgAccuracy = Math.round(totalPoints / updated.length);
      const masteredCount = updated.filter((r) => r === 'mastered').length;

      onFinishSession(avgAccuracy, updated.length, masteredCount);
      setIsFinished(true);
    }
  };

  const handleRestart = () => {
    setCurrentIndex(0);
    setIsRevealed(false);
    setResults([]);
    setIsFinished(false);
    setScratchpad('');
  };

  const currentAccuracy = results.length > 0
    ? Math.round(
        (results.reduce((acc, curr) => {
          if (curr === 'mastered') return acc + 100;
          if (curr === 'partial') return acc + 50;
          return acc + 0;
        }, 0) /
          results.length)
      )
    : 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden my-auto p-4 sm:p-6 relative flex flex-col max-h-[92vh]">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9] mb-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#D98A6C] animate-pulse" />
            <h3 className="font-serif font-black text-lg text-[#2D2A26] truncate max-w-[200px] sm:max-w-xs">
              {squad.name}
            </h3>
            <span className="font-sans text-[10px] uppercase font-bold text-[#9A9184] bg-white border border-[#E8E2D9] px-2 py-0.5 rounded-full hidden sm:inline">
              Squad Drill
            </span>
          </div>

          <div className="flex items-center gap-3">
            {!isFinished && (
              <span className="font-mono text-xs font-bold text-[#5A5A40]">
                Card {currentIndex + 1} of {mistakes.length}
              </span>
            )}
            <button
              onClick={onClose}
              className="p-1.5 text-[#9A9184] hover:text-[#2D2A26] rounded-full hover:bg-[#F0EAE1] transition-colors"
              title="Close review session"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Progress Bar */}
        {!isFinished && (
          <div className="w-full bg-[#E8E2D9] h-1.5 rounded-full overflow-hidden mb-4">
            <div
              className="bg-[#D98A6C] h-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        )}

        {/* Finished Screen */}
        {isFinished ? (
          <div className="py-8 text-center my-auto animate-fade-in">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-sm">
              <Trophy className="w-8 h-8" />
            </div>

            <span className="font-sans text-xs uppercase font-extrabold tracking-widest text-[#D98A6C] block mb-1">
              Session Completed!
            </span>
            <h2 className="font-serif font-black text-3xl text-[#2D2A26] mb-2">
              Squad Review Recorded
            </h2>
            <p className="font-sans text-xs text-[#7A7265] max-w-sm mx-auto mb-6">
              Your performance has been synced with the <strong className="text-[#2D2A26] font-semibold">{squad.name}</strong> mastery leaderboard!
            </p>

            {/* Score Grid */}
            <div className="grid grid-cols-3 gap-3 max-w-sm mx-auto mb-6">
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-3 text-center">
                <span className="font-sans text-[10px] text-[#9A9184] uppercase font-bold block mb-1">
                  Accuracy
                </span>
                <span className="font-mono font-black text-2xl text-[#2D2A26]">
                  {currentAccuracy}%
                </span>
              </div>
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-3 text-center">
                <span className="font-sans text-[10px] text-[#9A9184] uppercase font-bold block mb-1">
                  Reviewed
                </span>
                <span className="font-mono font-black text-2xl text-[#2D2A26]">
                  {mistakes.length}
                </span>
              </div>
              <div className="bg-white border border-[#E8E2D9] rounded-xl p-3 text-center">
                <span className="font-sans text-[10px] text-[#9A9184] uppercase font-bold block mb-1">
                  Mastered
                </span>
                <span className="font-mono font-black text-2xl text-emerald-700">
                  {results.filter((r) => r === 'mastered').length}
                </span>
              </div>
            </div>

            <div className="flex gap-2 max-w-sm mx-auto">
              <button
                onClick={handleRestart}
                className="flex-1 py-2.5 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2A26] font-sans text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Drill Again
              </button>
              <button
                onClick={onClose}
                className="flex-1 py-2.5 px-4 bg-[#2D2A26] hover:bg-[#4A453E] text-white font-sans text-xs font-bold rounded-xl transition-colors shadow-sm cursor-pointer"
              >
                Return to Squad
              </button>
            </div>
          </div>
        ) : (
          /* Active Card Review */
          <div className="flex-1 flex flex-col overflow-y-auto pr-1">
            {/* Card Metadata */}
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-xs text-[#7A7265]">
                  Contributed by <strong className="font-semibold text-[#2D2A26]">{currentMistake.authorName}</strong>
                </span>
                {currentMistake.lastEditedByName && (
                  <span className="text-[10px] text-[#9A9184] hidden sm:inline">
                    (edited by {currentMistake.lastEditedByName})
                  </span>
                )}
              </div>
              <div className="flex gap-1">
                {currentMistake.categories.map((cat) => (
                  <span
                    key={cat}
                    className="text-[10px] font-sans font-medium px-2 py-0.5 bg-white border border-[#E8E2D9] rounded-md text-[#5A5A40]"
                  >
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            {/* Question Card Box */}
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 mb-4 shadow-xs">
              <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#9A9184] block mb-1">
                Question Prompt
              </span>
              <h4 className="font-serif font-black text-lg text-[#2D2A26] mb-2">
                {currentMistake.title}
              </h4>
              <p className="font-serif text-sm sm:text-base text-[#2D2A26] leading-relaxed whitespace-pre-wrap">
                {currentMistake.originalQuestion}
              </p>
            </div>

            {/* Scratchpad Trigger */}
            <div className="mb-3">
              <button
                type="button"
                onClick={() => setShowScratchpad(!showScratchpad)}
                className="text-xs font-semibold text-[#5A5A40] hover:text-[#2D2A26] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <FileEdit className="w-3.5 h-3.5" />
                {showScratchpad ? 'Hide Scratchpad' : 'Open Scratchpad for Quick Calculations'}
              </button>
              {showScratchpad && (
                <textarea
                  value={scratchpad}
                  onChange={(e) => setScratchpad(e.target.value)}
                  placeholder="Draft your solution or formula derivation here before revealing the answer..."
                  rows={2}
                  className="w-full mt-2 px-3.5 py-2 bg-[#FFFDF9] border border-[#E8E2D9] rounded-xl text-xs font-mono text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] animate-fade-in"
                />
              )}
            </div>

            {/* Answer Reveal Area */}
            {!isRevealed ? (
              <button
                type="button"
                onClick={() => setIsRevealed(true)}
                className="w-full py-4 mt-auto bg-[#FAF8F5] hover:bg-[#F2ECE4] border-2 border-dashed border-[#D98A6C]/50 rounded-2xl text-center group cursor-pointer transition-all mb-2"
              >
                <div className="flex items-center justify-center gap-2 text-[#D98A6C] font-sans text-xs font-bold uppercase tracking-wider group-hover:scale-102 transition-transform">
                  <Eye className="w-4 h-4" /> Reveal Squad Solution & Pitfall Breakdown
                </div>
              </button>
            ) : (
              <div className="space-y-3 mb-4 animate-fade-in">
                {/* Peer attempt vs Correct Answer */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {currentMistake.myAnswer && (
                    <div className="bg-rose-50/70 border border-rose-200/80 rounded-xl p-3">
                      <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-rose-800 block mb-1">
                        Common Trap / Peer Mistake
                      </span>
                      <p className="font-sans text-xs text-rose-950 font-medium">
                        {currentMistake.myAnswer}
                      </p>
                    </div>
                  )}
                  <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-xl p-3">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-emerald-800 block mb-1">
                      Correct Answer
                    </span>
                    <p className="font-sans text-xs text-emerald-950 font-bold">
                      {currentMistake.correctAnswer || 'See explanation below'}
                    </p>
                  </div>
                </div>

                {/* Full Explanation */}
                {currentMistake.correctExplanation && (
                  <div className="bg-white border border-[#E8E2D9] rounded-xl p-3.5 shadow-xs">
                    <span className="font-sans text-[10px] font-bold uppercase tracking-wider text-[#5A5A40] block mb-1">
                      Concept Nuance & Explanation
                    </span>
                    <p className="font-sans text-xs text-[#2D2A26] leading-relaxed whitespace-pre-wrap">
                      {currentMistake.correctExplanation}
                    </p>
                  </div>
                )}

                {/* Squad Takeaway Advice */}
                {currentMistake.futureAdvice && (
                  <div className="bg-[#FAF8F5] border border-amber-200/80 rounded-xl p-3 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <div className="text-xs text-[#2D2A26]">
                      <strong className="font-semibold text-amber-900">Advice to Squad: </strong>
                      <span>{currentMistake.futureAdvice}</span>
                    </div>
                  </div>
                )}

                {/* Self Assessment Grading */}
                <div className="pt-2">
                  <span className="font-sans text-[11px] font-bold text-[#5A5A40] block mb-2 text-center">
                    How well did you know this question?
                  </span>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => handleScore('tricky')}
                      className="py-2.5 px-2 bg-white hover:bg-rose-50 border border-rose-200 text-rose-800 font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                      Still Tricky
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScore('partial')}
                      className="py-2.5 px-2 bg-white hover:bg-amber-50 border border-amber-200 text-amber-800 font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <HelpCircle className="w-3.5 h-3.5 text-amber-600" />
                      Almost
                    </button>
                    <button
                      type="button"
                      onClick={() => handleScore('mastered')}
                      className="py-2.5 px-2 bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                    >
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
                      Mastered!
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
