/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Sparkles,
  Zap,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  RotateCcw,
  ArrowRight,
  Flame,
  Award,
  BookOpen,
  Check,
  ChevronRight,
  RefreshCw,
  Lightbulb,
} from 'lucide-react';
import { MistakeEntry, Subject, Topic } from '../types';
import { generateClonePractice, ClonePracticeQuestion } from '../services/aiService';

interface AiClonePracticeModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistake: MistakeEntry | null;
  subject?: Subject;
  topic?: Topic;
  onMarkMastered?: (mistakeId: string) => void;
}

const playChime = (type: 'correct' | 'wrong') => {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();

    if (type === 'correct') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5
      osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.2); // G5
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.4);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } else {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, ctx.currentTime);
      osc.frequency.setValueAtTime(180, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.3);
      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch {
    // Audio context not allowed or failed
  }
};

export function AiClonePracticeModal({
  isOpen,
  onClose,
  mistake,
  subject,
  topic,
  onMarkMastered,
}: AiClonePracticeModalProps) {
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Challenging'>('Medium');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cloneData, setCloneData] = useState<ClonePracticeQuestion | null>(null);

  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const [streakCount, setStreakCount] = useState(0);
  const [isMasteredSaved, setIsMasteredSaved] = useState(false);

  // Fetch a new clone question
  const fetchCloneQuestion = async (selectedDiff = difficulty) => {
    if (!mistake) return;
    setLoading(true);
    setError(null);
    setSelectedOption(null);
    setIsSubmitted(false);
    setShowHint(false);
    setShowSolution(false);
    setIsMasteredSaved(false);

    try {
      const result = await generateClonePractice({
        originalQuestion: mistake.originalQuestion || mistake.title,
        correctAnswer: mistake.correctAnswer,
        whatIGotWrong: mistake.whatIGotWrong,
        reflection: mistake.reflection,
        subjectName: subject?.name,
        topicName: topic?.name,
        categories: mistake.categories,
        difficulty: selectedDiff,
      });
      setCloneData(result);
    } catch (err: any) {
      setError(err?.message || 'Could not generate clone question. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && mistake) {
      fetchCloneQuestion();
    }
  }, [isOpen, mistake?.id]);

  if (!isOpen || !mistake) return null;

  const handleSubmit = () => {
    if (!selectedOption || !cloneData) return;
    setIsSubmitted(true);
    const chosen = cloneData.options.find((o) => o.label === selectedOption);
    const isCorrect = chosen?.isCorrect || selectedOption === cloneData.correctOption;

    if (isCorrect) {
      playChime('correct');
      setStreakCount((prev) => prev + 1);
    } else {
      playChime('wrong');
    }
  };

  const chosenOptionObj = cloneData?.options.find((o) => o.label === selectedOption);
  const isAnswerCorrect =
    cloneData &&
    (chosenOptionObj?.isCorrect || selectedOption === cloneData.correctOption);

  const handleMarkMastered = () => {
    if (onMarkMastered && mistake) {
      onMarkMastered(mistake.id);
      setIsMasteredSaved(true);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#2D2A26]/75 backdrop-blur-sm flex items-center justify-center p-3 sm:p-5 overflow-y-auto animate-fade-in">
      <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-3xl max-w-2xl w-full shadow-2xl overflow-hidden my-auto flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-[#5A5A40] text-white p-4 sm:p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/10 flex items-center justify-center border border-white/20">
              <Sparkles className="w-5 h-5 text-[#E8D099]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] uppercase font-bold tracking-widest text-[#E8D099]">
                  Feature 2 • AI Practice Arena
                </span>
                {streakCount > 0 && (
                  <span className="px-2 py-0.5 bg-amber-500/30 border border-amber-300/40 rounded-full text-[10px] font-bold text-amber-200 flex items-center gap-1">
                    <Flame className="w-3 h-3 text-amber-300 fill-amber-300" /> {streakCount} Streak
                  </span>
                )}
              </div>
              <h3 className="font-serif text-lg font-bold text-[#FDFCF8]">
                AI Clone Practice Challenge
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Difficulty Bar & Context Strip */}
        <div className="bg-[#F5F2ED] border-b border-[#E8E2D9] px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 text-xs font-sans">
          <div className="flex items-center gap-2">
            <span className="text-[#6B6357] text-[11px] font-semibold">Target Concept:</span>
            <span className="bg-white px-2.5 py-1 rounded-full border border-[#E8E2D9] text-[#2D2A26] font-medium text-[11px] line-clamp-1 max-w-[220px]">
              {subject?.name ? `${subject.name} • ` : ''}
              {mistake.title}
            </span>
          </div>

          {/* Difficulty selector */}
          <div className="flex items-center gap-1 bg-white p-0.5 rounded-lg border border-[#E8E2D9]">
            {(['Easy', 'Medium', 'Challenging'] as const).map((diff) => (
              <button
                key={diff}
                disabled={loading}
                onClick={() => {
                  setDifficulty(diff);
                  fetchCloneQuestion(diff);
                }}
                className={`px-2.5 py-1 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer ${
                  difficulty === diff
                    ? 'bg-[#5A5A40] text-white shadow-xs'
                    : 'text-[#6B6357] hover:text-[#2D2A26]'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {loading ? (
            <div className="py-16 text-center space-y-4">
              <div className="relative w-14 h-14 mx-auto">
                <div className="w-14 h-14 rounded-full border-4 border-[#5A5A40]/20 border-t-[#5A5A40] animate-spin" />
                <Sparkles className="w-6 h-6 text-[#D98A6C] absolute inset-0 m-auto animate-pulse" />
              </div>
              <div>
                <h4 className="font-serif text-base font-bold text-[#2D2A26]">
                  Generating AI Clone Question...
                </h4>
                <p className="text-xs text-[#6B6357] mt-1 max-w-md mx-auto leading-relaxed">
                  Analyzing your mistake pattern in "{mistake.title}" and synthesizing a new variation with fresh values and distractor traps.
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-5 text-center space-y-3">
              <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
              <p className="text-xs font-semibold text-red-800">{error}</p>
              <button
                onClick={() => fetchCloneQuestion()}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold uppercase tracking-wider cursor-pointer inline-flex items-center gap-1.5"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Retry Generation
              </button>
            </div>
          ) : cloneData ? (
            <>
              {/* Question Header & Prompt */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold text-[#D98A6C] uppercase tracking-wider flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Clone Problem Challenge
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 bg-[#F5F2ED] rounded-full text-[#6B6357] border border-[#E8E2D9]">
                    {cloneData.difficulty}
                  </span>
                </div>
                <div className="text-xs sm:text-sm text-[#2D2A26] font-serif leading-relaxed whitespace-pre-wrap font-medium">
                  {cloneData.question}
                </div>
              </div>

              {/* Multiple Choice Options */}
              <div className="space-y-2.5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B6357] block">
                  Select Your Answer:
                </span>
                <div className="grid grid-cols-1 gap-2.5">
                  {cloneData.options.map((opt) => {
                    const isSelected = selectedOption === opt.label;
                    let optionStyle =
                      'bg-white border-[#E8E2D9] text-[#2D2A26] hover:border-[#5A5A40]/40';

                    if (isSubmitted) {
                      if (opt.isCorrect || opt.label === cloneData.correctOption) {
                        optionStyle =
                          'bg-emerald-50 border-emerald-400 text-emerald-950 ring-1 ring-emerald-300';
                      } else if (isSelected) {
                        optionStyle =
                          'bg-rose-50 border-rose-300 text-rose-950 ring-1 ring-rose-200';
                      } else {
                        optionStyle = 'bg-white/60 border-stone-200 opacity-60 text-[#6B6357]';
                      }
                    } else if (isSelected) {
                      optionStyle =
                        'bg-[#F5F2ED] border-[#5A5A40] text-[#2D2A26] ring-2 ring-[#5A5A40]/20';
                    }

                    return (
                      <button
                        key={opt.label}
                        type="button"
                        disabled={isSubmitted}
                        onClick={() => setSelectedOption(opt.label)}
                        className={`w-full text-left p-3.5 rounded-xl border transition-all flex items-start gap-3 cursor-pointer ${optionStyle}`}
                      >
                        <span
                          className={`w-6 h-6 rounded-lg text-xs font-bold flex items-center justify-center shrink-0 border transition-colors ${
                            isSubmitted
                              ? opt.isCorrect
                                ? 'bg-emerald-600 text-white border-emerald-600'
                                : isSelected
                                ? 'bg-rose-600 text-white border-rose-600'
                                : 'bg-[#F5F2ED] text-[#6B6357] border-[#E8E2D9]'
                              : isSelected
                              ? 'bg-[#5A5A40] text-white border-[#5A5A40]'
                              : 'bg-[#F5F2ED] text-[#6B6357] border-[#E8E2D9]'
                          }`}
                        >
                          {opt.label}
                        </span>
                        <div className="flex-1 text-xs font-sans leading-relaxed pt-0.5">
                          <div>{opt.text}</div>
                          {isSubmitted && (isSelected || opt.isCorrect) && opt.feedback && (
                            <p className="text-[11px] mt-1.5 font-sans italic opacity-90 border-t border-current/10 pt-1">
                              {opt.feedback}
                            </p>
                          )}
                        </div>
                        {isSubmitted && opt.isCorrect && (
                          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                        )}
                        {isSubmitted && isSelected && !opt.isCorrect && (
                          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons: Submit or Next */}
              {!isSubmitted ? (
                <div className="flex items-center justify-between pt-2">
                  <button
                    type="button"
                    onClick={() => setShowHint(!showHint)}
                    className="text-xs text-[#5A5A40] hover:text-[#2D2A26] flex items-center gap-1 font-semibold cursor-pointer py-1.5 px-3 rounded-lg hover:bg-[#F5F2ED]"
                  >
                    <Lightbulb className="w-4 h-4 text-amber-500" />
                    {showHint ? 'Hide Hint' : 'Get a Hint'}
                  </button>

                  <button
                    type="button"
                    disabled={!selectedOption}
                    onClick={handleSubmit}
                    className="px-6 py-2.5 bg-[#5A5A40] hover:bg-[#4A453E] disabled:opacity-40 text-white rounded-full font-sans text-xs font-bold uppercase tracking-wider shadow-sm transition-all flex items-center gap-2 cursor-pointer"
                  >
                    Check Answer <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                /* Post-Submission Result Card */
                <div
                  className={`rounded-2xl p-4 sm:p-5 border transition-all animate-fade-in space-y-3 ${
                    isAnswerCorrect
                      ? 'bg-emerald-50/70 border-emerald-200'
                      : 'bg-rose-50/60 border-rose-200'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isAnswerCorrect ? (
                        <>
                          <CheckCircle className="w-5 h-5 text-emerald-600" />
                          <h4 className="font-serif text-sm font-bold text-emerald-950">
                            Excellent! Concept Mastered!
                          </h4>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="w-5 h-5 text-rose-600" />
                          <h4 className="font-serif text-sm font-bold text-rose-950">
                            Fell for the trap! Correct answer was Option {cloneData.correctOption}.
                          </h4>
                        </>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-[#4A453E] leading-relaxed">
                    {cloneData.conceptSummary}
                  </p>

                  <div className="pt-2 flex flex-wrap gap-2 justify-between items-center border-t border-black/5">
                    <button
                      type="button"
                      onClick={() => setShowSolution(!showSolution)}
                      className="text-xs text-[#5A5A40] font-bold hover:underline cursor-pointer flex items-center gap-1"
                    >
                      <BookOpen className="w-3.5 h-3.5" />
                      {showSolution ? 'Hide Derivation' : 'View Full Step-by-Step Derivation'}
                    </button>

                    <div className="flex items-center gap-2">
                      {isAnswerCorrect && onMarkMastered && !isMasteredSaved && (
                        <button
                          type="button"
                          onClick={handleMarkMastered}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors shadow-xs"
                        >
                          <Award className="w-3.5 h-3.5" /> Mark Mistake Mastered
                        </button>
                      )}
                      {isMasteredSaved && (
                        <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" /> Mastered in Journal!
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => fetchCloneQuestion()}
                        className="px-4 py-2 bg-[#5A5A40] hover:bg-[#4A453E] text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer shadow-sm transition-all"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Practice Next Clone
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Progressive Hint Drawer */}
              {showHint && cloneData.hint && (
                <div className="bg-amber-50/80 border border-amber-200/80 rounded-xl p-3.5 text-xs text-amber-950 animate-fade-in flex items-start gap-2.5">
                  <Lightbulb className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold block uppercase tracking-wider text-[10px] text-amber-800">
                      Tutor Hint:
                    </span>
                    <p className="mt-0.5 leading-relaxed">{cloneData.hint}</p>
                  </div>
                </div>
              )}

              {/* Full Solution Breakdown */}
              {showSolution && cloneData.fullSolution && (
                <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4.5 space-y-2 animate-fade-in">
                  <span className="text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider block">
                    Pedagogical Solution Breakdown
                  </span>
                  <div className="text-xs font-serif text-[#2D2A26] leading-relaxed whitespace-pre-wrap">
                    {cloneData.fullSolution}
                  </div>
                </div>
              )}
            </>
          ) : null}
        </div>

        {/* Modal Footer */}
        <div className="bg-[#F5F2ED] border-t border-[#E8E2D9] px-5 py-3 flex items-center justify-between text-xs">
          <span className="text-[11px] text-[#6B6357] italic">
            Feature 2: Infinite dynamic AI clone questions prevent rote memorization.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] text-[#4A453E] font-bold text-xs rounded-full transition-colors cursor-pointer"
          >
            Close Arena
          </button>
        </div>
      </div>
    </div>
  );
}
