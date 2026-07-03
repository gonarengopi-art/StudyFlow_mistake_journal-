import React from 'react';
import { X, ArrowRight, ShieldAlert, Sparkles } from 'lucide-react';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onViewPerks: () => void;
  mistakesCount: number;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  onViewPerks,
  mistakesCount,
}: LimitReachedModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FDFCF8] border border-[#E8E2D9] w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-scale-up text-left">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 p-1.5 rounded-full bg-stone-100 hover:bg-stone-200 text-[#6B6357] hover:text-[#2D2A26] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Warning Accent */}
        <div className="h-2 bg-[#D98A6C]" />

        <div className="p-6 sm:p-8 space-y-6">
          {/* Icon and Alert Badge */}
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-[#D98A6C]">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 border border-amber-200 text-amber-800 text-[9px] font-mono font-bold uppercase tracking-wider mb-0.5">
                <Sparkles className="w-3 h-3" /> LIMIT REACHED
              </div>
              <h2 className="font-serif text-xl font-bold text-[#2D2A26]">
                Scholar Tier Cap Reached ({mistakesCount}/50)
              </h2>
            </div>
          </div>

          {/* Description */}
          <p className="text-xs sm:text-sm text-[#6B6357] leading-relaxed">
            You've reached the maximum capacity of <strong className="text-[#2D2A26] font-bold">50 free mistake journals</strong> on the Free Scholar Tier. 
            To log additional study logs and unlock premium master tools, we invite you to upgrade to our Lifetime Supporter tier.
          </p>

          {/* Action Arrow Button */}
          <button
            onClick={() => {
              onClose();
              onViewPerks();
            }}
            className="w-full py-3.5 px-5 bg-[#2D2A26] hover:bg-[#4A453E] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-between group hover:scale-[1.01] active:scale-98"
          >
            <span>Check out the perks of premium</span>
            <div className="flex items-center gap-1 text-[#D98A6C] font-semibold group-hover:translate-x-1 transition-transform">
              <span>View perks</span>
              <ArrowRight className="w-4 h-4" />
            </div>
          </button>

          {/* Dismiss option */}
          <div className="text-center pt-1">
            <button
              onClick={onClose}
              className="text-[11px] font-medium text-[#9A9184] hover:text-[#2D2A26] underline underline-offset-4 cursor-pointer transition-colors"
            >
              Continue managing current {mistakesCount} journals
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
