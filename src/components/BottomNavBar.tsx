/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layout, FolderClosed, PlusCircle, BarChart3, UserCircle } from 'lucide-react';

export type ViewTab = 'dashboard' | 'topics' | 'add' | 'insights' | 'profile';

interface BottomNavBarProps {
  currentView: ViewTab;
  onNavigate: (view: ViewTab) => void;
}

export function BottomNavBar({ currentView, onNavigate }: BottomNavBarProps) {
  const tabs = [
    { id: 'dashboard' as ViewTab, label: 'Dashboard', icon: Layout },
    { id: 'topics' as ViewTab, label: 'Topics', icon: FolderClosed },
    { id: 'add' as ViewTab, label: 'Add', icon: PlusCircle, isCenter: true },
    { id: 'insights' as ViewTab, label: 'Insights', icon: BarChart3 },
    { id: 'profile' as ViewTab, label: 'Profile', icon: UserCircle },
  ];

  return (
    <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-4 pt-2 bg-white/95 backdrop-blur-md shadow-lg rounded-t-2xl border-t border-[#E8E2D9] max-w-7xl mx-auto left-1/2 -translate-x-1/2">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = currentView === tab.id;

        // Custom styling for center add button matches mockup pictures direct
        if (tab.isCenter) {
          return (
            <button
              key={tab.id}
              onClick={() => onNavigate(tab.id)}
              className="flex flex-col items-center justify-center text-[#2D2A26] hover:text-[#5A5A40] transition-colors focus:outline-none cursor-pointer"
              title="Log New Mistake Entry"
            >
              <Icon className="w-10 h-10 stroke-[1.5] text-[#D98A6C] hover:text-[#C17A5E] hover:scale-105 active:scale-95 transition-transform" />
              <span className="font-sans text-[10px] font-bold text-[#9A9184] mt-0.5">Add</span>
            </button>
          );
        }

        return (
          <button
            key={tab.id}
            onClick={() => onNavigate(tab.id)}
            className={`flex flex-col items-center justify-center py-1.5 px-3.5 transition-all text-xs font-sans rounded-xl focus:outline-none cursor-pointer ${isActive ? 'text-[#2D2A26] font-semibold bg-[#E8E2D9] scale-95' : 'text-[#9A9184] hover:text-[#2D2A26] font-medium'}`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
            <span className="text-[10px] mt-1">{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
