/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Users, Sparkles, BookOpen, ArrowRight, AlertCircle } from 'lucide-react';
import { Subject, StudySquad } from '../types';

interface CreateSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  onCreate: (name: string, subjectId: string, description?: string) => Promise<StudySquad>;
  defaultSubjectId?: string;
}

export function CreateSquadModal({ isOpen, onClose, subjects, onCreate, defaultSubjectId }: CreateSquadModalProps) {
  const [name, setName] = useState('');
  const [subjectId, setSubjectId] = useState(defaultSubjectId || subjects[0]?.id || '');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError('Please provide a name for your study squad.');
      return;
    }
    if (!subjectId) {
      setError('Please choose a subject focus for this squad.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onCreate(name, subjectId, description);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create squad. Please try again.');
    } finally {
      setIsSubmitting(false);
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

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D98A6C]/10 border border-[#D98A6C]/30 flex items-center justify-center text-[#D98A6C]">
            <Users className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-serif font-black text-2xl text-[#2D2A26]">Create Study Squad</h3>
          <p className="font-sans text-xs text-[#7A7265] mt-1">
            Build a shared mistake bank with your study partners, pool tricky questions, and test each other.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
              Squad Name *
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              placeholder="e.g. Organic Chem Warriors, UCAT Sprint"
              className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20 transition-all placeholder:text-[#9A9184]"
              autoFocus
              maxLength={80}
            />
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
              Subject Discipline *
            </label>
            <select
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-sm font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20 transition-all cursor-pointer"
            >
              {subjects.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
              Focus Goal / Description (Optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Weekly problem drills, high-yield exam traps, and tricky formula derivations."
              rows={2}
              maxLength={250}
              className="w-full px-4 py-2.5 bg-white border border-[#E8E2D9] rounded-xl text-xs font-sans text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20 transition-all placeholder:text-[#9A9184] resize-none"
            />
          </div>

          <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-xl p-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-100/70 border border-amber-300 text-amber-800 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="text-[11px] text-[#7A7265]">
              A unique <strong className="text-[#2D2A26] font-semibold">6-character code</strong> and invite link will be generated automatically for your classmates.
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2 text-xs text-rose-800 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 px-4 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] text-[#5A5A40] font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="flex-1 py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:bg-[#E8E2D9] text-white disabled:text-[#9A9184] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                'Creating...'
              ) : (
                <>
                  Create Squad <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
