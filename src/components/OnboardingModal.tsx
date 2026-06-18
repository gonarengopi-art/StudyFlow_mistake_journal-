/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  BookOpen, 
  PlusCircle, 
  GraduationCap, 
  HelpCircle, 
  CheckCircle, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Check, 
  Award, 
  Activity, 
  ChevronRight,
  TrendingUp,
  BrainCircuit,
  Eye,
  FileSpreadsheet
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  addSubject: (name: string) => Promise<string>;
  addTopic: (subjectId: string, name: string) => Promise<string>;
}

export function OnboardingModal({
  isOpen,
  onClose,
  userName,
  setUserName,
  addSubject,
  addTopic,
}: OnboardingModalProps) {
  const [currentStep, setCurrentStep] = useState(0);

  // Form states for actual micro-trials during onboarding
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [topicNameInput, setTopicNameInput] = useState('');
  const [hasCreatedTrial, setHasCreatedTrial] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Showcase state for flashcard interactive demo on Step 4
  const [demoRecallAnswerSolved, setDemoRecallAnswerSolved] = useState(false);
  const [demoRecallText, setDemoRecallText] = useState('');
  const [demoStatusSelected, setDemoStatusSelected] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalSteps = 6;

  // Handle bootstrap creation of actual subjects & topics straight from tutorial
  const handleCreateTrial = async () => {
    if (!subjectNameInput.trim()) return;
    setIsCreating(true);
    try {
      const newSubId = await addSubject(subjectNameInput.trim());
      if (topicNameInput.trim()) {
        await addTopic(newSubId, topicNameInput.trim());
      }
      setHasCreatedTrial(true);
    } catch (e) {
      console.error('Error auto-setting up first subject/topic inside onboarding', e);
    } finally {
      setIsCreating(false);
    }
  };

  const skipAndComplete = () => {
    localStorage.setItem('studyflow_onboarded', 'true');
    onClose();
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((p) => p + 1);
    } else {
      skipAndComplete();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((p) => p - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[120] bg-[#1a1918]/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div 
        id="onboarding-guide-container"
        className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col justify-between animate-scale-up"
      >
        {/* Top bar with Progress indicators */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 mb-5">
          <div className="flex items-center gap-2">
            <span className="p-1 px-1.5 bg-[#5A5A40]/10 rounded-lg text-[#5A5A40]">
              <Sparkles className="w-4 h-4" />
            </span>
            <span className="font-sans text-xs font-bold text-[#6B6357] uppercase tracking-widest">
              StudyFlow Quick Tour ({currentStep + 1} of {totalSteps})
            </span>
          </div>

          <button
            onClick={skipAndComplete}
            title="Skip Onboarding Tour"
            className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dynamic Pages contents */}
        <div className="flex-1 my-2 min-h-[300px]">
          
          {/* STEP 0: Welcome slide */}
          {currentStep === 0 && (
            <div className="space-y-4 animate-fade-in text-center md:text-left">
              <span className="text-[10px] font-bold tracking-widest text-[#D98A6C] uppercase bg-[#D98A6C]/10 px-2 py-1 rounded-md inline-block">
                Welcome to your Scholar Hub
              </span>
              <h3 className="font-serif text-3xl md:text-4xl font-semibold text-[#2D2A26] leading-tight">
                Master your mistakes, step by step.
              </h3>
              <p className="font-sans text-sm text-[#6B6357] leading-relaxed">
                In scholarly prep, <strong>errors are data</strong>, not defeats. Traditional notes store raw facts, but a 
                <strong> Mistake Journal</strong> maps the mental traps you fall into, helping you actively cure weak links. Our workflow revolves around 
                <em> Organization, Active Recall, and Reflection.</em>
              </p>

              <div className="bg-[#F5F2ED] p-4.5 rounded-2xl border border-[#E8E2D9] space-y-3 max-w-lg mx-auto md:mx-0">
                <label className="block text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider">
                  Let's personalize your dashboard greeting:
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={userName}
                    onChange={(e) => setUserName(e.target.value)}
                    placeholder="Enter your name... (e.g. Julian)"
                    className="flex-1 bg-[#FDFCF8] border border-[#E8E2D9] rounded-xl px-3 py-2 text-xs text-[#2D2A26] outline-none focus:border-[#5A5A40] font-sans font-semibold"
                  />
                  <div className="bg-[#8DA38A] text-white px-3 py-1.5 rounded-xl text-xs flex items-center justify-center font-bold">
                    ✓ Matches Greeting
                  </div>
                </div>
                <p className="text-[10px] text-[#9A9184] italic">
                  *Your name is saved locally and synced directly under your active study credential.
                </p>
              </div>
            </div>
          )}

          {/* STEP 1: Creating a Subject */}
          {currentStep === 1 && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold tracking-wider text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2.5 py-1 rounded-md text-left">
                  Modular Domain Organization
                </span>
              </div>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26]">
                Step 1: Set Up Course Subjects
              </h3>
              <p className="font-sans text-xs text-[#6B6357] leading-relaxed">
                Subjects are high-level academic classes (like <em>Organic Chemistry</em>, <em>Quantitative Physics</em>, or <em>Clinical Medicine</em>). Keeping subjects categorized prevents your brain from feeling overwhelmed by cross-disciplinary syllabus files.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
                <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9] space-y-2.5">
                  <span className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">
                    Interactive Workspace Tool:
                  </span>
                  <div className="text-xs text-[#2D2A26] leading-relaxed">
                    You can manage curriculum headers in the <strong className="text-[#2D2A26]">Subjects & Units</strong> view tab, but you can also bootstrap your first real subject right here!
                  </div>

                  {hasCreatedTrial ? (
                    <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-lg text-xs flex items-center gap-2 text-[#4D5D4B] font-bold">
                      <Check className="w-4 h-4 stroke-[3px]" /> 
                      <span>Added "{subjectNameInput}" into your actual list!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={subjectNameInput}
                        onChange={(e) => setSubjectNameInput(e.target.value)}
                        placeholder="e.g. Molecular Biology"
                        className="w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2D2A26] outline-none font-semibold"
                        disabled={isCreating}
                      />
                      <button
                        onClick={handleCreateTrial}
                        disabled={!subjectNameInput.trim() || isCreating}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center gap-1 bg-[#5A5A40] hover:bg-[#4D4D36] ${!subjectNameInput.trim() ? "opacity-45 cursor-not-allowed bg-stone-300 text-stone-500" : ""}`}
                      >
                        {isCreating ? 'Pre-registering...' : 'Add This Real Subject'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col justify-center space-y-3">
                  <div className="text-xs font-bold text-[#2D2A26] uppercase font-sans flex items-center gap-1 border-b border-[#F5F2ED] pb-1.5">
                    <BookOpen className="w-4 h-4 text-[#D98A6C]" />
                    Mock Subject Shelf View:
                  </div>
                  <div className="space-y-2">
                    <div className="p-2 bg-[#F5F2ED]/50 border border-[#E8E2D9] rounded-lg text-xs font-semibold flex justify-between items-center text-[#2D2A26]">
                      <span>🧬 Molecular Biology</span>
                      <span className="text-[9px] bg-[#5A5A40]/10 text-[#5A5A40] px-1.5 py-0.5 rounded">0 Active Logs</span>
                    </div>
                    <div className="p-2 bg-[#F5F2ED]/25 border border-dashed border-[#E8E2D9] rounded-lg text-xs italic text-stone-400">
                      + Add other subjects (e.g. Physics) Later
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Creating Topics */}
          {currentStep === 2 && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-[10px] font-bold tracking-wider text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2.5 py-1 rounded-md">
                Nested Unit Organization
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26]">
                Step 2: Nest Specific Study Topics
              </h3>
              <p className="font-sans text-xs text-[#6B6357] leading-relaxed">
                Within a Subject, create key <strong>Topics / Units</strong> (e.g., nesting <em>"Cell Division"</em> under <em>"Biology"</em>, or <em>"Acids & Bases"</em> under <em>"General Chemistry"</em>). Narrowing down the precise topic makes reviewing specific study targets extremely easy.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9] space-y-2.5">
                  <span className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">
                    Interactive Unit Creator:
                  </span>
                  
                  {hasCreatedTrial && topicNameInput ? (
                    <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-lg text-xs flex items-center gap-2 text-[#4D5D4B] font-bold">
                      <Check className="w-4 h-4 stroke-[3px]" /> 
                      <span>Nested "{topicNameInput}" under "{subjectNameInput || 'Biology'}"!</span>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      <div className="text-[10px] text-[#6B6357] italic">
                        *Will nest inside subject: <strong className="text-[#2D2A26]">{subjectNameInput || '(Choose Step 1 Subject)'}</strong>
                      </div>
                      <input
                        type="text"
                        value={topicNameInput}
                        onChange={(e) => setTopicNameInput(e.target.value)}
                        placeholder="e.g. Meiosis Mechanism"
                        className="w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2D2A26] outline-none font-semibold placeholder-stone-400"
                        disabled={isCreating || !subjectNameInput.trim()}
                      />
                      <button
                        onClick={handleCreateTrial}
                        disabled={!topicNameInput.trim() || isCreating || !subjectNameInput.trim()}
                        className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center gap-1 bg-[#5A5A40] hover:bg-[#4D4D36] ${(!topicNameInput.trim() || !subjectNameInput.trim()) ? "opacity-45 cursor-not-allowed bg-stone-300 text-stone-500" : ""}`}
                      >
                        {isCreating ? 'Nesting unit...' : 'Add This Real Unit Topic'}
                      </button>
                    </div>
                  )}
                </div>

                <div className="bg-white border border-[#E8E2D9] rounded-xl p-4 flex flex-col justify-center space-y-2.5">
                  <div className="text-[11px] font-bold text-[#2D2A26] uppercase font-sans flex items-center gap-1.5 border-b border-[#F5F2ED] pb-1.5">
                    <FileSpreadsheet className="w-4 h-4 text-[#C17A5E]" />
                    Mapped Hierarchy Model:
                  </div>
                  <div className="space-y-1.5 text-xs font-sans">
                    <div className="font-bold text-[#2D2A26] flex items-center gap-1">
                      <span>📁 {subjectNameInput || 'Molecular Biology'}</span>
                    </div>
                    <div className="pl-4 border-l border-[#E8E2D9]/80 space-y-1">
                      <div className="p-1 px-2 bg-[#F5F2ED] rounded-lg text-[11px] font-semibold text-[#6B6357] flex items-center justify-between">
                        <span>▫ {topicNameInput || 'Meiosis Mechanism'}</span>
                        <span className="text-[9px] bg-[#8DA38A] text-white px-1 rounded-full text-[8.5px]">Active Topic</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Logging a Mistake */}
          {currentStep === 3 && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-[10px] font-bold tracking-wider text-[#C17A5E] uppercase bg-[#C17A5E]/10 px-2.5 py-1 rounded-md">
                Active Mistake Ledger Input
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26]">
                Step 3: Log a Mistake with Reflection
              </h3>
              <p className="font-sans text-xs text-[#6B6357] leading-relaxed">
                When you record an error (using the quick modal or detailed view), we ask for specific inputs to boost metacognition. These inputs replace basic copying to trigger deep understanding.
              </p>

              <div className="bg-[#F5F2ED]/30 p-4 rounded-xl border border-[#E8E2D9] space-y-3 font-sans text-xs">
                <span className="block text-[10px] font-bold text-[#2D2A26] uppercase">Core Onboarding Practice Template:</span>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-[#E8E2D9] text-[11px]">
                    <span className="block font-bold text-[#5A5A40] uppercase text-[9px] mb-1">1. The Original Question</span>
                    <p className="italic text-stone-500">"What is the chromosome count in human somatic cells after replication?"</p>
                  </div>
                  <div className="bg-white p-3 rounded-lg border border-[#E8E2D9] text-[11px]">
                    <span className="block font-bold text-red-600 uppercase text-[9px] mb-1">2. My Incorrect Attempt</span>
                    <p className="font-mono text-red-700">"92 chromosomes (I doubled because of replication)"</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="bg-white p-3 rounded-lg border border-[#8DA38A]/40 text-[11px]">
                    <span className="block font-bold text-[#4D5D4B] uppercase text-[9px] mb-1">3. Correct Solution Outcome</span>
                    <p className="font-mono text-emerald-800">"46 chromosomes, 92 chromatids"</p>
                  </div>
                  <div className="bg-amber-50/50 p-3 rounded-lg border border-[#E8E2D9] text-[11px]">
                    <span className="block font-bold text-[#C17A5E] uppercase text-[9px] mb-1">4. Metacognitive Reflection</span>
                    <p className="text-[#6B6357] line-clamp-2 italic">"I confused sister chromatid bundles with individual chromosome counts. Replication doubles DNA, but not ploidy size."</p>
                  </div>
                </div>
              </div>
              <p className="text-[10px] text-[#6B6357] italic text-center">
                *The key is to always write a brief, honest <strong>Reflection</strong> about the gap in logic or memory so next time you identify the pattern instantly.
              </p>
            </div>
          )}

          {/* STEP 4: Active Recall Review Method */}
          {currentStep === 4 && (
            <div className="space-y-4 animate-fade-in">
              <span className="text-[10px] font-bold tracking-wider text-[#5C578A] uppercase bg-[#5C578A]/10 px-2.5 py-1 rounded-md">
                Recall Practice Simulator
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26]">
                Step 4: Practice Active Recall Review
              </h3>
              <p className="font-sans text-xs text-[#6B6357] leading-relaxed">
                Clicking <strong className="text-[#2D2A26]">"Practice Revision"</strong> on your dashboard triggers our specialized active recall flashcard session. Try out this interactive simulator card below!
              </p>

              {/* Recall Practice Sandbox Demo Card */}
              <div className="bg-[#FAF8F5] border-2 border-[#E8E2D9] rounded-2xl p-4.5 space-y-3.5 shadow-sm max-w-xl mx-auto">
                <div className="flex justify-between items-center bg-[#F5F2ED] p-1.5 px-3 rounded-xl border border-[#E8E2D9] text-[10px] font-bold text-[#5A5A40]">
                  <span>🧬 biology • Meiosis Mechanism</span>
                  <span className="bg-[#C17A5E] text-white px-1.5 py-0.5 rounded">Active Deck Trial</span>
                </div>

                <div className="space-y-1">
                  <span className="block text-[9px] font-bold text-[#9A9184] uppercase">Active Recall Prompt Check:</span>
                  <p className="font-serif text-sm font-semibold italic text-[#2D2A26]">
                    "How are sister chromatids held together before anaphase?"
                  </p>
                </div>

                {/* Simulated Scratchpad */}
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-[#5A5A40] uppercase block">
                    Whiteboard practice scratchpad (Try typing below!)
                  </label>
                  <input
                    type="text"
                    value={demoRecallText}
                    onChange={(e) => setDemoRecallText(e.target.value)}
                    placeholder="Write your temporary calculated response or formulas here..."
                    className="w-full bg-white border border-[#E8E2D9] rounded-xl p-2 text-xs text-[#2D2A26] outline-none font-sans"
                  />
                </div>

                {demoRecallAnswerSolved ? (
                  <div className="space-y-3.5 pt-2 border-t border-[#E8E2D9] animate-slide-down">
                    <div className="bg-[#8DA38A]/10 p-2.5 rounded-xl border border-[#8DA38A]/30 text-xs text-[#2D2A26]">
                      <span className="block font-bold text-emerald-800 uppercase text-[9px] mb-0.5">Correct Solution:</span>
                      <p className="font-sans font-semibold">Held together tightly by the protein complex cohesin.</p>
                    </div>

                    <div className="bg-[#EAEAF2] p-2.5 rounded-xl border border-[#E8E2D9] text-xs text-[#2D2A26]">
                      <span className="block font-bold text-[#5e5c75] uppercase text-[9px] mb-0.5">My Self-Reflection:</span>
                      <p className="font-sans italic">"I constantly swap cohesin with kinetochore fibers. Remember cohesin is the glue!"</p>
                    </div>

                    {/* Choose dynamic outcome simulator */}
                    <div className="space-y-1.5">
                      <span className="block text-[9px] font-bold text-[#9A9184] uppercase">Choose practice feedback action:</span>
                      <div className="grid grid-cols-3 gap-2">
                        <button 
                          onClick={() => setDemoStatusSelected('Still Practicing')}
                          className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${demoStatusSelected === 'Still Practicing' ? 'bg-[#C17A5E]/10 border-[#C17A5E] text-[#C17A5E]' : 'bg-white border-[#E8E2D9] text-stone-600'}`}
                        >
                          Still studying
                        </button>
                        <button 
                          onClick={() => setDemoStatusSelected('Reviewing')}
                          className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${demoStatusSelected === 'Reviewing' ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-white border-[#E8E2D9] text-stone-600'}`}
                        >
                          Almost got it
                        </button>
                        <button 
                          onClick={() => setDemoStatusSelected('Mastered')}
                          className={`p-1.5 rounded-xl text-[10px] font-bold border transition-all cursor-pointer ${demoStatusSelected === 'Mastered' ? 'bg-[#8DA38A] border-[#8DA38A] text-white' : 'bg-white border-[#E8E2D9] text-stone-600'}`}
                        >
                          ✓ Mastered
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setDemoRecallAnswerSolved(true)}
                    className="w-full py-2 bg-[#5A5A40] hover:bg-[#4D4D36] text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Eye className="w-4 h-4 text-[#D98A6C]" />
                    Reveal Correct Answer & My Review Reflections
                  </button>
                )}
              </div>
            </div>
          )}

          {/* STEP 5: Study Streaks & Category Analytics */}
          {currentStep === 5 && (
            <div className="space-y-4 animate-fade-in text-center">
              <div className="w-16 h-16 rounded-full bg-[#8DA38A]/10 border border-[#8DA38A] flex items-center justify-center mx-auto text-[#8DA38A] mb-3">
                <Award className="w-10 h-10 animate-pulse" />
              </div>

              <h2 className="font-serif text-3xl font-semibold text-[#2D2A26] leading-snug">
                You're ready to master your curriculum!
              </h2>
              
              <p className="font-sans text-sm text-[#6B6357] max-w-xl mx-auto leading-relaxed">
                Awesome! You now understand the core pillars of StudyFlow. By tracking and actively reviewing your mistakes:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 max-w-lg mx-auto text-left py-2 font-sans text-xs">
                <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="font-bold text-[#2D2A26] block">🔥 Track Study Streaks</span>
                  <p className="text-stone-500 text-[11px]">Log mistakes regularly to maintain your daily reflection streak indicators.</p>
                </div>
                <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="font-bold text-[#2D2A26] block">📊 Trap Category Analytics</span>
                  <p className="text-stone-500 text-[11px]">Map error tags to check if you are failing biological memory or calculation steps.</p>
                </div>
                <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-1">
                  <span className="font-bold text-[#2D2A26] block">☁ Complete Cloud Sync</span>
                  <p className="text-stone-500 text-[11px]">Link Google Account in guest mode anytime to preserve logs securely into cloud database node.</p>
                </div>
              </div>

              <p className="text-xs text-[#9A9184] font-medium pt-1 max-w-xs mx-auto">
                "An elegant ledger of corrected understandings turns simple mistakes into premium wisdom."
              </p>
            </div>
          )}

        </div>

        {/* Navigation bottom bar */}
        <div className="border-t border-[#E8E2D9] pt-4 mt-6 flex justify-between items-center font-sans text-xs font-bold">
          <button
            onClick={handleBack}
            disabled={currentStep === 0}
            className={`px-4 py-2 hover:bg-stone-100 rounded-full flex items-center gap-1 transition-colors select-none ${currentStep === 0 ? 'opacity-30 cursor-not-allowed text-stone-300' : 'text-[#6B6357] cursor-pointer'}`}
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Prev Step</span>
          </button>

          {/* Dots Indicator */}
          <div className="flex gap-1.5">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <span 
                key={i} 
                onClick={() => setCurrentStep(i)}
                className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${currentStep === i ? 'bg-[#D98A6C] scale-125' : 'bg-[#E8E2D9] hover:bg-[#6B6357]/35'}`}
              />
            ))}
          </div>

          <button
            onClick={handleNext}
            className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4D4D36] text-white rounded-full flex items-center gap-1 transition-all select-none cursor-pointer"
          >
            <span>{currentStep === totalSteps - 1 ? 'Start Journaling' : 'Next Step'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
