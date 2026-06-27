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
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1.5 border-b border-stone-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase font-mono tracking-wider text-[#9A9184]">
                  <span>Effective Date: June 24, 2026</span>
                  <span>Last Updated: June 24, 2026</span>
                </div>
                <h4 className="font-serif text-2xl font-bold text-[#2D2A26] tracking-tight">StudyFlow Mistake Journal Privacy Policy</h4>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-900 leading-relaxed mt-2">
                  <strong>Important:</strong> Please read this Privacy Policy carefully before using StudyFlow Mistake Journal. By creating an account or using our Service, you agree to the collection and use of information as described herein. If you do not agree, please do not use the Service.
                </div>
              </div>

              {/* 1. Introduction & Who We Are */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 1. Introduction & Who We Are
                </h5>
                <p className="text-stone-600">
                  StudyFlow Mistake Journal ("StudyFlow", "we", "our", or "us") is an educational productivity application that helps students track and learn from academic mistakes. This Privacy Policy explains how we collect, use, disclose, retain, and safeguard your personal information when you use our website, mobile application, and related services (collectively, the "Service").
                </p>
                <p className="text-stone-600">
                  This policy applies to all users globally, including users in the European Economic Area ("EEA"), United Kingdom, and other jurisdictions with applicable data protection laws. Where local law imposes additional requirements, we comply with those requirements.
                </p>
                <div className="bg-stone-50 p-3 rounded-xl border border-stone-200/60 font-mono text-[11px] space-y-1 text-stone-700">
                  <div className="font-bold text-[#2D2A26]">Contact Information:</div>
                  <div>• Email: <a href="mailto:gonarengopi@gmail.com" className="text-amber-700 underline font-semibold">gonarengopi@gmail.com</a></div>
                  <div>• Response time: We aim to respond within 30 days (or within timeframe required by applicable law)</div>
                </div>
              </div>

              {/* 2. Information We Collect */}
              <div className="space-y-3">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 2. Information We Collect
                </h5>
                <p className="text-stone-600">We collect only the information necessary to provide and improve the Service:</p>
                
                <div className="space-y-2 pl-2">
                  <div className="font-bold text-stone-800">2.1 Information You Provide Directly</div>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Authentication Data:</strong> When you sign in via Google OAuth, we receive your email address, display name, and profile photo URL from Google. We do not receive or store your Google account password.</li>
                    <li><strong>Study Content:</strong> Mistake logs, subjects, topics, subtopics, reflections, uploaded images, diagrams, problem screenshots, and any other content you create within the Service ("User Content").</li>
                    <li><strong>Communications:</strong> If you contact our support team, we retain records of that correspondence.</li>
                    <li><strong>Payment Information:</strong> Subscription payments are processed exclusively by Stripe, Inc. We do not collect, process, store, or have access to your credit card number, CVV, or full banking details. We receive only a Stripe customer ID and transaction confirmation for record-keeping purposes.</li>
                  </ul>

                  <div className="font-bold text-stone-800 pt-2">2.2 Information Collected Automatically</div>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li><strong>Usage Data:</strong> Pages visited, features used, session duration, button clicks, and error logs collected to diagnose issues and improve the Service.</li>
                    <li><strong>Device & Technical Data:</strong> Browser type, operating system, IP address, time zone, and device identifiers.</li>
                    <li><strong>Cookies & Similar Technologies:</strong> We use session cookies (required for authentication), preference cookies (to save your settings), and analytics cookies. See Section 9 for full details.</li>
                  </ul>

                  <div className="font-bold text-stone-800 pt-2">2.3 Information We Do Not Collect</div>
                  <ul className="list-disc pl-5 space-y-1.5 text-stone-600">
                    <li>We do not collect sensitive personal data such as racial or ethnic origin, health data, biometric data, or financial account credentials.</li>
                    <li>We do not knowingly collect personal information from children under 13 (or under 16 in the EEA). See Section 12 for our full children's privacy policy.</li>
                  </ul>
                </div>
              </div>

              {/* 3. Legal Basis for Processing */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 3. Legal Basis for Processing (EEA/UK Users)
                </h5>
                <p className="text-stone-600">If you are located in the EEA or UK, we process your personal data under the following lawful bases under GDPR and UK GDPR:</p>
                <div className="grid grid-cols-1 gap-2 bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px]">
                  <div>• <strong>Account creation & authentication:</strong> Contract (Art. 6(1)(b)) - Necessary to provide Service</div>
                  <div>• <strong>Storing study logs:</strong> Contract (Art. 6(1)(b)) - Core feature of Service</div>
                  <div>• <strong>Service notifications:</strong> Legitimate Interest (Art. 6(1)(f)) - Keeping you informed</div>
                  <div>• <strong>Analytics & improvement:</strong> Legitimate Interest (Art. 6(1)(f)) - Product quality & security</div>
                  <div>• <strong>Marketing communications:</strong> Consent (Art. 6(1)(a)) - Only with explicit opt-in</div>
                  <div>• <strong>Legal compliance:</strong> Legal Obligation (Art. 6(1)(c)) - Tax records, fraud prevention</div>
                </div>
              </div>

              {/* 4. How We Use Your Information */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 4. How We Use Your Information
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li>To create and maintain your account and authenticate your identity</li>
                  <li>To store and synchronise your study logs across devices and browsers</li>
                  <li>To enforce account tier caps (Free Scholar tier: max 5 mistake journals lifetime; Premium/Lifetime tiers: unlimited logging, subject to daily database quotas)</li>
                  <li>To send transactional emails (account confirmations, password resets, receipts)</li>
                  <li>To send study reminders and in-app notifications (opt-out anytime in Settings)</li>
                  <li>To detect and prevent fraud, abuse, spam, and security incidents</li>
                  <li>To comply with applicable legal obligations and improve Service personalization</li>
                </ul>
                <div className="bg-stone-100 p-3 rounded-lg font-medium text-stone-800 text-[11px]">
                  <strong>We will never:</strong> Sell, rent, lease, or license your personal data or User Content to third parties for advertising or marketing purposes. We do not engage in behavioural advertising.
                </div>
              </div>

              {/* 5. Data Sharing & Third-Party Services */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 5. Data Sharing & Third-Party Services
                </h5>
                <p className="text-stone-600">We share data only with trusted infrastructure providers:</p>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Google Firebase:</strong> Database, authentication, hosting, cloud functions</li>
                  <li><strong>Stripe, Inc.:</strong> Payment processing and subscription management</li>
                  <li><strong>Google Analytics:</strong> (Optional) Aggregated usage analytics</li>
                </ul>
              </div>

              {/* 6. Data Retention */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 6. Data Retention & Backups
                </h5>
                <p className="text-stone-600">We retain personal data only as long as necessary. Account data is retained for account duration + 30 days after deletion. Study logs are purged within 30 days of account deletion requests. Payment/tax billing records are kept for 7 years as required by law.</p>
                <p className="text-[11px] text-stone-500 italic">Note on Backups: Firebase infrastructure may retain encrypted backup snapshots for up to 30 days after deletion is initiated.</p>
              </div>

              {/* 7 & 8. Security & User Rights */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 7 & 8. Data Security & Your Rights
                </h5>
                <p className="text-stone-600">We use TLS 1.2+ encryption in transit and encryption at rest for all Firestore records. Depending on your jurisdiction, you have the right to access, rectify, erase, restrict, port, or object to processing of your personal data. Contact <a href="mailto:gonarengopi@gmail.com" className="underline font-semibold">gonarengopi@gmail.com</a> for any data subject requests.</p>
              </div>

              {/* 9 - 18. Cookies, Billing, Children's Privacy, Terms */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 9–18. Cookies, Subscriptions, Children's Privacy & Acceptable Use
                </h5>
                <p className="text-stone-600">
                  Strictly necessary session cookies are used for secure authentication. Guest Mode stores draft entries exclusively in local browser storage without server transmission. StudyFlow is intended for students aged 13+. Early Partner Lifetime Plans ($20 flat) unlock unlimited mistake journals permanently without recurring charges.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-6 animate-fade-in">
              <div className="space-y-1.5 border-b border-stone-200 pb-4">
                <div className="flex flex-wrap items-center justify-between gap-2 text-[10px] uppercase font-mono tracking-wider text-[#9A9184]">
                  <span>Effective Date: June 24, 2026</span>
                  <span>Last Updated: June 24, 2026</span>
                </div>
                <h4 className="font-serif text-2xl font-bold text-[#2D2A26] tracking-tight">StudyFlow Mistake Journal Terms & Conditions</h4>
                <div className="bg-amber-500/10 border border-amber-500/30 p-3.5 rounded-xl text-amber-900 leading-relaxed mt-2">
                  <strong>Please read carefully:</strong> These Terms & Conditions ("Terms") constitute a legally binding agreement between you and StudyFlow Mistake Journal. By creating an account, accessing, or using the Service in any way, you confirm that you have read, understood, and agree to be bound by these Terms. If you do not agree, do not use the Service.
                </div>
              </div>

              {/* 1. Parties, Definitions & Scope */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 1. Parties, Definitions & Scope
                </h5>
                <p className="text-stone-600">These Terms are entered into between <strong>StudyFlow</strong> (operator of the StudyFlow Mistake Journal application, based in New Zealand) and <strong>You</strong> (any individual who accesses or uses the Service as a registered account holder, Free Scholar, Lifetime Plan holder, or Guest).</p>
                <div className="grid grid-cols-1 gap-1.5 bg-stone-50 p-3 rounded-xl border border-stone-200 text-[11px] text-stone-700">
                  <div>• <strong>"Service":</strong> The StudyFlow Mistake Journal web application, associated APIs, features, and content.</div>
                  <div>• <strong>"User Content":</strong> Any data, mistake logs, reflections, screenshots, or images submitted through the Service.</div>
                  <div>• <strong>"Free Scholar Tier":</strong> The no-cost account tier with a hard lifetime cap of 5 mistake journals.</div>
                  <div>• <strong>"Lifetime Plan":</strong> The Early Partner $20 NZD one-time flat-fee purchase granting permanent Premium access.</div>
                  <div>• <strong>"Guest Mode":</strong> Unauthenticated access to a limited demo environment using browser localStorage only.</div>
                </div>
              </div>

              {/* 2 & 3. Eligibility, Registration & Service Description */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 2 & 3. Eligibility, Registration & Service Description
                </h5>
                <p className="text-stone-600">
                  The Service is intended for students aged 13 and older. Users aged 13–18 confirm they have parental or guardian consent. When registering via Google OAuth, you agree to maintain accurate credentials and register only <strong>one account per individual</strong>. StudyFlow provides academic mistake logging, custom reflections, image attachments, cloud sync (Firebase), and dashboard analytics.
                </p>
              </div>

              {/* 4 & 5. Plans, Purchases, Billing & Refunds */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 4 & 5. Plans, Billing & Refund Policy
                </h5>
                <ul className="list-disc pl-5 space-y-1 text-stone-600">
                  <li><strong>Free Scholar:</strong> Capped at 5 lifetime mistake entries. No payment credentials required.</li>
                  <li><strong>Early Partner Lifetime Plan ($20 NZD):</strong> One-time, non-recurring payment processed via Stripe. Unlocks unlimited mistake logging permanently. You pay once and are never billed again.</li>
                  <li><strong>14-Day Refund Guarantee:</strong> If dissatisfied with a Lifetime Plan or new subscription payment, request a full refund within 14 days by emailing <a href="mailto:gonarengopi@gmail.com" className="text-amber-700 underline font-semibold">gonarengopi@gmail.com</a> with subject line "Refund Request".</li>
                  <li><strong>Discontinuation Protection:</strong> If StudyFlow permanently discontinues the Service, Lifetime holders receive at least 90 days' notice and a pro-rata refund.</li>
                </ul>
              </div>

              {/* 6 & 7. User Content & Acceptable Use Policy */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 6 & 7. User Content Ownership & Acceptable Use
                </h5>
                <p className="text-stone-600">
                  <strong>You retain full 100% ownership</strong> of all User Content (mistake logs, reflections, images). You grant StudyFlow a limited licence solely to store, process, and synchronize your data. You agree NOT to upload unlawful content, probe/scan system vulnerabilities, use automated scraping bots, circumvent tier limits, or create multiple accounts to bypass the Free Scholar cap.
                </p>
              </div>

              {/* 8, 9 & 10. Suspension, Guest Mode & Data Protection */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 8–10. Termination, Guest Mode & Privacy
                </h5>
                <p className="text-stone-600">
                  You may delete your account anytime under Settings &gt; Account. StudyFlow reserves the right to terminate accounts for serious Terms violations. Guest Mode stores draft state locally on your device without server backup. Your data is encrypted and safeguarded under our unified Privacy Policy.
                </p>
              </div>

              {/* 11 - 14. Force Majeure, Third Parties, Disclaimers & Liability */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 11–14. Force Majeure, Disclaimers & Limitation of Liability
                </h5>
                <p className="text-stone-600">
                  We are not liable for service delays caused by natural disasters, cyberattacks, or third-party outages (Google Firebase, Stripe). The Service is provided <strong>"as is"</strong> without warranties of error-free operation. StudyFlow is a study tool and does not guarantee specific academic grade improvements. Where liability cannot be excluded, our aggregate cap is the amount paid in the preceding 12 months or NZD $100.
                </p>
              </div>

              {/* 15 - 19. Governing Law, Dispute Resolution & Contact Us */}
              <div className="space-y-2">
                <h5 className="font-serif font-bold text-[#2D2A26] text-sm flex items-center gap-2 border-b border-stone-200 pb-1">
                  <CheckCircle2 className="w-4 h-4 text-[#5A5A40]" /> 15–19. Governing Law, Modifications & Contact Us
                </h5>
                <p className="text-stone-600">
                  These Terms are governed by the laws of <strong>New Zealand</strong>. Material changes will be notified at least 14 days in advance. For all enquiries, refund requests, billing disputes, formal complaints, or account support, contact us at <a href="mailto:gonarengopi@gmail.com" className="text-amber-700 underline font-semibold">gonarengopi@gmail.com</a>. We aim to acknowledge enquiries within 5 business days.
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
