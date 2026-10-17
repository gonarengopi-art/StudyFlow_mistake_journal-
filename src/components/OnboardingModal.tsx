/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
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
  FileSpreadsheet,
  Compass,
  Play,
  RotateCcw,
  MousePointerClick
} from 'lucide-react';
import { safeSetItem } from '../utils/storage';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  userName: string;
  setUserName: (name: string) => void;
  addSubject: (name: string) => Promise<string>;
  addTopic: (subjectId: string, name: string) => Promise<string>;
  currentView: any;
  onNavigate: (view: any) => void;
  subjects: any[];
  topics: any[];
  mistakes: any[];
  isReviewOpen: boolean;
}

/**
 * High-fidelity Spotlight Overlay component.
 * Dynamically tracks coordinates of target DOM elements and renders a pulsing neon ring.
 */
function SpotlightOverlay({ selector }: { selector: string | null }) {
  const [coords, setCoords] = useState<{ top: number; left: number; width: number; height: number } | null>(null);

  useEffect(() => {
    if (!selector) {
      setCoords(null);
      return;
    }

    const updateCoords = () => {
      const el = document.querySelector(selector);
      if (el) {
        const rect = el.getBoundingClientRect();
        // Calculate coordinate absolute to page
        setCoords({
          top: rect.top + window.scrollY,
          left: rect.left + window.scrollX,
          width: rect.width,
          height: rect.height,
        });
      } else {
        setCoords(null);
      }
    };

    updateCoords();

    // Poll frequently to react quickly to layout shifts or view transitions
    const interval = setInterval(updateCoords, 250);
    window.addEventListener('resize', updateCoords);
    window.addEventListener('scroll', updateCoords);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', updateCoords);
      window.removeEventListener('scroll', updateCoords);
    };
  }, [selector]);

  if (!coords) return null;

  return (
    <div 
      className="absolute pointer-events-none z-[200] transition-all duration-300"
      style={{
        top: coords.top - 8,
        left: coords.left - 8,
        width: coords.width + 16,
        height: coords.height + 16,
      }}
    >
      {/* Outer pulsating ring */}
      <div className="absolute inset-0 border-4 border-[#D98A6C] rounded-2xl animate-ping opacity-45"></div>
      {/* Inner glowing box */}
      <div className="absolute inset-0 border-2 border-[#D98A6C] rounded-xl shadow-[0_0_18px_rgba(217,138,108,0.9)] animate-pulse"></div>
    </div>
  );
}

