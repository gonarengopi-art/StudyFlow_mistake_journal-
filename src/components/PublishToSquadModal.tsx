/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Send, Users, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { MistakeEntry, StudySquad } from '../types';

interface PublishToSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  mistake: MistakeEntry | null;
  squads: StudySquad[];
  onPublish: (mistake: MistakeEntry, squadId: string) => Promise<string>;
}

export function PublishToSquadModal({ isOpen, onClose, mistake, squads, onPublish }: PublishToSquadModalProps) {
  const [selectedSquadId, setSelectedSquadId] = useState<string>(squads[0]?.id || '');
  const [isPublishing, setIsPublishing] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !mistake) return null;

  const handlePublish = async () => {
    if (!selectedSquadId) {
      setError('Please select a study squad to publish to.');
      return;
    }
    setError(null);
    setIsPublishing(true);
    try {
      await onPublish(mistake, selectedSquadId);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1400);
    } catch (err: any) {
      setError(err?.message || 'Failed to publish to squad.');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9A9184] hover:text-[#2D2A26] rounded-full hover:bg-[#F0EAE1] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D98A6C]/10 border border-[#D98A6C]/30 flex items-center justify-center text-[#D98A6C]">
            <Send className="w-5 h-5 stroke-[2]" />
          </div>
          <h3 className="font-serif font-black text-2xl text-[#2D2A26]">Publish to Study Squad</h3>
          <p className="font-sans text-xs text-[#7A7265] mt-1">
            Contribute this mistake log to your squad's shared deck so peers can learn from it.
          </p>
        </div>

        {/* Mistake Card Preview */}
        <div className="bg-white border border-[#E8E2D9] rounded-xl p-3.5 mb-5 shadow-xs">
          <span className="font-sans text-[10px] uppercase font-bold text-[#9A9184] block mb-1">
            Selected Mistake
          </span>
          <h4 className="font-serif font-bold text-sm text-[#2D2A26] line-clamp-1">{mistake.title}</h4>
          <p className="font-sans text-xs text-[#5A5A40] line-clamp-2 mt-1 italic">
            "{mistake.originalQuestion}"
          </p>
        </div>

        {squads.length === 0 ? (
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-center text-xs text-amber-800 mb-4">
            You haven't joined or created any squads yet. Create a squad from the Squads tab first!
          </div>
        ) : (
          <div className="space-y-4 mb-5">
            <div>
              <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
                Target Study Squad
              </label>
              <select
                value={selectedSquadId}
                onChange={(e) => setSelectedSquadId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20 transition-all cursor-pointer"
              >
                {squads.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.code}) - {s.memberUids.length} members
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {error && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2 text-xs text-rose-800 mb-4 animate-fade-in">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800 mb-4 animate-fade-in">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>Published to squad deck successfully!</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2.5 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#5A5A40] font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isPublishing || squads.length === 0 || success}
            onClick={handlePublish}
            className="flex-1 py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:bg-[#E8E2D9] text-white disabled:text-[#9A9184] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isPublishing ? 'Publishing...' : 'Publish to Squad'}
          </button>
        </div>
      </div>
    </div>
  );
}
