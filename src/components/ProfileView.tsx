/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry } from '../types';
import { User, Award, CheckCircle, Clock, RotateCcw, Save, Trash2, ShieldCheck, Mail, BrainCircuit } from 'lucide-react';

interface ProfileViewProps {
  userName: string;
  setUserName: (name: string) => void;
  subjects: Subject[];
  topics: Topic[];
  mistakes: MistakeEntry[];
  onResetToDemo: () => void;
  onClearAll: () => void;
  user: any; // User | null
  onSignInWithGoogle: () => Promise<void>;
  onLogout: () => Promise<void>;
  onOpenOnboarding?: () => void;
}

export function ProfileView({
  userName,
  setUserName,
  subjects,
  topics,
  mistakes,
  onResetToDemo,
  onClearAll,
  user,
  onSignInWithGoogle,
  onLogout,
  onOpenOnboarding,
}: ProfileViewProps) {
  const [tempName, setTempName] = useState(userName);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Calculate totals
  const totalSubCount = subjects.length;
  const totalTopCount = topics.length;
  const totalMistakeCount = mistakes.length;
  const masteredCount = mistakes.filter((m) => m.status === 'Mastered').length;

  const handleSaveName = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tempName.trim()) return;
    setUserName(tempName.trim());
    setSaveSuccess(true);
    setTimeout(() => {
      setSaveSuccess(false);
    }, 2000);
  };

  const [profileActionConfirm, setProfileActionConfirm] = useState<'reset' | 'clear' | null>(null);

  const handleResetTrigger = () => {
    setProfileActionConfirm('reset');
  };

  const handleClearTrigger = () => {
    setProfileActionConfirm('clear');
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto animate-fade-in">
      
      {/* Editorial Title */}
      <section className="border-b border-[#E8E2D9] pb-5">
        <h2 className="font-serif text-3xl font-semibold text-[#2D2A26] tracking-tight mb-2">Student Profile</h2>
        <p className="font-sans text-sm text-[#6B6357]">Manage your study identity and mistake journal database sessions.</p>
      </section>

      {/* Onboarding Guide Card */}
      {onOpenOnboarding && (
        <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm animate-slide-down">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-[#5A5A40]/10 flex items-center justify-center shrink-0 text-[#5A5A40]">
              <BrainCircuit className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-serif text-sm font-bold text-[#2D2A26]">Need a Refresher?</h4>
              <p className="text-xs text-[#6B6357]">Re-launch the step-by-step interactive onboarding tour anytime to review active recall strategies.</p>
            </div>
          </div>
          <button
            onClick={onOpenOnboarding}
            className="px-4.5 py-2.5 bg-[#5A5A40] hover:bg-[#4D4D36] text-white rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap shrink-0 shadow-sm"
          >
            Launch Guide Tour
          </button>
        </div>
      )}

      {/* Cloud Sync Status Widget */}
      <div className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm space-y-4">
        <h3 className="font-serif text-lg font-bold text-[#2D2A26] border-b border-[#E8E2D9]/40 pb-2 flex items-center gap-2">
          <span className={`w-2.5 h-2.5 rounded-full ${user ? 'bg-[#8DA38A] animate-pulse' : 'bg-gray-300'}`}></span>
          Real-Time Cloud Synchronization
        </h3>
        
        {user ? (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-[#E8E2D9] shrink-0">
                <img 
                  referrerPolicy="no-referrer"
                  src={user.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"} 
                  alt="User Avatar" 
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h4 className="font-serif text-base font-semibold text-[#2D2A26] leading-tight">{user.displayName || "Google Scholar"}</h4>
                <p className="text-xs text-[#6B6357] font-mono mt-0.5">{user.email}</p>
                <span className="inline-block mt-1.5 text-[9px] font-bold uppercase tracking-widest text-[#8DA38A] bg-[#8DA38A]/10 border border-[#8DA38A]/20 px-2 py-0.5 rounded-full">
                  Fully Backed Up
                </span>
              </div>
            </div>
            
            <button
              onClick={onLogout}
              className="px-4 py-2.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#2D2A26] border border-[#E8E2D9] rounded-xl text-xs font-bold transition-all cursor-pointer"
            >
              Sign Out Account
            </button>
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs text-[#6B6357] leading-relaxed max-w-md">
                Connect your Google account to automatically store, back up, and synchronize your mistake journals across all your devices in real-time.
              </p>
            </div>
            
            <button
              onClick={onSignInWithGoogle}
              className="px-5 py-3 bg-[#4285F4] hover:bg-[#357AE8] text-white rounded-full text-xs font-bold font-sans uppercase tracking-wider flex items-center gap-2 shrink-0 transition-colors shadow-sm cursor-pointer"
            >
              <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              Sign in with Google
            </button>
          </div>
        )}
      </div>

      {/* Profile Jumbotron Card */}
      <div className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
        
        {/* Avatar Area */}
        <div className="flex flex-col items-center text-center space-y-2 md:border-r border-[#E8E2D9] md:pr-6">
          <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-[#E8E2D9] shadow-inner shrink-0">
            <img
              referrerPolicy="no-referrer"
              src={user?.photoURL || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
              alt="Julian"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h3 className="font-serif text-lg font-bold text-[#2D2A26]">{userName}</h3>
            <span className="text-[10px] bg-[#E8E2D9]/40 text-[#2D2A26] border border-[#E8E2D9] px-3 py-0.5 rounded-full uppercase tracking-widest font-sans font-bold">
              {user ? 'Cloud Scholar' : 'Local Guest'}
            </span>
          </div>
        </div>

        {/* Name Settings Form */}
        <div className="md:col-span-2 space-y-4">
          <form onSubmit={handleSaveName} className="space-y-3">
            <div>
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1.5 font-sans">
                Edit Scholar ID Title
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Student name..."
                  value={tempName}
                  onChange={(e) => setTempName(e.target.value)}
                  disabled={!!user}
                  className="p-2.5 text-xs rounded-xl border border-[#E8E2D9] bg-[#F5F2ED]/25 outline-none w-full max-w-xs focus:border-[#5A5A40] focus:bg-white text-black font-semibold disabled:opacity-60"
                />
                <button
                  type="submit"
                  disabled={!!user}
                  className="px-4 py-2.5 bg-[#2D2A26] hover:bg-[#4A453E] disabled:opacity-50 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1 cursor-pointer"
                >
                  <Save className="w-3.5 h-3.5" /> Save ID
                </button>
              </div>
              {user && (
                <span className="text-[10px] text-[#6B6357] leading-none mt-1.5 block">Google credentials map your ID dynamically.</span>
              )}
            </div>
            {saveSuccess && (
              <span className="text-xs text-green-600 font-sans block animate-fade-in">
                Profile ID name successfully saved.
              </span>
            )}
          </form>

          {/* Active stats overview summary */}
          <div className="border-t border-[#E8E2D9]/40 pt-3.5 text-xs text-[#6B6357] leading-normal">
            <span className="block font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider mb-2">Subject Index Overview</span>
            <ul className="grid grid-cols-2 gap-2 text-[#2D2A26]/80">
              <li>• Mapped Subjects: <strong className="text-black">{totalSubCount}</strong></li>
              <li>• Mapped Topics: <strong className="text-black">{totalTopCount}</strong></li>
              <li>• Total Logs: <strong className="text-black">{totalMistakeCount}</strong></li>
              <li>• Mastery Rate: <strong className="text-black">{totalMistakeCount > 0 ? Math.round((masteredCount / totalMistakeCount) * 100) : 0}%</strong></li>
            </ul>
          </div>
        </div>

      </div>

      {/* Database Session Administration Boxes */}
      <div className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm space-y-6">
        <h3 className="font-serif text-lg font-bold text-[#2D2A26] border-b border-[#E8E2D9]/40 pb-2">
          Administration & Data Reset
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          
          {/* Demo restore card */}
          <div className="border border-[#E8E2D9] p-4 rounded-xl space-y-3 bg-[#F5F2ED]/20">
            <div>
              <span className="font-bold text-[#2D2A26] text-xs block mb-1">Restore Premium Exam Demo</span>
              <p className="text-xs text-[#6B6357] leading-relaxed">
                Restore default study subjects like Advanced Physics, UCAT, Chemistry and Biology with mock question logs. Useful for exploring application states.
              </p>
            </div>
            <button
              onClick={handleResetTrigger}
              className="px-4 py-1.5 bg-white border border-[#E8E2D9] hover:bg-[#E8E2D9] text-[#2D2A26] rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5 text-[#9A9184]" /> Restore Defaults
            </button>
          </div>

          {/* Clear database card */}
          <div className="border border-red-150 p-4 rounded-xl space-y-3 bg-red-50/10">
            <div>
              <span className="font-bold text-red-650 text-xs block mb-1">Erase Mistake Journal Database</span>
              <p className="text-xs text-[#6B6357] leading-relaxed">
                Irreversibly delete all subject folders, topics categorizations, and mistake log items. Resetting to zero files on disk memory.
              </p>
            </div>
            <button
              onClick={handleClearTrigger}
              className="px-4 py-1.5 bg-red-55 hover:bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" /> Purge Journal Memory
            </button>
          </div>

        </div>

        {/* Secure local check */}
        <div className="flex items-center gap-2 text-xs text-[#6B6357] font-sans border-t border-[#E8E2D9]/40 pt-4">
          <ShieldCheck className="w-4 h-4 text-[#8DA38A]" />
          <span>Local session isolation safe. Your personal journal data conforms to client device memory bounds only.</span>
        </div>
      </div>

      {profileActionConfirm && (
        <div 
          className="fixed inset-0 bg-[#2D2A26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setProfileActionConfirm(null)}
        >
          <div 
            className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-2xl p-6 shadow-xl max-w-sm w-full animate-scale-up space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100 animate-pulse">
                <RotateCcw className="w-6 h-6 text-red-600" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#2D2A26]">
                {profileActionConfirm === 'reset' ? 'Restore Demo Database?' : 'Irreversible Action!'}
              </h4>
              <p className="text-xs text-[#6B6357] mt-3 leading-relaxed">
                {profileActionConfirm === 'reset' 
                  ? 'Are you sure you want to restore the premium demo subjects (Biology, UCAT, Chemistry, Physics) along with pre-loaded mock mistake entries? Your current local modifications will be replaced.'
                  : 'Are you sure you want to completely erase your mistake journal? This will delete all your custom subjects, topics, subtopics, and mistake logs permanently.'
                }
              </p>
            </div>
            <div className="flex gap-2 justify-center font-sans text-xs pt-1">
              <button
                type="button"
                onClick={() => setProfileActionConfirm(null)}
                className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] rounded-full transition-colors cursor-pointer font-bold"
              >
                No, Go Back
              </button>
              <button
                type="button"
                onClick={() => {
                  if (profileActionConfirm === 'reset') {
                    onResetToDemo();
                  } else {
                    onClearAll();
                  }
                  setProfileActionConfirm(null);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer font-bold"
              >
                Yes, Proceed
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
