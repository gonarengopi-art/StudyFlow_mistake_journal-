/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, UserPlus, ArrowRight, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { StudySquad } from '../types';

interface JoinSquadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onJoin: (code: string) => Promise<{ success: boolean; message: string; squad?: StudySquad }>;
  initialCode?: string;
}

export function JoinSquadModal({ isOpen, onClose, onJoin, initialCode = '' }: JoinSquadModalProps) {
  const [code, setCode] = useState(initialCode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!code.trim()) {
      setError('Please enter a 6-character squad code.');
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await onJoin(code);
      if (result.success) {
        setSuccessMsg(result.message);
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        setError(result.message);
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to join squad. Please check the code.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickDemoFill = (demoCode: string) => {
    setCode(demoCode);
    setError(null);
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
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#5A5A40]/10 border border-[#5A5A40]/30 flex items-center justify-center text-[#5A5A40]">
            <UserPlus className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-serif font-black text-2xl text-[#2D2A26]">Join a Study Squad</h3>
          <p className="font-sans text-xs text-[#7A7265] mt-1">
            Enter the 6-character code or invite link shared by your study partner.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block font-sans text-xs font-semibold text-[#5A5A40] mb-1.5">
              Squad Code or Invite Link
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase());
                setError(null);
              }}
              placeholder="e.g. BIO942 or paste URL"
              className="w-full px-4 py-3 bg-white border border-[#E8E2D9] rounded-xl text-center font-mono font-bold text-lg tracking-widest text-[#2D2A26] focus:outline-none focus:border-[#D98A6C] focus:ring-2 focus:ring-[#D98A6C]/20 transition-all uppercase placeholder:normal-case placeholder:font-sans placeholder:tracking-normal placeholder:text-sm placeholder:font-normal placeholder:text-[#9A9184]"
              autoFocus
              maxLength={60}
            />
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800 animate-fade-in">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2.5 text-xs text-emerald-800 animate-fade-in">
              <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting || !code.trim()}
            className="w-full py-3 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:bg-[#E8E2D9] text-white disabled:text-[#9A9184] font-sans text-xs font-bold uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center justify-center gap-2 cursor-pointer disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              'Enrolling...'
            ) : (
              <>
                Join Study Squad <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        {/* Demo Squad Shortcuts */}
        <div className="mt-6 pt-5 border-t border-[#E8E2D9]">
          <span className="font-sans text-[11px] font-semibold text-[#9A9184] block mb-2">
            Try active revision cohorts:
          </span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleQuickDemoFill('BIO942')}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] rounded-lg text-xs font-mono font-semibold text-[#5A5A40] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D98A6C]" /> BIO942 (Biology)
            </button>
            <button
              type="button"
              onClick={() => handleQuickDemoFill('CHM305')}
              className="px-2.5 py-1.5 bg-white hover:bg-[#F5F2ED] border border-[#E8E2D9] rounded-lg text-xs font-mono font-semibold text-[#5A5A40] flex items-center gap-1 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3 h-3 text-[#D98A6C]" /> CHM305 (Chemistry)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
