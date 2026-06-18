/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Mail, Sparkles, X, Check, Bell } from 'lucide-react';

interface NewsletterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubscribe: (optIn: boolean) => void;
  userEmail: string;
}

export function NewsletterModal({ isOpen, onClose, onSubscribe, userEmail }: NewsletterModalProps) {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[120] bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in"
      onClick={() => {
        // Explicit selection preferred so user makes a clear choice, but allow dismiss to mark as false or exit
      }}
    >
      <div 
        className="bg-[#FDFCF8] border border-stone-200 rounded-3xl p-6 shadow-2xl w-full max-w-md animate-scale-up text-center relative overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Subtle decorative background pattern */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-[#D98A6C]" />

        {/* Header Icon badge */}
        <div className="mx-auto w-14 h-14 rounded-full bg-[#E6E1FF]/50 border border-[#d2cbfa]/50 flex items-center justify-center text-[#2D2A26] mb-4">
          <Mail className="w-7 h-7 text-[#D98A6C]" />
        </div>

        {/* Title */}
        <h3 className="font-serif text-2xl font-bold text-[#2D2A26] leading-snug mb-2">
          Join the StudyFlow Digest
        </h3>
        
        {/* Subtext description */}
        <p className="text-xs text-[#6B6357] leading-relaxed mx-auto max-w-sm mb-5">
          Get weekly insights on active recall optimization, cognitive error analysis strategies, and curated articles on boosting exam outcomes.
        </p>

        {/* Feature list for value proposition */}
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 mb-6 text-left space-y-3">
          <span className="text-[9px] font-bold text-[#D98A6C] uppercase tracking-widest block border-b border-[#E8E2D9] pb-1">
            Newsletter Highlights
          </span>
          <div className="flex items-start gap-2.5 text-xs text-[#2D2A26]">
            <span className="p-0.5 bg-[#E6E1FF] text-[#2D2A26] rounded mt-0.5">
              <Sparkles className="w-3 h-3 text-[#D98A6C]" />
            </span>
            <span>
              <strong>Deep-dive error audits:</strong> Real strategies to categorize and master exam room mental slips.
            </span>
          </div>
          <div className="flex items-start gap-2.5 text-xs text-[#2D2A26]">
            <span className="p-0.5 bg-emerald-50 text-emerald-800 rounded mt-0.5 border border-emerald-200">
              <Check className="w-3 h-3" />
            </span>
            <span>
              <strong>Zero Spam:</strong> Sent only once a week. Opt-out anytime with a single-click.
            </span>
          </div>
        </div>

        {/* Targeted Subscription Address Indicator */}
        <div className="text-[11px] text-[#6B6357] font-mono mb-6 bg-stone-100/55 border border-stone-200/50 py-1.5 px-3 rounded-lg inline-block truncate max-w-full">
          Signing up as: <strong className="text-[#2D2A26]">{userEmail}</strong>
        </div>

        {/* Action button triggers package */}
        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={() => onSubscribe(true)}
            className="w-full py-3 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl shadow-sm hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Bell className="w-4 h-4" />
            <span>YES, KEEP ME UPDATED</span>
          </button>
          
          <button
            type="button"
            onClick={() => onSubscribe(false)}
            className="w-full py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-500 hover:text-[#2D2A26] font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer"
          >
            No, thanks (Dismiss)
          </button>
        </div>

        {/* Little helpful security/compliance small-print */}
        <span className="block text-[9px] text-[#9A9184] mt-4">
          By subscribing, you agree to our quiet academic updates policy.
        </span>
      </div>
    </div>
  );
}