export function OnboardingModal({
  isOpen,
  onClose,
  userName,
  setUserName,
  addSubject,
  addTopic,
  currentView,
  onNavigate,
  subjects,
  topics,
  mistakes,
  isReviewOpen,
}: OnboardingModalProps) {
  // Option: 'welcome' | 'slides' | 'walkthrough'
  const [mode, setMode] = useState<'welcome' | 'slides' | 'walkthrough'>('welcome');
  const [slidesStep, setSlidesStep] = useState(0);
  const [walkthroughStep, setWalkthroughStep] = useState(1);
  const [isAutoCreating, setIsAutoCreating] = useState(false);

  // Initial stats benchmarks when beginning the steps
  const [initialSubjectCount, setInitialSubjectCount] = useState(0);
  const [initialTopicCount, setInitialTopicCount] = useState(0);
  const [initialMistakesCount, setInitialMistakesCount] = useState(0);

  // States for Slides mode demo inputs
  const [subjectNameInput, setSubjectNameInput] = useState('');
  const [topicNameInput, setTopicNameInput] = useState('');
  const [hasCreatedTrial, setHasCreatedTrial] = useState(false);
  const [isCreatingSlideTrial, setIsCreatingSlideTrial] = useState(false);
  const [demoRecallAnswerSolved, setDemoRecallAnswerSolved] = useState(false);
  const [demoRecallText, setDemoRecallText] = useState('');
  const [demoStatusSelected, setDemoStatusSelected] = useState<string | null>(null);

  // Sync initial stats when starting the live walkthrough
  const startWalkthrough = () => {
    setInitialSubjectCount(subjects.length);
    setInitialTopicCount(topics.length);
    setInitialMistakesCount(mistakes.length);
    setWalkthroughStep(1);
    setMode('walkthrough');
  };

  const skipAndComplete = () => {
    safeSetItem('studyflow_onboarded', 'true');
    onClose();
  };

  // Automated step transition logic based on real-time app interactions
  useEffect(() => {
    if (mode !== 'walkthrough') return;

    if (walkthroughStep === 1 && currentView === 'topics') {
      // Auto advance when user opens topics tab
      setTimeout(() => setWalkthroughStep(2), 600);
    }

    if (walkthroughStep === 2 && subjects.length > initialSubjectCount) {
      // Auto advance when subject added
      setTimeout(() => setWalkthroughStep(3), 800);
    }

    if (walkthroughStep === 3 && topics.length > initialTopicCount) {
      // Auto advance when topic nested
      setTimeout(() => setWalkthroughStep(4), 800);
    }

    if (walkthroughStep === 4 && currentView === 'add') {
      // Auto advance when add form opened
      setTimeout(() => setWalkthroughStep(5), 600);
    }

    if (walkthroughStep === 5 && mistakes.length > initialMistakesCount) {
      // Auto advance when mistake saved
      setTimeout(() => setWalkthroughStep(6), 800);
    }

    if (walkthroughStep === 6 && currentView === 'dashboard') {
      // Auto advance when dashboard tab re-selected
      setTimeout(() => setWalkthroughStep(7), 600);
    }

    if (walkthroughStep === 7 && isReviewOpen) {
      // Auto advance when review session starts
      setTimeout(() => setWalkthroughStep(8), 600);
    }
  }, [
    mode, 
    walkthroughStep, 
    currentView, 
    subjects.length, 
    topics.length, 
    mistakes.length, 
    isReviewOpen, 
    initialSubjectCount, 
    initialTopicCount, 
    initialMistakesCount
  ]);

  if (!isOpen) return null;

  const totalSlidesSteps = 6;

  const handleNextSlide = () => {
    if (slidesStep < totalSlidesSteps - 1) {
      setSlidesStep((p) => p + 1);
    } else {
      skipAndComplete();
    }
  };

  const handleBackSlide = () => {
    if (slidesStep > 0) {
      setSlidesStep((p) => p - 1);
    }
  };

  // Helper action to auto-perform structural operations for the user during live tour
  const handleSimulateSubject = async () => {
    setIsAutoCreating(true);
    try {
      await addSubject('Molecular Biology');
      // Set initial count so the effect doesn't get confused
      setInitialSubjectCount(subjects.length);
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoCreating(false);
    }
  };

  const handleSimulateTopic = async () => {
    setIsAutoCreating(true);
    try {
      const activeSubjectId = subjects[subjects.length - 1]?.id || subjects[0]?.id;
      if (activeSubjectId) {
        await addTopic(activeSubjectId, 'Meiosis Mechanism');
        setInitialTopicCount(topics.length);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsAutoCreating(false);
    }
  };

  // Form setup simulation for step 5
  const handleAutoFillMistakeForm = () => {
    const qField = document.getElementById('create-mistake-question') as HTMLTextAreaElement;
    const ansField = document.getElementById('create-mistake-my-answer') as HTMLInputElement;
    const correctField = document.getElementById('create-mistake-correct-answer') as HTMLInputElement;
    const refField = document.getElementById('create-mistake-reflection') as HTMLTextAreaElement;

    if (qField) qField.value = "What is the chromosome count in human somatic cells after replication?";
    if (ansField) ansField.value = "92 chromosomes (I doubled because of replication)";
    if (correctField) correctField.value = "46 chromosomes, 92 chromatids";
    if (refField) refField.value = "I confused sister chromatid bundles with individual chromosome counts. Replication doubles DNA, but not ploidy size.";

    // Trigger input events so React state in CreateMistakeView picks it up
    const event = new Event('input', { bubbles: true });
    qField?.dispatchEvent(event);
    ansField?.dispatchEvent(event);
    correctField?.dispatchEvent(event);
    refField?.dispatchEvent(event);
  };

  // Slide-based manual creation bootstrap inside modal
  const handleCreateSlideTrial = async () => {
    if (!subjectNameInput.trim()) return;
    setIsCreatingSlideTrial(true);
    try {
      const newSubId = await addSubject(subjectNameInput.trim());
      if (topicNameInput.trim()) {
        await addTopic(newSubId, topicNameInput.trim());
      }
      setHasCreatedTrial(true);
    } catch (e) {
      console.error(e);
    } finally {
      setIsCreatingSlideTrial(false);
    }
  };

  // Get active target selector for highlighting
  const getSpotlightSelector = () => {
    if (mode !== 'walkthrough') return null;
    switch (walkthroughStep) {
      case 1:
        return '#nav-tab-topics';
      case 2:
        return document.getElementById('subjects-add-input') ? '#subjects-add-input' : '#subjects-add-btn';
      case 3:
        return document.getElementById('topics-add-input') ? '#topics-add-input' : '#topics-add-btn';
      case 4:
        return '#nav-tab-add';
      case 5:
        return '#create-mistake-question';
      case 6:
        return '#nav-tab-dashboard';
      case 7:
        return '#dashboard-quick-review';
      case 8:
        return '#review-arena-scratchpad';
      default:
        return null;
    }
  };

  const activeSelector = getSpotlightSelector();

  return (
    <>
      {/* Dynamic live glowing overlay selector indicator */}
      {mode === 'walkthrough' && <SpotlightOverlay selector={activeSelector} />}

      {/* RENDER MODE A: Floating Conversational Interactive Mentor Guide */}
      {mode === 'walkthrough' && (
        <div className="fixed bottom-24 right-4 left-4 sm:left-auto sm:right-6 md:right-8 w-auto sm:w-[350px] bg-[#FDFCF8] border-2 border-[#D98A6C] rounded-3xl shadow-[0_20px_50px_rgba(217,138,108,0.25)] z-[210] p-5 select-none animate-scale-up font-sans text-stone-800 flex flex-col justify-between">
          <div className="flex items-start justify-between border-b border-[#E8E2D9] pb-3 mb-3">
            <div className="flex items-center gap-2">
              <span className="p-1 px-1.5 bg-[#D98A6C]/10 rounded-lg text-[#D98A6C]">
                <GraduationCap className="w-4 h-4 animate-bounce" />
              </span>
              <div>
                <span className="font-sans text-[10px] font-bold text-[#D98A6C] uppercase tracking-wider block">
                  Sophia • StudyFlow Guide
                </span>
                <span className="text-[9px] text-[#9A9184] uppercase font-mono font-bold">
                  Walkthrough {walkthroughStep} / 8
                </span>
              </div>
            </div>
            <button 
              onClick={skipAndComplete}
              className="text-stone-400 hover:text-black transition-colors p-1 rounded-full hover:bg-stone-100 cursor-pointer"
              title="Close tour"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3.5 flex-1 py-1 min-h-[140px] flex flex-col justify-center text-left">
            {/* STEP 1: Explaining and navigating to Topics Tab */}
            {walkthroughStep === 1 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2 py-0.5 rounded">
                  TASK 1: Curriculum Management
                </span>
                <p className="text-xs leading-relaxed">
                  Hi <strong>{userName}</strong>! Let's do a live, hands-on tour of your workspace. First, let's explore where we organize course subjects.
                </p>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-2 text-xs">
                  <div className="flex items-center gap-2 text-[#D98A6C] font-bold font-sans text-[11px]">
                    <MousePointerClick className="w-4 h-4 shrink-0 animate-pulse" />
                    <span>Click 'Topics' in the bottom bar</span>
                  </div>
                  <p className="text-[10px] text-stone-500 italic">
                    We'll automatically advance as soon as you open it.
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('topics')}
                  className="w-full text-center py-2 bg-[#5A5A40] hover:bg-[#4D4D36] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  🚀 Go to Topics For Me
                </button>
              </div>
            )}

            {/* STEP 2: Creating a Course Subject */}
            {walkthroughStep === 2 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2 py-0.5 rounded">
                  TASK 2: Register a Subject
                </span>
                <p className="text-xs leading-relaxed">
                  Perfect! You're in the curriculum manager. Let's register a Course Subject (like <em>Molecular Biology</em> or <em>Clinical Anatomy</em>).
                </p>
                
                {subjects.length > 0 ? (
                  <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-xl text-[11px] text-[#4D5D4B] font-semibold space-y-1">
                    <p className="font-bold">✓ I see you already have a Subject!</p>
                    <p className="text-[10px] text-stone-500 italic">You can proceed to nest a Topic unit, or add another one.</p>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] space-y-2 text-xs">
                    <p className="font-medium text-[11px]">
                      <strong>Instructions:</strong> Click <strong>'+ Subject'</strong>, enter a name, and hit Confirm.
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleSimulateSubject}
                    disabled={isAutoCreating}
                    className="flex-1 text-center py-2 bg-white border border-[#E8E2D9] hover:bg-[#F5F2ED] text-[#2D2A26] text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer"
                  >
                    ⚡ Auto-Create Biology
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(3)}
                    className="px-3.5 py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer"
                  >
                    Skip Task
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Nesting a Topic */}
            {walkthroughStep === 3 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#C17A5E] uppercase bg-[#C17A5E]/10 px-2 py-0.5 rounded">
                  TASK 3: Nest a Study Topic
                </span>
                <p className="text-xs leading-relaxed">
                  Super! Now let's nest a specific study unit topic (like <em>Meiosis Mechanism</em> or <em>Kreb's Cycle</em>) under it.
                </p>

                {topics.length > 0 ? (
                  <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-xl text-[11px] text-[#4D5D4B] font-semibold space-y-1">
                    <p className="font-bold">✓ Topic structure found!</p>
                    <p className="text-[10px] text-stone-500">You're ready to proceed to logging.</p>
                  </div>
                ) : (
                  <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs space-y-1">
                    <p className="font-semibold text-[#D98A6C] flex items-center gap-1">
                      <MousePointerClick className="w-3.5 h-3.5 animate-pulse" />
                      Click '+ NEW TOPIC' on screen
                    </p>
                    <p className="text-[10px] text-stone-500">Type a name and press Add Topic.</p>
                  </div>
                )}

                <div className="flex gap-2 pt-1">
                  <button 
                    onClick={handleSimulateTopic}
                    disabled={isAutoCreating || subjects.length === 0}
                    className={`flex-1 text-center py-2 bg-white border border-[#E8E2D9] hover:bg-[#F5F2ED] text-[#2D2A26] text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer ${subjects.length === 0 ? 'opacity-40 cursor-not-allowed' : ''}`}
                  >
                    ⚡ Auto-Nest Meiosis
                  </button>
                  <button 
                    onClick={() => setWalkthroughStep(4)}
                    className="px-3.5 py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer"
                  >
                    Skip Task
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Navigating to Add Log tab */}
            {walkthroughStep === 4 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2 py-0.5 rounded">
                  TASK 4: Navigate to Log Form
                </span>
                <p className="text-xs leading-relaxed">
                  Curriculum organized! Now let's learn how to record a mistake entry with proper metacognitive reflection.
                </p>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs">
                  <p className="font-bold text-[#D98A6C] flex items-center gap-1 animate-pulse">
                    <MousePointerClick className="w-4 h-4 shrink-0" />
                    Click the center 'Add' button in bottom bar
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('add')}
                  className="w-full text-center py-2 bg-[#5A5A40] hover:bg-[#4D4D36] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  🚀 Open Log Form For Me
                </button>
              </div>
            )}

            {/* STEP 5: Filling the Mistake Form */}
            {walkthroughStep === 5 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#C17A5E] uppercase bg-[#C17A5E]/10 px-2 py-0.5 rounded">
                  TASK 5: Metacognitive Log
                </span>
                <p className="text-xs leading-relaxed">
                  Fill in the fields on your screen. The most critical part is the <strong>Reflection</strong> textbox—where you write what your logic gap was!
                </p>

                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-[10px] text-stone-600 space-y-1.5">
                  <p className="font-semibold text-[#2D2A26]">Save yourself some typing:</p>
                  <button 
                    onClick={handleAutoFillMistakeForm}
                    className="w-full py-1 bg-[#D98A6C]/10 hover:bg-[#D98A6C]/20 border border-[#D98A6C]/30 text-[#D98A6C] rounded-lg text-[9px] font-bold uppercase tracking-wider cursor-pointer"
                  >
                    📝 Auto-Fill Mock Mistake Data
                  </button>
                </div>

                <button 
                  onClick={() => setWalkthroughStep(6)}
                  className="w-full text-center py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer"
                >
                  Skip logging, proceed
                </button>
              </div>
            )}

            {/* STEP 6: Return to Dashboard */}
            {walkthroughStep === 6 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#5A5A40] uppercase bg-[#5A5A40]/10 px-2 py-0.5 rounded">
                  TASK 6: Check your Stats
                </span>
                <p className="text-xs leading-relaxed">
                  Tremendous! Your mistake log is stored securely. Let's head back to the main console view to inspect your analytics.
                </p>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs">
                  <p className="font-bold text-[#D98A6C] flex items-center gap-1.5 animate-pulse">
                    <MousePointerClick className="w-4 h-4 shrink-0" />
                    Click 'Dashboard' in the navigation bar
                  </p>
                </div>
                <button 
                  onClick={() => onNavigate('dashboard')}
                  className="w-full text-center py-2 bg-[#5A5A40] hover:bg-[#4D4D36] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  🚀 Go to Dashboard
                </button>
              </div>
            )}

            {/* STEP 7: Launching the Review Arena */}
            {walkthroughStep === 7 && (
              <div className="space-y-2 animate-fade-in">
                <span className="text-[9px] font-bold tracking-widest text-[#D98A6C] uppercase bg-[#D98A6C]/10 px-2 py-0.5 rounded">
                  TASK 7: Active Recall Practice
                </span>
                <p className="text-xs leading-relaxed">
                  Look at your dashboard greeting. You now have a mistake ready for review today! Let's enter the active review loop.
                </p>
                <div className="p-3 bg-[#FAF8F5] rounded-xl border border-[#E8E2D9] text-xs">
                  <p className="font-bold text-[#D98A6C] flex items-center gap-1.5 animate-pulse">
                    <MousePointerClick className="w-4 h-4 shrink-0" />
                    Click the orange 'Quick Review' button
                  </p>
                </div>
                <button 
                  onClick={() => setWalkthroughStep(8)}
                  className="w-full text-center py-1.5 bg-stone-200 hover:bg-stone-300 text-stone-700 text-[10px] font-bold uppercase tracking-widest rounded-xl cursor-pointer"
                >
                  Bypass to details
                </button>
              </div>
            )}

            {/* STEP 8: Final Arena celebration */}
            {walkthroughStep === 8 && (
              <div className="space-y-2.5 animate-fade-in text-center">
                <div className="w-10 h-10 bg-[#8DA38A]/20 text-[#8DA38A] border border-[#8DA38A]/30 rounded-full flex items-center justify-center mx-auto mb-1">
                  <CheckCircle className="w-6 h-6 stroke-[2.5] animate-pulse" />
                </div>
                <h4 className="font-serif text-sm font-bold text-[#2D2A26]">
                  Training Fully Completed!
                </h4>
                <p className="text-xs text-stone-600 leading-relaxed">
                  Fantastic! You have successfully mastered the entire core loop of StudyFlow. You are now equipped for bulletproof recall.
                </p>
                <button 
                  onClick={skipAndComplete}
                  className="w-full text-center py-2.5 bg-[#8DA38A] hover:bg-[#7D937A] text-white text-[10px] font-bold uppercase tracking-wider rounded-xl cursor-pointer"
                >
                  ✓ Finish & Start Studying
                </button>
              </div>
            )}
          </div>

          {/* Guide navigation bar */}
          <div className="border-t border-[#E8E2D9] pt-3 mt-3.5 flex justify-between items-center text-[10px] font-bold font-sans">
            <button
              onClick={() => walkthroughStep > 1 ? setWalkthroughStep(p => p - 1) : setMode('welcome')}
              className="text-[#6B6357] hover:text-black flex items-center gap-0.5 cursor-pointer"
            >
              <ArrowLeft className="w-3 h-3" /> Back
            </button>
            <div className="flex gap-1">
              {Array.from({ length: 8 }).map((_, i) => (
                <span 
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${walkthroughStep === i + 1 ? 'bg-[#D98A6C]' : 'bg-[#E8E2D9]'}`}
                />
              ))}
            </div>
            {walkthroughStep < 8 ? (
              <button
                onClick={() => setWalkthroughStep(p => p + 1)}
                className="text-[#D98A6C] hover:text-[#C17A5E] flex items-center gap-0.5 cursor-pointer"
              >
                Skip <ArrowRight className="w-3 h-3" />
              </button>
            ) : (
              <span className="text-[#8DA38A]">Done!</span>
            )}
          </div>
        </div>
      )}

      {/* RENDER MODE B: Initial Welcome Dialog Selection Modal */}
      {mode === 'welcome' && (
        <div className="fixed inset-0 z-[210] bg-[#1a1918]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-lg overflow-y-auto flex flex-col justify-between animate-scale-up">
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-[#5A5A40]/10 rounded-lg text-[#5A5A40]">
                  <Sparkles className="w-4 h-4 text-[#D98A6C]" />
                </span>
                <span className="font-sans text-xs font-bold text-[#6B6357] uppercase tracking-widest">
                  StudyFlow Workspace Tour
                </span>
              </div>
              <button
                onClick={skipAndComplete}
                className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-center md:text-left py-2">
              <span className="text-[10px] font-bold tracking-widest text-[#D98A6C] uppercase bg-[#D98A6C]/10 px-2 py-1 rounded-md inline-block">
                Choose Your Onboarding Style
              </span>
              <h3 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26] leading-snug">
                Let's customize your learning experience.
              </h3>
              <p className="font-sans text-xs text-[#6B6357] leading-relaxed">
                StudyFlow replaces passive re-reading with active mistake analysis. Select how you would like to master the interface today:
              </p>

              {/* Personalize Greeting Field */}
              <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9] space-y-2 text-left">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-wider">
                  Personalize your dashboard greeting:
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Enter name... (e.g. Julian)"
                  className="w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-lg px-3 py-2 text-xs text-[#2D2A26] outline-none focus:border-[#5A5A40] font-sans font-semibold"
                />
              </div>

              {/* Two Interactive Selection Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={startWalkthrough}
                  className="p-4 bg-white hover:bg-[#FAF8F5] border-2 border-[#D98A6C] text-left rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group shadow-sm flex flex-col justify-between min-h-[140px]"
                >
                  <div className="space-y-1">
                    <span className="p-1 px-1.5 bg-[#D98A6C]/10 text-[#D98A6C] rounded-lg inline-block">
                      <GraduationCap className="w-4 h-4" />
                    </span>
                    <h4 className="font-sans text-xs font-bold text-[#2D2A26] mt-1.5 flex items-center gap-1 group-hover:text-[#C17A5E]">
                      Live Interactive Tour <ArrowRight className="w-3.5 h-3.5" />
                    </h4>
                    <p className="text-[10px] text-stone-500 font-sans leading-snug">
                      Sophia accompanies you directly on the real screen, lighting up the exact buttons for you to press!
                    </p>
                  </div>
                  <span className="text-[9px] text-[#D98A6C] uppercase font-bold tracking-wider mt-2 block">
                    🚀 Highly Recommended
                  </span>
                </button>

                <button
                  onClick={() => {
                    setSlidesStep(0);
                    setMode('slides');
                  }}
                  className="p-4 bg-white hover:bg-[#FAF8F5] border border-[#E8E2D9] text-left rounded-2xl cursor-pointer transition-all hover:scale-[1.01] active:scale-[0.99] group flex flex-col justify-between min-h-[140px]"
                >
                  <div className="space-y-1">
                    <span className="p-1 px-1.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-lg inline-block">
                      <BookOpen className="w-4 h-4" />
                    </span>
                    <h4 className="font-sans text-xs font-bold text-[#2D2A26] mt-1.5 flex items-center gap-1 group-hover:text-[#5A5A40]">
                      Static Slide Deck <ArrowRight className="w-3.5 h-3.5" />
                    </h4>
                    <p className="text-[10px] text-stone-500 font-sans leading-snug">
                      Prefer to just read? Browse structured slide diagrams with simulated mini widgets directly in this modal window.
                    </p>
                  </div>
                  <span className="text-[9px] text-[#6B6357] uppercase font-bold tracking-wider mt-2 block">
                    📖 Just show slides
                  </span>
                </button>
              </div>
            </div>

            <div className="border-t border-[#E8E2D9] pt-4 mt-4 text-center">
              <button
                onClick={skipAndComplete}
                className="text-stone-400 hover:text-stone-700 text-xs font-bold cursor-pointer transition-colors"
              >
                Skip Onboarding entirely
              </button>
            </div>
          </div>
        </div>
      )}

      {/* RENDER MODE C: Original Slide-Deck Onboarding Dialog (Retained fallback for pure reading) */}
      {mode === 'slides' && (
        <div className="fixed inset-0 z-[210] bg-[#1a1918]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-3xl p-6 md:p-8 shadow-2xl w-full max-w-2xl max-h-[92vh] overflow-y-auto flex flex-col justify-between animate-scale-up">
            
            {/* Top bar */}
            <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-4 mb-4">
              <div className="flex items-center gap-2">
                <span className="p-1 px-1.5 bg-[#5A5A40]/10 rounded-lg text-[#5A5A40]">
                  <Sparkles className="w-4 h-4 text-[#D98A6C]" />
                </span>
                <span className="font-sans text-xs font-bold text-[#6B6357] uppercase tracking-widest">
                  StudyFlow Slide Guide ({slidesStep + 1} of {totalSlidesSteps})
                </span>
              </div>
              <button
                onClick={skipAndComplete}
                className="p-1 text-stone-400 hover:text-black hover:bg-stone-100 rounded-full cursor-pointer transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Slide Pages content */}
            <div className="flex-1 my-2 min-h-[300px]">
              
              {/* SLIDE 0: Welcome */}
              {slidesStep === 0 && (
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
                </div>
              )}

              {/* SLIDE 1: Subjects */}
              {slidesStep === 1 && (
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
                      <div className="text-xs text-[#2D2A26] leading-relaxed animate-fade-in">
                        Bootstrap your first real subject right here:
                      </div>

                      {hasCreatedTrial ? (
                        <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-lg text-xs flex items-center gap-2 text-[#4D5D4B] font-bold animate-slide-down">
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
                            disabled={isCreatingSlideTrial}
                          />
                          <button
                            onClick={handleCreateSlideTrial}
                            disabled={!subjectNameInput.trim() || isCreatingSlideTrial}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center gap-1 bg-[#5A5A40] hover:bg-[#4D4D36] ${!subjectNameInput.trim() ? "opacity-45 cursor-not-allowed bg-stone-300 text-stone-500" : ""}`}
                          >
                            {isCreatingSlideTrial ? 'Pre-registering...' : 'Add This Real Subject'}
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
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SLIDE 2: Topics */}
              {slidesStep === 2 && (
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
                        <div className="bg-[#8DA38A]/10 border border-[#8DA38A]/30 p-2.5 rounded-lg text-xs flex items-center gap-2 text-[#4D5D4B] font-bold animate-slide-down">
                          <Check className="w-4 h-4 stroke-[3px]" /> 
                          <span>Nested "{topicNameInput}" under "{subjectNameInput || 'Biology'}"!</span>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <div className="text-[10px] text-[#6B6357] italic">
                            *Will nest inside subject: <strong className="text-[#2D2A26]">{subjectNameInput || 'Molecular Biology'}</strong>
                          </div>
                          <input
                            type="text"
                            value={topicNameInput}
                            onChange={(e) => setTopicNameInput(e.target.value)}
                            placeholder="e.g. Meiosis Mechanism"
                            className="w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-lg p-2 text-xs text-[#2D2A26] outline-none font-semibold placeholder-stone-400"
                            disabled={isCreatingSlideTrial}
                          />
                          <button
                            onClick={handleCreateSlideTrial}
                            disabled={!topicNameInput.trim() || isCreatingSlideTrial}
                            className={`w-full py-1.5 rounded-lg text-xs font-bold text-white transition-all select-none cursor-pointer flex items-center justify-center gap-1 bg-[#5A5A40] hover:bg-[#4D4D36] ${(!topicNameInput.trim()) ? "opacity-45 cursor-not-allowed bg-stone-300 text-stone-500" : ""}`}
                          >
                            {isCreatingSlideTrial ? 'Nesting unit...' : 'Add This Real Unit Topic'}
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

              {/* SLIDE 3: Logging */}
              {slidesStep === 3 && (
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
                </div>
              )}

              {/* SLIDE 4: Recall Sandbox */}
              {slidesStep === 4 && (
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

                  <div className="bg-[#FAF8F5] border-2 border-[#E8E2D9] rounded-2xl p-4 space-y-3 shadow-sm max-w-xl mx-auto">
                    <div className="flex justify-between items-center bg-[#F5F2ED] p-1.5 px-3 rounded-xl border border-[#E8E2D9] text-[10px] font-bold text-[#5A5A40]">
                      <span>🧬 biology • Meiosis Mechanism</span>
                      <span className="bg-[#C17A5E] text-white px-1.5 py-0.5 rounded">Active Deck Trial</span>
                    </div>

                    <div className="space-y-0.5">
                      <span className="block text-[9px] font-bold text-[#9A9184] uppercase">Active Recall Prompt Check:</span>
                      <p className="font-serif text-xs font-semibold italic text-[#2D2A26]">
                        "How are sister chromatids held together before anaphase?"
                      </p>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[9px] font-bold text-[#5A5A40] uppercase block">
                        Whiteboard practice scratchpad
                      </label>
                      <input
                        type="text"
                        value={demoRecallText}
                        onChange={(e) => setDemoRecallText(e.target.value)}
                        placeholder="Type standard formula notes here..."
                        className="w-full bg-white border border-[#E8E2D9] rounded-xl p-2 text-xs text-[#2D2A26] outline-none font-sans"
                      />
                    </div>

                    {demoRecallAnswerSolved ? (
                      <div className="space-y-3.5 pt-2 border-t border-[#E8E2D9] animate-slide-down">
                        <div className="bg-[#8DA38A]/10 p-2 rounded-xl border border-[#8DA38A]/30 text-xs text-[#2D2A26]">
                          <span className="block font-bold text-emerald-800 uppercase text-[9px] mb-0.5">Correct Solution:</span>
                          <p className="font-sans font-semibold">Held together tightly by the protein complex cohesin.</p>
                        </div>

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

              {/* SLIDE 5: Finish */}
              {slidesStep === 5 && (
                <div className="space-y-4 animate-fade-in text-center">
                  <div className="w-16 h-16 rounded-full bg-[#8DA38A]/10 border border-[#8DA38A] flex items-center justify-center mx-auto text-[#8DA38A] mb-3">
                    <Award className="w-10 h-10 animate-pulse" />
                  </div>

                  <h2 className="font-serif text-3xl font-semibold text-[#2D2A26] leading-snug">
                    You're ready to master your curriculum!
                  </h2>
                  
                  <p className="font-sans text-sm text-[#6B6357] max-w-xl mx-auto leading-relaxed">
                    Awesome! You now understand the core pillars of StudyFlow. By tracking and actively reviewing your mistakes regularly:
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-left py-2 font-sans text-xs max-w-lg mx-auto">
                    <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-0.5">
                      <span className="font-bold text-[#2D2A26] block">🔥 Study Streaks</span>
                      <p className="text-stone-500 text-[10px]">Log mistakes regularly to maintain daily active streaks.</p>
                    </div>
                    <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-0.5">
                      <span className="font-bold text-[#2D2A26] block">📊 Trap Analytics</span>
                      <p className="text-stone-500 text-[10px]">Map error tags to check if you fail memory or calculation steps.</p>
                    </div>
                    <div className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9] space-y-0.5">
                      <span className="font-bold text-[#2D2A26] block">☁ Secure Cloud Backup</span>
                      <p className="text-stone-500 text-[10px]">Your logs sync automatically under your active scholar credentials.</p>
                    </div>
                  </div>
                </div>
              )}

            </div>

            {/* Bottom Nav indicators */}
            <div className="border-t border-[#E8E2D9] pt-4 mt-4 flex justify-between items-center font-sans text-xs font-bold">
              <button
                onClick={handleBackSlide}
                disabled={slidesStep === 0}
                className={`px-4 py-2 hover:bg-stone-100 rounded-full flex items-center gap-1 transition-colors select-none ${slidesStep === 0 ? 'opacity-30 cursor-not-allowed text-stone-300' : 'text-[#6B6357] cursor-pointer'}`}
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Prev Slide</span>
              </button>

              <div className="flex gap-1.5">
                {Array.from({ length: totalSlidesSteps }).map((_, i) => (
                  <span 
                    key={i} 
                    onClick={() => setSlidesStep(i)}
                    className={`w-2.5 h-2.5 rounded-full cursor-pointer transition-all ${slidesStep === i ? 'bg-[#D98A6C] scale-125' : 'bg-[#E8E2D9] hover:bg-[#6B6357]/35'}`}
                  />
                ))}
              </div>

              <button
                onClick={handleNextSlide}
                className="px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4D4D36] text-white rounded-full flex items-center gap-1 transition-all select-none cursor-pointer"
              >
                <span>{slidesStep === totalSlidesSteps - 1 ? 'Start Journaling' : 'Next Step'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
