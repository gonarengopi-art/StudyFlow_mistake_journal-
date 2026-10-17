/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Users,
  Plus,
  UserPlus,
  ArrowRight,
  Play,
  Copy,
  Check,
  Share2,
  Sparkles,
  Trophy,
  BookOpen,
  Search,
} from 'lucide-react';
import { StudySquad, Subject, SquadMistakeEntry, SquadMemberScore } from '../types';
import { copyToClipboard } from '../utils/clipboard';
import { CreateSquadModal } from './CreateSquadModal';
import { JoinSquadModal } from './JoinSquadModal';
import { InviteSquadModal } from './InviteSquadModal';

interface SquadsHubViewProps {
  squads: StudySquad[];
  subjects: Subject[];
  squadMistakes: Record<string, SquadMistakeEntry[]>;
  squadScores: Record<string, SquadMemberScore[]>;
  currentUserId: string;
  onSelectSquad: (squadId: string) => void;
  onCreateSquad: (name: string, subjectId: string, description?: string) => Promise<StudySquad>;
  onJoinSquad: (code: string) => Promise<{ success: boolean; message: string; squad?: StudySquad }>;
  onStartSquadReview: (squad: StudySquad) => void;
}

export function SquadsHubView({
  squads,
  subjects,
  squadMistakes,
  squadScores,
  currentUserId,
  onSelectSquad,
  onCreateSquad,
  onJoinSquad,
  onStartSquadReview,
}: SquadsHubViewProps) {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [inviteModalSquad, setInviteModalSquad] = useState<StudySquad | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [quickCodeInput, setQuickCodeInput] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const subjectMap = React.useMemo(() => {
    const map = new Map<string, string>();
    subjects.forEach((s) => map.set(s.id, s.name));
    return map;
  }, [subjects]);

  const handleCopyCode = async (squad: StudySquad, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = await copyToClipboard(squad.code);
    if (success) {
      setCopiedCodeId(squad.id);
      setTimeout(() => setCopiedCodeId(null), 2000);
    }
  };

  const handleQuickJoinSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickCodeInput.trim()) return;
    setIsJoinOpen(true);
  };

  const filteredSquads = React.useMemo(() => {
    if (!searchQuery.trim()) return squads;
    const q = searchQuery.toLowerCase();
    return squads.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.code.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q)) ||
        (subjectMap.get(s.subjectId) || '').toLowerCase().includes(q)
    );
  }, [squads, searchQuery, subjectMap]);

  return (
    <div className="max-w-6xl mx-auto px-3 sm:px-6 pt-5 pb-24 animate-fade-in">
      {/* Editorial Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-7 border-b border-[#E8E2D9] pb-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-full bg-[#D98A6C]/10 border border-[#D98A6C]/30 flex items-center justify-center text-[#D98A6C]">
              <Users className="w-4 h-4 stroke-[2]" />
            </div>
            <span className="font-sans text-[11px] font-bold tracking-wider text-[#9A9184] uppercase">
              Peer Learning & Error Exchange
            </span>
          </div>

          <h1 className="font-serif font-black text-2xl sm:text-3xl md:text-4xl text-[#2D2A26] tracking-tight">
            Study Squads
          </h1>
          <p className="font-sans text-xs sm:text-sm text-[#7A7265] max-w-xl mt-1 leading-relaxed">
            Team up with classmates to practice and share mistakes together. Compare review session accuracy and collaborate on tricky subject concepts.
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={() => setIsJoinOpen(true)}
            className="py-2.5 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2A26] font-sans text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
          >
            <UserPlus className="w-4 h-4 text-[#5A5A40]" /> Join with Code
          </button>

          <button
            onClick={() => setIsCreateOpen(true)}
            className="py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Create Study Squad
          </button>
        </div>
      </div>

      {/* Quick Join Banner */}
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 sm:p-5 mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100/80 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-serif font-bold text-sm text-[#2D2A26]">Have a 6-Character Squad Code?</h4>
            <p className="font-sans text-xs text-[#7A7265]">
              Paste the code or invite link from your classmate to immediately enter their shared deck.
            </p>
          </div>
        </div>

        <form onSubmit={handleQuickJoinSubmit} className="flex items-center gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={quickCodeInput}
            onChange={(e) => setQuickCodeInput(e.target.value.toUpperCase())}
            placeholder="e.g. BIO942"
            maxLength={60}
            className="px-3.5 py-2 bg-white border border-[#E8E2D9] rounded-xl text-xs font-mono font-bold tracking-wider text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] uppercase placeholder:normal-case placeholder:font-sans placeholder:text-xs placeholder:text-[#9A9184] w-full sm:w-36"
          />
          <button
            type="submit"
            className="py-2 px-3.5 bg-[#2D2A26] hover:bg-[#4A453E] text-white font-sans text-xs font-bold rounded-xl transition-colors shrink-0 cursor-pointer"
          >
            Join
          </button>
        </form>
      </div>

      {/* Squads Grid */}
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-serif font-black text-xl text-[#2D2A26]">
          Your Active Squads ({squads.length})
        </h2>
        {squads.length > 3 && (
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-[#9A9184] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter squads..."
              className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#E8E2D9] rounded-lg text-xs font-sans text-[#2D2A26] placeholder:text-[#9A9184]"
            />
          </div>
        )}
      </div>

      {filteredSquads.length === 0 ? (
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center">
          <Users className="w-12 h-12 text-[#9A9184] mx-auto mb-3" />
          <h3 className="font-serif font-black text-xl text-[#2D2A26] mb-1">No Study Squads Yet</h3>
          <p className="font-sans text-xs text-[#7A7265] max-w-md mx-auto mb-6">
            Create a squad for your revision group or join an existing study cohort using their 6-character code.
          </p>
          <div className="flex justify-center gap-3">
            <button
              onClick={() => setIsJoinOpen(true)}
              className="py-2.5 px-4 bg-white border border-[#E8E2D9] hover:bg-[#FAF8F5] text-[#2D2A26] font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Join with Code
            </button>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              + Create Study Squad
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSquads.map((squad) => {
            const subjectName = subjectMap.get(squad.subjectId) || 'General';
            const mistakeCount = squadMistakes[squad.id]?.length || 0;
            const scores = squadScores[squad.id] || [];
            const topScore = scores[0];
            const isCopied = copiedCodeId === squad.id;

            return (
              <div
                key={squad.id}
                onClick={() => onSelectSquad(squad.id)}
                className="bg-white border border-[#E8E2D9] hover:border-[#D98A6C]/50 hover:shadow-md rounded-2xl p-5 transition-all cursor-pointer flex flex-col justify-between group relative"
              >
                <div>
                  {/* Top Subject & Code */}
                  <div className="flex items-center justify-between gap-2 mb-2.5">
                    <span className="font-sans text-[10.5px] font-bold text-[#D98A6C] uppercase tracking-wider bg-[#D98A6C]/10 px-2 py-0.5 rounded-md">
                      {subjectName}
                    </span>

                    <div
                      onClick={(e) => handleCopyCode(squad, e)}
                      className="inline-flex items-center gap-1.5 bg-[#FAF8F5] hover:bg-[#F0EAE1] border border-[#E8E2D9] px-2 py-0.5 rounded-lg text-xs font-mono font-bold text-[#2D2A26] transition-colors"
                      title="Click to copy 6-character code"
                    >
                      <span>{squad.code}</span>
                      {isCopied ? (
                        <Check className="w-3 h-3 text-emerald-600" />
                      ) : (
                        <Copy className="w-3 h-3 text-[#9A9184]" />
                      )}
                    </div>
                  </div>

                  {/* Title & Description */}
                  <h3 className="font-serif font-black text-lg text-[#2D2A26] group-hover:text-[#D98A6C] transition-colors mb-1.5 leading-snug">
                    {squad.name}
                  </h3>

                  {squad.description && (
                    <p className="font-sans text-xs text-[#7A7265] line-clamp-2 mb-4 leading-relaxed">
                      {squad.description}
                    </p>
                  )}

                  {/* Stats Bar */}
                  <div className="grid grid-cols-2 gap-2 bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-2.5 mb-4 text-xs font-sans">
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9A9184] block">
                        Shared Cards
                      </span>
                      <span className="font-mono font-bold text-sm text-[#2D2A26]">
                        {mistakeCount} pitfalls
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] uppercase font-bold text-[#9A9184] block">
                        Members
                      </span>
                      <span className="font-mono font-bold text-sm text-[#2D2A26]">
                        {squad.memberUids.length} scholars
                      </span>
                    </div>
                  </div>

                  {/* Top Performer Badge */}
                  {topScore && (
                    <div className="flex items-center gap-2 text-xs text-[#5A5A40] mb-4">
                      <Trophy className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span className="truncate">
                        Leader: <strong className="font-semibold text-[#2D2A26]">{topScore.displayName}</strong> ({topScore.accuracy}% acc)
                      </span>
                    </div>
                  )}
                </div>

                {/* Footer Buttons */}
                <div className="pt-3 border-t border-[#E8E2D9] flex items-center justify-between gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setInviteModalSquad(squad);
                    }}
                    className="p-2 text-[#7A7265] hover:text-[#2D2A26] hover:bg-[#FAF8F5] rounded-lg transition-colors"
                    title="Invite classmates"
                  >
                    <Share2 className="w-4 h-4" />
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onStartSquadReview(squad);
                      }}
                      disabled={mistakeCount === 0}
                      className="py-1.5 px-3 bg-[#FAF8F5] hover:bg-[#E8E2D9] disabled:opacity-50 text-[#2D2A26] font-sans text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                      title="Drill squad cards"
                    >
                      <Play className="w-3 h-3 fill-current" /> Drill
                    </button>

                    <button
                      onClick={() => onSelectSquad(squad.id)}
                      className="py-1.5 px-3 bg-[#2D2A26] hover:bg-[#4A453E] text-white font-sans text-xs font-bold rounded-lg transition-colors flex items-center gap-1 cursor-pointer"
                    >
                      Open <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateSquadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        subjects={subjects}
        onCreate={onCreateSquad}
      />

      <JoinSquadModal
        isOpen={isJoinOpen}
        onClose={() => {
          setIsJoinOpen(false);
          setQuickCodeInput('');
        }}
        onJoin={onJoinSquad}
        initialCode={quickCodeInput}
      />

      {inviteModalSquad && (
        <InviteSquadModal
          squad={inviteModalSquad}
          isOpen={Boolean(inviteModalSquad)}
          onClose={() => setInviteModalSquad(null)}
        />
      )}
    </div>
  );
}
