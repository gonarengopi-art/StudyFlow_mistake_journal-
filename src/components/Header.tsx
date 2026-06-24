/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Menu, Search, User, Sparkles } from 'lucide-react';
import { ViewTab } from './BottomNavBar';

interface HeaderProps {
  userName: string;
  onNavigate: (view: ViewTab) => void;
  onActivateSearch: () => void;
  onOpenQuickAdd?: () => void;
  userPhoto?: string | null;
  isPremium?: boolean;
}

export function Header({ userName, onNavigate, onActivateSearch, onOpenQuickAdd, userPhoto, isPremium }: HeaderProps) {
  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-[#FDFCF8]/95 border-b border-[#E8E2D9] px-4 md:px-8 h-16 flex justify-between items-center backdrop-blur-md">
      <div className="flex items-center gap-3.5">
        <button
          onClick={() => onNavigate('profile')}
          className="p-1.5 hover:bg-[#F5F2ED] rounded-full text-[#5A5A40] transition-colors cursor-pointer"
          title="Menu Profile"
        >
          <Menu className="w-5 h-5 text-[#5A5A40]" />
        </button>
        
        {/* Visual typographic Pairing serif and sans */}
        <div className="flex items-center gap-2">
          <h1
            onClick={() => onNavigate('dashboard')}
            className="font-serif font-black tracking-tight text-[#2D2A26] cursor-pointer select-none flex items-baseline gap-1.5"
          >
            <span className="text-2xl">StudyFlow</span>
            <span className="font-sans text-xs font-normal tracking-wide text-[#9A9184] whitespace-nowrap hidden sm:inline">mistake journal</span>
          </h1>
          {isPremium && (
            <span className="inline-flex items-center gap-0.5 px-2 py-0.5 bg-[#D4AF37]/15 text-[#B8901C] border border-[#D4AF37]/25 text-[8.5px] font-sans font-extrabold uppercase rounded-full tracking-wider animate-fade-in shrink-0">
              ★ Lifetime
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 sm:gap-3.5">
        {/* Go Lifetime Paywall Shortcut Button */}
        {!isPremium && (
          <button
            onClick={() => onNavigate('upgrade')}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-sans text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-all cursor-pointer shadow-sm shrink-0"
            title="Unlock Lifetime Premium Plan"
          >
            ★ Go Lifetime
          </button>
        )}

        {/* Quick Add Button */}
        {onOpenQuickAdd && (
          <button
            onClick={onOpenQuickAdd}
            className="flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-[10px] sm:text-xs font-bold uppercase tracking-wider rounded-full transition-colors cursor-pointer shadow-sm shrink-0"
            title="Rapidly Log Error Entry"
          >
            <span className="text-sm font-semibold sm:mr-0.5">+</span> Quick Add
          </button>
        )}

        {/* Search Activator */}
        <button
          onClick={onActivateSearch}
          className="p-1.5 hover:bg-[#F5F2ED] rounded-full text-[#4A453E] transition-colors cursor-pointer focus:outline-none"
          title="Global Query Search"
        >
          <Search className="w-5 h-5 text-[#4A453E]" />
        </button>

        {/* User Badge matches screen avatar */}
        <div
          onClick={() => onNavigate('profile')}
          className="w-9 h-9 rounded-full overflow-hidden border border-[#E8E2D9] shadow-sm cursor-pointer hover:opacity-85 transition-opacity shrink-0"
          title={`Scholastic profile - ${userName}`}
        >
          <img
            referrerPolicy="no-referrer"
            src={userPhoto || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=256&auto=format&fit=crop"}
            alt="Avatar"
            className="w-full h-full object-cover"
          />
        </div>
      </div>
    </header>
  );
}
