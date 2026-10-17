/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  Users,
  Copy,
  Check,
  Share2,
  Play,
  Plus,
  Heart,
  MessageSquare,
  Edit3,
  Trash2,
  Trophy,
  Award,
  BookOpen,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Search,
  Filter,
} from 'lucide-react';
import { StudySquad, SquadMistakeEntry, SquadMemberScore, Subject } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { InviteSquadModal } from './InviteSquadModal';
import { SquadMistakeModal } from './SquadMistakeModal';
import { SquadReviewArenaModal } from './SquadReviewArenaModal';

interface SquadDetailViewProps {
  squad: StudySquad;
  subjectName: string;
  subjects: Subject[];
  currentUserId: string;
  mistakes: SquadMistakeEntry[];
  scores: SquadMemberScore[];
  onBack: () => void;
  onAddMistake: (mistakeData: any) => Promise<string>;
  onEditMistake: (mistakeId: string, updates: any) => Promise<void>;
  onDeleteMistake: (mistakeId: string) => Promise<void>;
  onLikeMistake: (mistakeId: string) => Promise<void>;
  onRecordScore: (accuracy: number, cardsCount: number, masteredCount: number) => Promise<void>;
}

export function SquadDetailView({
  squad,
  subjectName,
  subjects,
  currentUserId,
  mistakes,
  scores,
  onBack,
  onAddMistake,
  onEditMistake,
  onDeleteMistake,
  onLikeMistake,
  onRecordScore,
}: SquadDetailViewProps) {
  const [activeTab, setActiveTab] = useState<'mistakes' | 'leaderboard'>('mistakes');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedCode, setCopiedCode] = useState(false);

  // Modals
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isAddMistakeOpen, setIsAddMistakeOpen] = useState(false);
  const [editingMistake, setEditingMistake] = useState<SquadMistakeEntry | null>(null);
  const [isReviewArenaOpen, setIsReviewArenaOpen] = useState(false);

  // Expanded mistake cards
  const [expandedMistakeIds, setExpandedMistakeIds] = useState<Set<string>>(new Set());

  const toggleExpand = (id: string) => {
    setExpandedMistakeIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleCopyCode = async () => {
    const success = await copyToClipboard(squad.code);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2000);
    }
  };

  const filteredMistakes = useMemo(() => {
    if (!searchQuery.trim()) return mistakes;
    const q = searchQuery.toLowerCase();
    return mistakes.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.originalQuestion.toLowerCase().includes(q) ||
        m.authorName.toLowerCase().includes(q) ||
        m.categories.some((c) => c.toLowerCase().includes(q))
    );
  }, [mistakes, searchQuery]);

  return (
    <div className="max-w-5xl mx-auto px-3 sm:px-6 pt-4 pb-24 animate-fade-in">
      {/* Back button */}
      <button
        onClick={onBack}
        className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#5A5A40] hover:text-[#2D2A26] mb-4 transition-colors cursor-pointer"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Study Squads
      </button>

      {/* Hero Banner for Squad */}
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 sm:p-7 mb-6 shadow-xs relative overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="font-sans text-[11px] font-bold text-[#D98A6C] uppercase tracking-wider bg-[#D98A6C]/10 px-2.5 py-0.5 rounded-full">
                {subjectName}
              </span>
              <span className="text-xs text-[#9A9184]">·</span>
              <span className="font-sans text-xs text-[#7A7265] flex items-center gap-1">
                <Users className="w-3.5 h-3.5" /> {squad.memberUids.length} members
              </span>
              <span className="text-xs text-[#9A9184]">·</span>
              <span className="font-sans text-xs text-[#7A7265]">
                Led by <strong className="font-semibold text-[#2D2A26]">{squad.ownerName}</strong>
              </span>
            </div>

            <h1 className="font-serif font-black text-2xl sm:text-3xl text-[#2D2A26] tracking-tight mb-2">
              {squad.name}
            </h1>

            {squad.description && (
              <p className="font-sans text-xs sm:text-sm text-[#7A7265] max-w-2xl leading-relaxed mb-4">
                {squad.description}
              </p>
            )}

            {/* 6-character Code Badge */}
            <div className="inline-flex items-center gap-2 bg-[#FAF8F5] border border-[#E8E2D9] px-3 py-1.5 rounded-xl">
              <span className="text-[11px] font-sans font-bold uppercase text-[#9A9184]">
                Squad Code:
              </span>
              <span className="font-mono font-black text-sm text-[#2D2A26] tracking-wider select-all">
                {squad.code}
              </span>
              <button
                onClick={handleCopyCode}
                className="p-1 text-[#5A5A40] hover:text-[#2D2A26] rounded transition-colors cursor-pointer"
                title="Copy Squad Code"
              >
                {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex sm:flex-col gap-2 shrink-0">
            <button
              onClick={() => setIsReviewArenaOpen(true)}
              disabled={mistakes.length === 0}
              className="flex-1 sm:flex-none py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:bg-[#E8E2D9] text-white disabled:text-[#9A9184] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
              title="Drill all shared squad cards in the Review Arena"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Practice Squad Deck ({mistakes.length})
            </button>
            <button
              onClick={() => setIsInviteOpen(true)}
              className="py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2A26] font-sans text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5 text-[#5A5A40]" /> Invite Classmates
            </button>
          </div>
        </div>

        {/* Member Avatar Stack */}
        <div className="mt-5 pt-4 border-t border-[#E8E2D9] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-sans text-xs font-medium text-[#7A7265]">Cohort:</span>
            <div className="flex -space-x-2 overflow-hidden">
              {squad.memberUids.slice(0, 6).map((uid, i) => {
                const name = squad.memberNames?.[uid] || (uid === squad.ownerUid ? squad.ownerName : `Member ${i + 1}`);
                const initial = name.charAt(0).toUpperCase();
                return (
                  <div
                    key={uid}
                    className="inline-block h-7 w-7 rounded-full ring-2 ring-white bg-[#5A5A40] text-white flex items-center justify-center text-[10px] font-bold font-sans shadow-xs"
                    title={name}
                  >
                    {initial}
                  </div>
                );
              })}
            </div>
            {squad.memberUids.length > 6 && (
              <span className="text-[11px] font-sans text-[#9A9184] font-medium">
                +{squad.memberUids.length - 6} more
              </span>
            )}
          </div>

          <span className="font-sans text-xs text-[#9A9184]">
            Created {new Date(squad.createdAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-[#E8E2D9] mb-6">
        <button
          onClick={() => setActiveTab('mistakes')}
          className={`pb-3 px-4 text-xs font-sans font-bold transition-all relative cursor-pointer ${
            activeTab === 'mistakes'
              ? 'text-[#2D2A26]'
              : 'text-[#9A9184] hover:text-[#5A5A40]'
          }`}
        >
          Shared Mistake Bank ({mistakes.length})
          {activeTab === 'mistakes' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D98A6C]" />
          )}
        </button>

        <button
          onClick={() => setActiveTab('leaderboard')}
          className={`pb-3 px-4 text-xs font-sans font-bold transition-all relative cursor-pointer flex items-center gap-1.5 ${
            activeTab === 'leaderboard'
              ? 'text-[#2D2A26]'
              : 'text-[#9A9184] hover:text-[#5A5A40]'
          }`}
        >
          <Trophy className="w-3.5 h-3.5 text-amber-600" />
          Mastery Leaderboard ({scores.length})
          {activeTab === 'leaderboard' && (
            <span className="absolute bottom-0 left-0 w-full h-0.5 bg-[#D98A6C]" />
          )}
        </button>
      </div>

      {/* TAB 1: Shared Mistake Bank */}
      {activeTab === 'mistakes' && (
        <div className="space-y-4">
          {/* Search & Add Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-[#9A9184] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search squad mistakes, authors, concepts..."
                className="w-full pl-9 pr-4 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-sans text-[#2D2A26] placeholder:text-[#9A9184] focus:outline-none focus:border-[#D98A6C]"
              />
            </div>

            <button
              onClick={() => {
                setEditingMistake(null);
                setIsAddMistakeOpen(true);
              }}
              className="py-2 px-4 bg-[#2D2A26] hover:bg-[#4A453E] text-white font-sans text-xs font-bold rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> Add Mistake to Squad
            </button>
          </div>

          {/* Cards List */}
          {filteredMistakes.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-10 text-center">
              <BookOpen className="w-10 h-10 text-[#9A9184] mx-auto mb-2" />
              <h4 className="font-serif font-bold text-lg text-[#2D2A26] mb-1">
                {searchQuery ? 'No matching mistakes found' : 'No mistake cards added yet'}
              </h4>
              <p className="font-sans text-xs text-[#7A7265] max-w-sm mx-auto mb-4">
                {searchQuery
                  ? 'Try adjusting your search terms.'
                  : 'Be the first to contribute a tricky question trap or exam misconception to this squad!'}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setIsAddMistakeOpen(true)}
                  className="py-2 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
                >
                  + Add First Mistake
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredMistakes.map((m) => {
                const isExpanded = expandedMistakeIds.has(m.id);
                const isAuthorOrOwner = m.authorUid === currentUserId || squad.ownerUid === currentUserId;
                const hasLiked = m.likedBy?.includes(currentUserId);

                return (
                  <div
                    key={m.id}
                    className="bg-white border border-[#E8E2D9] hover:border-[#D98A6C]/40 rounded-2xl p-4 sm:p-5 transition-all shadow-xs"
                  >
                    <div className="flex items-start justify-between gap-3 mb-2">
                      <div>
                        <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                          {m.categories.map((c) => (
                            <span
                              key={c}
                              className="text-[10px] font-sans font-medium px-2 py-0.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-md text-[#5A5A40]"
                            >
                              {c}
                            </span>
                          ))}
                        </div>
                        <h3 className="font-serif font-black text-base sm:text-lg text-[#2D2A26]">
                          {m.title}
                        </h3>
                      </div>

                      {/* Top Action Icons */}
                      <div className="flex items-center gap-1 shrink-0">
                        {/* Like button */}
                        <button
                          onClick={() => onLikeMistake(m.id)}
                          className={`p-1.5 rounded-lg border transition-colors flex items-center gap-1 text-xs font-sans font-medium cursor-pointer ${
                            hasLiked
                              ? 'bg-rose-50 border-rose-200 text-rose-700'
                              : 'bg-[#FAF8F5] hover:bg-[#F5F2ED] border-[#E8E2D9] text-[#7A7265]'
                          }`}
                          title="Thank peer for this explanation"
                        >
                          <Heart className={`w-3.5 h-3.5 ${hasLiked ? 'fill-rose-600 text-rose-600' : ''}`} />
                          <span>{m.likes || 0}</span>
                        </button>

                        {/* Collaborative Edit */}
                        <button
                          onClick={() => {
                            setEditingMistake(m);
                            setIsAddMistakeOpen(true);
                          }}
                          className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#5A5A40] transition-colors cursor-pointer"
                          title="Collaborate & edit explanation"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete button (owner or author) */}
                        {isAuthorOrOwner && (
                          <button
                            onClick={() => {
                              if (confirm('Are you sure you want to remove this mistake card from the squad?')) {
                                onDeleteMistake(m.id);
                              }
                            }}
                            className="p-1.5 rounded-lg bg-[#FAF8F5] hover:bg-rose-50 border border-[#E8E2D9] text-[#9A9184] hover:text-rose-700 transition-colors cursor-pointer"
                            title="Remove mistake card"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Question snippet */}
                    <p className="font-sans text-xs sm:text-sm text-[#4A453E] line-clamp-2 italic mb-3">
                      "{m.originalQuestion}"
                    </p>

                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="pt-3 border-t border-[#E8E2D9] space-y-3 mb-3 animate-fade-in">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                          {m.myAnswer && (
                            <div className="p-3 bg-rose-50/50 border border-rose-200 rounded-xl">
                              <span className="font-sans text-[10px] uppercase font-bold text-rose-800 block mb-1">
                                Student Attempt / Trap
                              </span>
                              <span className="text-rose-950 font-medium">{m.myAnswer}</span>
                            </div>
                          )}
                          <div className="p-3 bg-emerald-50/50 border border-emerald-200 rounded-xl">
                            <span className="font-sans text-[10px] uppercase font-bold text-emerald-800 block mb-1">
                              Correct Answer
                            </span>
                            <span className="text-emerald-950 font-bold">{m.correctAnswer}</span>
                          </div>
                        </div>

                        {m.correctExplanation && (
                          <div className="p-3.5 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl text-xs">
                            <span className="font-sans text-[10px] uppercase font-bold text-[#5A5A40] block mb-1">
                              Explanation & Solution
                            </span>
                            <p className="text-[#2D2A26] leading-relaxed whitespace-pre-wrap">
                              {m.correctExplanation}
                            </p>
                          </div>
                        )}

                        {m.futureAdvice && (
                          <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl text-xs flex items-start gap-2">
                            <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                            <div>
                              <strong className="font-semibold text-amber-900">Advice: </strong>
                              <span className="text-[#2D2A26]">{m.futureAdvice}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer Attribution & Toggle */}
                    <div className="flex items-center justify-between text-[11px] text-[#7A7265] pt-2 border-t border-[#F0EAE1]">
                      <div className="flex items-center gap-2">
                        <span>
                          Contributed by <strong className="font-semibold text-[#2D2A26]">{m.authorName}</strong>
                        </span>
                        {m.lastEditedByName && (
                          <span className="text-[#9A9184]">
                            · Edited by {m.lastEditedByName}
                          </span>
                        )}
                      </div>

                      <button
                        onClick={() => toggleExpand(m.id)}
                        className="inline-flex items-center gap-1 font-sans font-semibold text-[#5A5A40] hover:text-[#2D2A26] transition-colors cursor-pointer"
                      >
                        {isExpanded ? (
                          <>
                            Less <ChevronUp className="w-3.5 h-3.5" />
                          </>
                        ) : (
                          <>
                            View Breakdown <ChevronDown className="w-3.5 h-3.5" />
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Mastery Leaderboard & Accuracy */}
      {activeTab === 'leaderboard' && (
        <div className="space-y-4">
          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-5 mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-serif font-black text-lg text-[#2D2A26]">Squad Mastery Standings</h3>
                <p className="font-sans text-xs text-[#7A7265]">
                  Compare review session accuracy and cards mastered across your study cohort.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#E8E2D9] rounded-2xl overflow-hidden shadow-xs">
            <div className="grid grid-cols-12 px-4 py-3 bg-[#FAF8F5] border-b border-[#E8E2D9] text-[11px] font-sans font-bold uppercase tracking-wider text-[#9A9184]">
              <span className="col-span-1 text-center">Rank</span>
              <span className="col-span-5">Squad Member</span>
              <span className="col-span-2 text-center">Accuracy</span>
              <span className="col-span-2 text-center">Reviews</span>
              <span className="col-span-2 text-center">Mastered</span>
            </div>

            <div className="divide-y divide-[#E8E2D9]">
              {scores.map((score, index) => {
                const isMe = score.uid === currentUserId;
                const rank = index + 1;

                return (
                  <div
                    key={score.uid}
                    className={`grid grid-cols-12 px-4 py-3.5 items-center text-xs font-sans transition-colors ${
                      isMe ? 'bg-amber-50/40 font-semibold' : 'hover:bg-[#FAF8F5]'
                    }`}
                  >
                    <div className="col-span-1 text-center">
                      {rank === 1 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold text-xs">
                          🥇
                        </span>
                      ) : rank === 2 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-700 font-bold text-xs">
                          🥈
                        </span>
                      ) : rank === 3 ? (
                        <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-50 text-amber-900 font-bold text-xs">
                          🥉
                        </span>
                      ) : (
                        <span className="font-mono text-[#9A9184] font-bold">#{rank}</span>
                      )}
                    </div>

                    <div className="col-span-5 flex items-center gap-2 truncate">
                      <div className="w-7 h-7 rounded-full bg-[#5A5A40] text-white flex items-center justify-center text-[10px] font-bold shrink-0">
                        {score.displayName.charAt(0).toUpperCase()}
                      </div>
                      <span className="text-[#2D2A26] truncate">
                        {score.displayName} {isMe && <span className="text-[#D98A6C] text-[10px]">(You)</span>}
                      </span>
                    </div>

                    <div className="col-span-2 text-center">
                      <span className="font-mono font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                        {score.accuracy}%
                      </span>
                    </div>

                    <div className="col-span-2 text-center font-mono text-[#5A5A40]">
                      {score.reviewsCompleted} drills
                    </div>

                    <div className="col-span-2 text-center font-mono font-bold text-[#2D2A26]">
                      {score.cardsMastered}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="text-center pt-3">
            <button
              onClick={() => setIsReviewArenaOpen(true)}
              className="py-2.5 px-5 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm inline-flex items-center gap-2 cursor-pointer"
            >
              <Play className="w-3.5 h-3.5 fill-current" /> Drill Squad Cards & Update Score
            </button>
          </div>
        </div>
      )}

      {/* Modals */}
      <InviteSquadModal
        squad={squad}
        isOpen={isInviteOpen}
        onClose={() => setIsInviteOpen(false)}
      />

      <SquadMistakeModal
        isOpen={isAddMistakeOpen}
        onClose={() => {
          setIsAddMistakeOpen(false);
          setEditingMistake(null);
        }}
        squadId={squad.id}
        squadSubjectId={squad.subjectId}
        subjects={subjects}
        initialMistake={editingMistake}
        onSave={async (data) => {
          if (editingMistake) {
            await onEditMistake(editingMistake.id, data);
          } else {
            await onAddMistake(data);
          }
        }}
      />

      <SquadReviewArenaModal
        isOpen={isReviewArenaOpen}
        onClose={() => setIsReviewArenaOpen(false)}
        squad={squad}
        mistakes={mistakes}
        onFinishSession={(accuracy, count, mastered) => {
          onRecordScore(accuracy, count, mastered);
        }}
      />
    </div>
  );
}
