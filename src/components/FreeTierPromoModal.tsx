import React from 'react';
import { X, Award, CheckCircle2, Sparkles, ShieldAlert, Zap, ArrowRight, Lock } from 'lucide-react';

interface FreeTierPromoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade: () => void;
  mistakesCount: number;
}

export function FreeTierPromoModal({
  isOpen,
  onClose,
  onUpgrade,
  mistakesCount,
}: FreeTierPromoModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-[#FDFCF8] border border-[#E8E2D9] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col relative animate-scale-up text-left">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 z-20 p-2 rounded-full bg-stone-100/80 hover:bg-stone-200 text-[#6B6357] hover:text-[#2D2A26] transition-colors cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-gradient-to-r from-[#2D2A26] via-[#3D3A36] to-[#2D2A26] text-white p-6 sm:p-8 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 w-48 h-48 bg-[#D98A6C]/20 rounded-full blur-3xl pointer-events-none" />
          
          <div className="relative z-10 space-y-2 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-400/30 text-amber-300 text-[11px] font-mono font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5 animate-pulse" />
              Account Welcome & Status Notice
            </div>
            <h2 className="font-serif text-2xl sm:text-3xl font-bold tracking-tight">
              You Are Currently On The <span className="text-amber-400 underline decoration-amber-400/40 underline-offset-4">Free Scholar Tier</span>
            </h2>
            <p className="text-xs sm:text-sm text-stone-300 leading-relaxed">
              Welcome to StudyFlow! Here is a transparent look at your active tier limitations and how you can permanently unlock unlimited active recall mastery.
            </p>
          </div>
        </div>

        {/* Side by Side Tier Comparison */}
        <div className="p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-6 bg-[#FAF8F5]">
          
          {/* Current Free Tier Panel */}
          <div className="bg-white border-2 border-stone-200/80 rounded-2xl p-6 flex flex-col justify-between space-y-6 relative">
            <div className="space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-stone-100">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-stone-100 text-stone-600">
                    <Lock className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-stone-900 text-base">Free Scholar Tier</h3>
                    <p className="text-[10px] text-stone-500 font-mono">Current Active Plan</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-stone-100 text-stone-600 font-mono text-[10px] font-bold">
                  $0 / forever
                </span>
              </div>

              {/* Quota Progress */}
              <div className="p-3 bg-stone-50 rounded-xl border border-stone-200/60 space-y-1.5">
                <div className="flex justify-between text-xs font-medium text-stone-700">
                  <span>Mistake Journals Logged</span>
                  <span className={mistakesCount >= 5 ? 'text-red-600 font-bold' : 'text-stone-900'}>{mistakesCount} / 5 Max</span>
                </div>
                <div className="w-full bg-stone-200 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${mistakesCount >= 5 ? 'bg-red-500' : 'bg-stone-600'}`}
                    style={{ width: `${Math.min(100, (mistakesCount / 5) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-stone-500">Free accounts can log up to 5 lifetime mistakes.</p>
              </div>

              <ul className="space-y-2.5 text-xs text-stone-600 pt-1">
                <li className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Capped at **maximum 5 mistake journals**</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Standard 1,000 daily database read quota</span>
                </li>
                <li className="flex items-start gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Basic cloud backup across devices</span>
                </li>
              </ul>
            </div>

            <div className="pt-2 text-center">
              <p className="text-[11px] text-stone-400 italic">
                You can continue using the Free Tier with these caps.
              </p>
            </div>
          </div>

          {/* Lifetime Supporter Panel */}
          <div className="bg-gradient-to-b from-amber-50/80 to-orange-50/40 border-2 border-[#D98A6C] rounded-2xl p-6 flex flex-col justify-between space-y-6 shadow-lg shadow-[#D98A6C]/10 relative overflow-hidden">
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-[#D98A6C]/10 rounded-full blur-xl pointer-events-none" />
            
            <div className="space-y-4 relative z-10">
              <div className="flex items-center justify-between pb-3 border-b border-[#D98A6C]/20">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-[#D98A6C] text-white shadow-xs">
                    <Award className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-[#2D2A26] text-base flex items-center gap-1.5">
                      Lifetime Supporter
                      <span className="bg-amber-400 text-stone-950 text-[9px] font-mono uppercase px-1.5 py-0.5 rounded font-extrabold tracking-tight">VIP</span>
                    </h3>
                    <p className="text-[10px] text-[#D98A6C] font-mono font-bold">Early Partner Special</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-[#2D2A26] font-serif">$20</span>
                  <span className="text-[10px] text-stone-500 block -mt-1">one-time flat</span>
                </div>
              </div>

              <div className="p-3 bg-white/80 rounded-xl border border-[#D98A6C]/30 flex items-center gap-2.5">
                <Zap className="w-5 h-5 text-[#D98A6C] shrink-0" />
                <p className="text-[11px] text-[#2D2A26] leading-snug font-medium">
                  Pay once today, **never pay monthly**. Bypasses future $9/mo subscription when early slots close.
                </p>
              </div>

              <ul className="space-y-2.5 text-xs text-[#2D2A26] font-medium pt-1">
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                  <span>**Unlimited mistake journals** (no 5-entry cap)</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                  <span>**Unlimited subjects, topics & subtopics**</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                  <span>**100,000+ daily quota** priority cloud index</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40] shrink-0 mt-0.5" />
                  <span>Permanent VIP early supporter badge</span>
                </li>
              </ul>
            </div>

            <button
              onClick={() => {
                onClose();
                onUpgrade();
              }}
              className="w-full py-3.5 px-6 bg-[#D98A6C] hover:bg-[#C17A5E] text-white rounded-xl font-sans text-xs font-bold uppercase tracking-widest transition-all cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center gap-2 relative z-10 hover:scale-[1.02] active:scale-98"
            >
              Upgrade To Lifetime For $20
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>

        </div>

        {/* Modal Footer */}
        <div className="bg-[#FAF8F5] border-t border-[#E8E2D9] px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-[#6B6357]">
          <span>Backed by secure Google Firebase cloud infrastructure.</span>
          <button
            onClick={onClose}
            className="font-semibold text-[#6B6357] hover:text-[#2D2A26] underline underline-offset-2 cursor-pointer transition-colors"
          >
            Continue with Free Tier limitations
          </button>
        </div>

      </div>
    </div>
  );
}
