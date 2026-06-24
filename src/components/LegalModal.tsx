/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, ShieldAlert, FileText, CheckCircle2, Lock, Scale } from 'lucide-react';

interface LegalModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: 'privacy' | 'terms';
}

export function LegalModal({ isOpen, onClose, defaultTab = 'privacy' }: LegalModalProps) {
  const [activeTab, setActiveTab] = useState<'privacy' | 'terms'>(defaultTab);

  if (!isOpen) return null;

  return (
    <div 
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-md animate-fade-in font-sans"
    >
      <div 
        id="legal-modal-container"
        className="bg-[#FDFCF8] border border-[#E8E2D9] w-full max-w-2xl rounded-3xl shadow-xl flex flex-col max-h-[75vh] sm:max-h-[80vh] animate-scale-up overflow-hidden"
      >
        {/* Modal Header */}
        <div className="px-5 py-3.5 border-b border-[#E8E2D9] flex justify-between items-center bg-[#FAF8F5]">
          <div className="flex items-center gap-2">
            <Scale className="w-5 h-5 text-[#5A5A40]" />
            <h3 className="font-serif text-base font-bold text-[#2D2A26] tracking-tight">
              StudyFlow Legal Center
            </h3>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-stone-200/60 text-stone-500 hover:text-stone-800 transition-colors cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-4.5 h-4.5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="grid grid-cols-2 border-b border-[#E8E2D9] bg-stone-50/50">
          <button
            onClick={() => setActiveTab('privacy')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'privacy' 
                ? 'border-[#5A5A40] text-[#2D2A26] bg-[#FDFCF8]' 
                : 'border-transparent text-[#9A9184] hover:text-[#2D2A26]'
            }`}
          >
            <Lock className="w-3.5 h-3.5" /> Privacy Policy
          </button>
          <button
            onClick={() => setActiveTab('terms')}
            className={`py-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
              activeTab === 'terms' 
                ? 'border-[#5A5A40] text-[#2D2A26] bg-[#FDFCF8]' 
                : 'border-transparent text-[#9A9184] hover:text-[#2D2A26]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Terms & Conditions
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6 text-left text-xs text-[#6B6357] leading-relaxed font-sans">
          
          {activeTab === 'privacy' ? (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A9184]">Last Updated: June 24, 2026</span>
                <h4 className="font-serif text-xl font-bold text-[#2D2A26]">Privacy Policy</h4>
                <p className="text-stone-600">
                  Your privacy is paramount. This policy outlines how StudyFlow ("we", "our") handles, secures, and structures your personal information.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 1. Information We Collect
                </h5>
                <ul className="list-disc pl-5 space-y-2">
                  <li>
                    <strong>Authentication Data:</strong> When signing in with Google Authentication, we securely retrieve your email address, full name, and profile photograph URL to bind your student account securely to your cloud-sync logs.
                  </li>
                  <li>
                    <strong>Student Logs & Study Data:</strong> We store all student-authored logs, subjects, topics, subtopics, and mistake reflections in our cloud database to provide real-time dashboards and study reminders.
                  </li>
                  <li>
                    <strong>Payment Processing Logs:</strong> All transactions are executed through Stripe. StudyFlow does not collect, receive, or store raw credit card details, CVVs, or cardholder credentials.
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 2. How Your Data is Used
                </h5>
                <p>
                  We utilize saved account metadata solely to synchronize your study materials across browsers, enforce subscription quotas (1,000 standard daily database limit vs 100,000+ premium), and prevent spam or abuse on our Google Firebase infrastructure. We will never sell, lease, or license your account identity details to advertising agencies.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 3. Data Autonomous Ownership & Erasure
                </h5>
                <p>
                  You retain complete, unrestricted ownership over your academic record logs. You can delete individual entry files or wipe your entire cloud account instantly inside your settings panel. This initiates a real-time cascade deleting all nested collections from our database servers permanently.
                </p>
              </div>

              <div className="bg-[#FAF8F5] border border-[#E8E2D9] p-4 rounded-xl flex items-start gap-3">
                <ShieldAlert className="w-5 h-5 text-[#5A5A40] shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-[9px] uppercase tracking-wider text-[#5A5A40]">COPPA & GDPR Notice</span>
                  <p className="text-[11px] leading-relaxed text-stone-600">
                    StudyFlow does not intentionally collect information from students under 13. If you are a parent or guardian who believes your child has logged details, contact support to trigger immediate erasure.
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-5 animate-fade-in">
              <div className="space-y-1">
                <span className="text-[10px] uppercase font-mono tracking-wider text-[#9A9184]">Last Updated: June 24, 2026</span>
                <h4 className="font-serif text-xl font-bold text-[#2D2A26]">Terms & Conditions</h4>
                <p className="text-stone-600">
                  By accessing and utilizing the StudyFlow applet, you agree to comply with the terms, limitations, and operational codes specified below.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 1. Terms of Access & Use Quotas
                </h5>
                <p>
                  Users must log in with their personal, verified Google accounts. Any automated script testing, scrape attacks, or abuse of database operations is strictly prohibited. Free-tier accounts are restricted to standard daily study quotas. Lifetime upgrade tiers unlock higher request thresholds exclusively for human-scale scholastic research.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 2. One-Time Lifetime Supporter Program
                </h5>
                <p>
                  The early supporter Lifetime Purchase is billed once as a single flat payment. By paying for a Lifetime membership, you bypass any future recurring subscription tiers. This purchase is tied permanently to your Google Auth email ID. Because services incur real-time API and cloud storage operating costs, refunds are processed at our sole discretion.
                </p>
              </div>

              <div className="space-y-3">
                <h5 className="font-bold text-[#2D2A26] uppercase text-[10px] tracking-wider border-b border-stone-200 pb-1 flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#5A6F57]" /> 3. Liability & Performance Disclaimer
                </h5>
                <p>
                  StudyFlow is provided "as is" and "as available". While we maintain real-time cloud redundancy, we cannot guarantee zero service disruption or data loss due to unforeseen cloud node breakdowns. We recommend exporting critical mistake collections periodically using built-in offline controls.
                </p>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#E8E2D9] bg-[#FAF8F5] text-center flex justify-between items-center shrink-0">
          <span className="text-[10px] text-stone-400 font-mono hidden sm:inline">
            Securely bound via Google Firebase Auth & Stripe
          </span>
          <span className="text-[9px] text-stone-450 font-mono sm:hidden">
            Firebase Auth & Stripe Secure
          </span>
          <button
            onClick={onClose}
            className="px-5 py-2.5 bg-[#2D2A26] hover:bg-[#4A453E] text-white text-xs font-bold uppercase tracking-wider rounded-xl cursor-pointer transition-all active:scale-98 shadow-sm hover:shadow-md"
          >
            I Accept / Understand
          </button>
        </div>
      </div>
    </div>
  );
}
