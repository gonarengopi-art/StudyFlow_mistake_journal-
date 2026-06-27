/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  GraduationCap, 
  Sparkles, 
  BookOpen, 
  CheckCircle, 
  TrendingUp, 
  Database, 
  ShieldCheck, 
  ArrowRight, 
  Lock,
  Focus,
  BrainCircuit,
  BookmarkCheck
} from 'lucide-react';

interface LandingPageProps {
  onSignInWithGoogle: () => Promise<void>;
  onContinueAsGuest: () => void;
  isLoading: boolean;
  onOpenLegal: (tab: 'privacy' | 'terms') => void;
}

type FeatureTab = 'log' | 'structure' | 'review';

export function LandingPage({ onSignInWithGoogle, onContinueAsGuest, isLoading, onOpenLegal }: LandingPageProps) {
  const [activeTab, setActiveTab] = useState<FeatureTab>('log');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [hasAccepted, setHasAccepted] = useState(false);
  const [showErrorHint, setShowErrorHint] = useState(false);

  const handleSignIn = async () => {
    if (!hasAccepted) {
      setShowErrorHint(true);
      return;
    }
    setIsSigningIn(true);
    try {
      await onSignInWithGoogle();
    } catch (e) {
      console.error('Google Sign-In failed:', e);
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleContinueGuest = () => {
    if (!hasAccepted) {
      setShowErrorHint(true);
      return;
    }
    onContinueAsGuest();
  };

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#2D2A26] font-sans flex flex-col justify-between">
      
      {/* Top Banner / Navbar */}
      <header className="w-full px-6 md:px-12 py-5 max-w-7xl mx-auto flex justify-between items-center z-10 border-b border-[#E8E2D9]/40">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-[#2D2A26] flex items-center justify-center text-[#FDFCF8]">
            <GraduationCap className="w-5.5 h-5.5" />
          </div>
          <div>
            <span className="font-serif text-lg font-bold tracking-tight text-[#2D2A26]">StudyFlow</span>
            <span className="text-[9px] block text-[#9A9184] font-mono tracking-widest leading-none uppercase">Mistake Journal</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <button 
            onClick={handleContinueGuest}
            className="text-xs font-semibold text-[#6B6357] hover:text-[#2D2A26] transition-colors"
          >
            Guest Sandbox
          </button>
          <button
            onClick={handleSignIn}
            disabled={isSigningIn || isLoading}
            className="px-4 py-2 bg-[#2D2A26] hover:bg-[#4A453E] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer"
          >
            {isSigningIn ? (
              <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
            ) : (
              <Lock className="w-3 h-3" />
            )}
            Sign In
          </button>
        </div>
      </header>

      {/* Hero Accent Section */}
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 md:px-12 py-12 md:py-20 grid grid-cols-1 md:grid-cols-12 gap-12 items-center">
        
        {/* Left Editorial Promo Copy */}
        <div className="md:col-span-7 space-y-6 animate-fade-in">
          
          <div className="inline-flex items-center gap-1.5 bg-[#8DA38A]/10 border border-[#8DA38A]/20 px-3 py-1 rounded-full">
            <Sparkles className="w-3.5 h-3.5 text-[#5A6F57]" />
            <span className="text-[10px] font-sans font-bold uppercase tracking-wider text-[#5A6F57]">
              The Scholar's Secret Weapon
            </span>
          </div>

          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-semibold tracking-tight text-[#2D2A26] leading-[1.1] max-w-xl">
            Turn your academic <span className="underline decoration-[#E6E1FF] decoration-4 underline-offset-4">mistakes</span> into absolute mastery.
          </h1>

          <p className="font-sans text-stone-600 text-sm md:text-base leading-relaxed max-w-lg">
            Stop making the same error twice. StudyFlow allows you to map individual questions, write rigorous reflections, and design an active recall feedback loop tailored specifically to your weak points.
          </p>

          {/* Legal Consent Checkbox Card */}
          <div className={`p-4 rounded-2xl border transition-all duration-300 max-w-lg ${
            showErrorHint 
              ? 'bg-red-50/70 border-red-300 shadow-sm shadow-red-100' 
              : 'bg-[#FAF8F5] border-[#E8E2D9] hover:border-[#2D2A26]/30'
          }`}>
            <div className="flex items-start gap-3 select-none">
              <input
                id="consent-checkbox"
                type="checkbox"
                checked={hasAccepted}
                onChange={(e) => {
                  setHasAccepted(e.target.checked);
                  if (e.target.checked) setShowErrorHint(false);
                }}
                className="mt-0.5 w-4.5 h-4.5 rounded border-[#E8E2D9] text-[#2D2A26] focus:ring-[#2D2A26] cursor-pointer accent-[#2D2A26]"
              />
              <span className="text-[11.5px] leading-relaxed text-[#6B6357]">
                <label htmlFor="consent-checkbox" className="cursor-pointer">I acknowledge and agree to StudyFlow's </label>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenLegal('terms');
                  }}
                  className="font-bold text-[#2D2A26] underline hover:text-stone-900 cursor-pointer"
                >
                  Terms & Conditions
                </button>{' '}
                and{' '}
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    onOpenLegal('privacy');
                  }}
                  className="font-bold text-[#2D2A26] underline hover:text-stone-900 cursor-pointer"
                >
                  Privacy Policy
                </button>
                .
              </span>
            </div>
            {showErrorHint && (
              <p className="text-[10px] text-red-600 font-bold tracking-tight mt-2 flex items-center gap-1 animate-fade-in">
                ⚠️ Please accept the Terms & Conditions and Privacy Policy to continue.
              </p>
            )}
          </div>

          <div className="pt-2 sm:flex items-center gap-3 space-y-3 sm:space-y-0">
            <button
              onClick={handleSignIn}
              disabled={isSigningIn || isLoading}
              className="w-full sm:w-auto px-6 py-3.5 bg-[#4285F4] hover:bg-[#357AE8] focus:ring-2 focus:ring-[#4285F4]/30 text-white rounded-xl text-xs font-bold font-sans uppercase tracking-wider flex items-center justify-center gap-2.5 transition-all shadow-md cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              {isSigningIn ? 'Connecting...' : 'Secure Sign-In with Google'}
            </button>

            <button
              onClick={handleContinueGuest}
              className="w-full sm:w-auto px-6 py-3.5 bg-white border border-[#E8E2D9] hover:bg-[#FDFCF8] hover:border-[#2D2A26] rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-1 cursor-pointer transition-colors"
            >
              Continue as Guest <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-[#9A9184] font-mono pt-4 border-t border-[#E8E2D9]/40 max-w-md">
            <div className="flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-[#8DA38A]" /> No passwords required
            </div>
            <div className="flex items-center gap-1">
              <Database className="w-3.5 h-3.5 text-[#8DA38A]" /> Real-time automatic cloud backups
            </div>
          </div>
        </div>

        {/* Right Feature Showcase & Cards */}
        <div className="md:col-span-5 bg-white border border-[#E8E2D9] p-6 rounded-3xl shadow-sm space-y-6 relative overflow-hidden self-start">
          
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-lg font-bold text-[#2D2A26]">Interactive Showcase</h3>
            <p className="text-xs text-[#6B6357]">Explore the core workflows inside StudyFlow.</p>
          </div>

          {/* Interactive Feature Tabs selectors */}
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => setActiveTab('log')}
              className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                activeTab === 'log' 
                  ? 'bg-[#2D2A26] border-[#2D2A26] text-[#FDFCF8]' 
                  : 'bg-[#F2EFE9]/30 border-[#E8E2D9] text-[#6B6357] hover:bg-[#F2EFE9]'
              }`}
            >
              1. Log Mistake
            </button>
            <button
              onClick={() => setActiveTab('structure')}
              className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                activeTab === 'structure' 
                  ? 'bg-[#2D2A26] border-[#2D2A26] text-[#FDFCF8]' 
                  : 'bg-[#F2EFE9]/30 border-[#E8E2D9] text-[#6B6357] hover:bg-[#F2EFE9]'
              }`}
            >
              2. Brainstorm
            </button>
            <button
              onClick={() => setActiveTab('review')}
              className={`py-2 px-1 text-center rounded-xl border text-[10px] font-bold uppercase tracking-wider cursor-pointer transition-colors ${
                activeTab === 'review' 
                  ? 'bg-[#2D2A26] border-[#2D2A26] text-[#FDFCF8]' 
                  : 'bg-[#F2EFE9]/30 border-[#E8E2D9] text-[#6B6357] hover:bg-[#F2EFE9]'
              }`}
            >
              3. Master
            </button>
          </div>

          {/* Tab Description Container */}
          <div className="min-h-[160px] flex flex-col justify-between pt-2">
            {activeTab === 'log' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-[#E6E1FF] text-[#2D2A26] rounded-lg">
                    <Focus className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D2A26]">Structured Record Creation</h4>
                    <p className="text-xs text-[#6B6357] leading-relaxed mt-1">
                      Log your exact incorrect option selection alongside correct choices. Attach question screenshots or PDF reference fields instantly.
                    </p>
                  </div>
                </div>
                <div className="bg-[#F5F2ED] p-3 rounded-lg border border-[#E8E2D9]/70 text-[11px] font-serif italic text-stone-700">
                  "Selected Option B: Underestimated rate constant because I forgot to convert Celsius scale to Kelvins."
                </div>
              </div>
            )}

            {activeTab === 'structure' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-[#8DA38A]/20 text-[#5A6F57] rounded-lg">
                    <BrainCircuit className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D2A26]">Modules & Epiphanies</h4>
                    <p className="text-xs text-[#6B6357] leading-relaxed mt-1">
                      Organize your errors under clear academic hierarchies (Subjects → Topics → Subtopics) to isolate weak patterns.
                    </p>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-mono py-1">
                  <div className="p-2 border border-[#E8E2D9] rounded-lg bg-[#F5F2ED]/25">
                    <span className="block font-bold">Physics</span>
                    <span className="text-[8px] text-[#9A9184]">Subject</span>
                  </div>
                  <div className="p-2 border border-[#E8E2D9] rounded-lg bg-[#F5F2ED]/25">
                    <span className="block font-bold">Gas Laws</span>
                    <span className="text-[8px] text-[#9A9184]">Topic</span>
                  </div>
                  <div className="p-2 border border-[#E8E2D9] rounded-lg bg-[#F5F2ED]/25">
                    <span className="block font-bold">Kelvins</span>
                    <span className="text-[8px] text-[#9A9184]">Subtopic</span>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'review' && (
              <div className="space-y-3 animate-fade-in">
                <div className="flex items-start gap-2.5">
                  <div className="p-1.5 bg-[#E6E1FF] text-[#2D2A26] rounded-lg">
                    <BookmarkCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-[#2D2A26]">Active Recall Milestones</h4>
                    <p className="text-xs text-[#6B6357] leading-relaxed mt-1">
                      Turn mistake history into smart flashcards. Retest yourself over weak logs, review correct analysis prompts, and tag milestones.
                    </p>
                  </div>
                </div>
                <div className="flex justify-between items-center bg-[#8DA38A]/10 border border-[#8DA38A]/20 p-2 px-3 rounded-lg text-xs">
                  <span className="font-semibold text-[#5A6F57]">Weekly Mastery Score</span>
                  <strong className="text-[#2D2A26] font-mono">14 Mistakes Fixed</strong>
                </div>
              </div>
            )}

            {/* Micro quote block */}
            <div className="text-[10px] text-[#9A9184] italic pt-3 border-t border-[#E8E2D9]/40 flex items-center gap-1.5 font-mono">
              <TrendingUp className="w-3.5 h-3.5 text-[#8DA38A]" />
              <span>Studying smarter is easier when you track what failed.</span>
            </div>

          </div>

        </div>

      </main>

      {/* Trust Signoffs */}
      <footer className="w-full text-center py-6 text-[11px] text-[#9A9184] border-t border-[#E8E2D9]/40 font-mono space-y-2">
        <div className="flex justify-center gap-4 text-[10px] uppercase font-bold tracking-wider mb-1">
          <button 
            onClick={() => onOpenLegal('privacy')} 
            className="hover:text-[#2D2A26] transition-colors cursor-pointer"
          >
            Privacy Policy
          </button>
          <span>•</span>
          <button 
            onClick={() => onOpenLegal('terms')} 
            className="hover:text-[#2D2A26] transition-colors cursor-pointer"
          >
            Terms & Conditions
          </button>
        </div>
        <div>StudyFlow Mistake Journal © 2026 • Encrypted Secure Cloud Backups verified by Google Firebase Auth</div>
      </footer>

    </div>
  );
}
