/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useJournalStore } from './useJournalStore';
import { Header } from './components/Header';
import { BottomNavBar, ViewTab } from './components/BottomNavBar';
import { DashboardView } from './components/DashboardView';
import { SubjectsTopicsView } from './components/SubjectsTopicsView';
import { MistakeLibraryView } from './components/MistakeLibraryView';
import { MistakeDetailView } from './components/MistakeDetailView';
import { CreateMistakeView } from './components/CreateMistakeView';
import { ProfileView } from './components/ProfileView';
import { InsightsView } from './components/InsightsView';
import { QuickAddModal } from './components/QuickAddModal';
import { LandingPage } from './components/LandingPage';

import { Sparkles, Calendar, BookOpen, AlertCircle, X, ChevronRight, CheckCircle, GraduationCap, Eye } from 'lucide-react';
import { INITIAL_SUBJECTS, INITIAL_TOPICS, INITIAL_SUBTOPICS, INITIAL_MISTAKES } from './initialData';

export default function App() {
  const store = useJournalStore();
  
  // Guest mode state to allow testing of memory dashboard offline
  const [guestMode, setGuestMode] = useState<boolean>(() => {
    return localStorage.getItem('studyflow_guest_mode') === 'true';
  });

  // Reset guest mode if user authenticates successfully
  useEffect(() => {
    if (store.user) {
      setGuestMode(false);
      localStorage.removeItem('studyflow_guest_mode');
    }
  }, [store.user]);

  const handleContinueAsGuest = () => {
    setGuestMode(true);
    localStorage.setItem('studyflow_guest_mode', 'true');
  };

  const handleLogout = async () => {
    await store.logout();
    setGuestMode(false);
    localStorage.removeItem('studyflow_guest_mode');
  };

  const [currentView, setCurrentView] = useState<ViewTab>('dashboard');
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  
  // Custom user name persisted locally, defaulting to clean anonymous state
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('studyflow_username') || 'New Scholar';
  });

  // Dynamically resolve display name based on Firebase Auth identity status
  const resolvedUserName = useMemo(() => {
    if (store.user) {
      return store.user.displayName || store.user.email?.split('@')[0] || 'Google Scholar';
    }
    return userName;
  }, [store.user, userName]);

  // Target subject ID for deep navigation from dashboard overview
  const [initialSelectedSubjectId, setInitialSelectedSubjectId] = useState<string | undefined>(undefined);

  // Quick Review Session states
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [reviewFilterSubjectId, setReviewFilterSubjectId] = useState<string | 'all'>('all');
  const [reviewFilterTopicId, setReviewFilterTopicId] = useState<string | 'all'>('all');
  const [isReviewSetupActive, setIsReviewSetupActive] = useState<boolean>(true);
  const [includeMasteredInReview, setIncludeMasteredInReview] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');

  // Active mistakes for review
  const reviewMistakes = useMemo(() => {
    let list = store.mistakes;
    if (!includeMasteredInReview) {
      list = list.filter((m) => m.status !== 'Mastered');
    }
    if (reviewFilterSubjectId !== 'all') {
      list = list.filter((m) => m.subjectId === reviewFilterSubjectId);
    }
    if (reviewFilterTopicId !== 'all') {
      list = list.filter((m) => m.topicId === reviewFilterTopicId);
    }
    return list;
  }, [store.mistakes, reviewFilterSubjectId, reviewFilterTopicId, includeMasteredInReview]);

  // Persist user name updates
  useEffect(() => {
    localStorage.setItem('studyflow_username', userName);
  }, [userName]);

  // Helper to trigger navigation
  const handleNavigate = (view: ViewTab, targetSubjectId?: string) => {
    setSelectedMistakeId(null);
    setCurrentView(view);
    if (targetSubjectId) {
      setInitialSelectedSubjectId(targetSubjectId);
    } else {
      setInitialSelectedSubjectId(undefined);
    }
  };

  // Helper to open a specific mistake detail
  const handleSelectMistake = (id: string) => {
    setSelectedMistakeId(id);
  };

  const clearSelectedMistakeAndGoBack = () => {
    setSelectedMistakeId(null);
  };

  // Quick review mechanics support targeted custom review setups
  const handleStartQuickReview = (subjectId?: string, topicId?: string) => {
    setScratchpadText('');
    setIncludeMasteredInReview(false);
    
    if (subjectId) {
      setReviewFilterSubjectId(subjectId);
      if (topicId) {
        setReviewFilterTopicId(topicId);
        setIsReviewSetupActive(false); // Start instantly for a specific topic deeplink!
      } else {
        setReviewFilterTopicId('all');
        setIsReviewSetupActive(true); // Let user review and click start
      }
    } else {
      setReviewFilterSubjectId('all');
      setReviewFilterTopicId('all');
      setIsReviewSetupActive(true); // Full selector menu
    }
    
    setReviewIndex(0);
    setIsAnswerRevealed(false);
    setIsReviewOpen(true);
  };

  const handleNextReviewItem = (outcome: 'New' | 'Reviewing' | 'Mastered') => {
    const currentItem = reviewMistakes[reviewIndex];
    if (currentItem) {
      store.editMistake(currentItem.id, { status: outcome });
    }

    setScratchpadText('');
    if (reviewIndex + 1 < reviewMistakes.length) {
      setReviewIndex(reviewIndex + 1);
      setIsAnswerRevealed(false);
    } else {
      setIsReviewOpen(false);
      alert('Congratulations! You completed your active mistake review cycle.');
    }
  };

  // Trigger review directly for a specific weakest topic
  const handleTriggerReviewForTopic = (topicId: string) => {
    const topic = store.topics.find((t) => t.id === topicId);
    if (topic) {
      handleStartQuickReview(topic.subjectId, topic.id);
    } else {
      handleStartQuickReview();
    }
  };

  // Global search autofilter query hook activation
  const handleGlobalSearchQuery = () => {
    // Navigate to library view panel so student can perform search queries
    handleNavigate('insights');
  };

  // Database resetting triggers
  const handleResetToDemo = () => {
    localStorage.setItem('studyflow_subjects', JSON.stringify(INITIAL_SUBJECTS));
    localStorage.setItem('studyflow_topics', JSON.stringify(INITIAL_TOPICS));
    localStorage.setItem('studyflow_subtopics', JSON.stringify(INITIAL_SUBTOPICS));
    localStorage.setItem('studyflow_mistakes', JSON.stringify(INITIAL_MISTAKES));
    
    // Hard refresh window for complete clean memory reinstantiation
    window.location.reload();
  };

  const handleClearAllMemory = () => {
    localStorage.setItem('studyflow_subjects', JSON.stringify([]));
    localStorage.setItem('studyflow_topics', JSON.stringify([]));
    localStorage.setItem('studyflow_subtopics', JSON.stringify([]));
    localStorage.setItem('studyflow_mistakes', JSON.stringify([]));
    
    window.location.reload();
  };

  if (store.loading) {
    return (
      <div className="min-h-screen bg-[#FDFCF8] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 border-4 border-[#2D2A26] border-t-transparent rounded-full animate-spin"></div>
        <div className="text-center">
          <p className="font-serif text-lg font-semibold text-[#2D2A26]">Restoring Scholarly Database</p>
          <p className="text-xs text-[#9A9184] font-mono uppercase tracking-widest mt-1">Verifying encrypted cloud nodes...</p>
        </div>
      </div>
    );
  }

  if (!store.user && !guestMode) {
    return (
      <LandingPage
        onSignInWithGoogle={store.signInWithGoogle}
        onContinueAsGuest={handleContinueAsGuest}
        isLoading={store.loading}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1b1c1c] font-sans selection:bg-[#E6E1FF]">
      
      {/* Top App bar */}
      <Header
        userName={resolvedUserName}
        onNavigate={handleNavigate}
        onActivateSearch={handleGlobalSearchQuery}
        onOpenQuickAdd={() => setIsQuickAddOpen(true)}
        userPhoto={store.user?.photoURL}
      />

      {/* Main Content Layout container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-32">
        {!store.user && guestMode && (
          <div className="bg-[#E6E1FF]/40 border border-[#d2cbfa]/60 p-4 rounded-2xl mb-6 text-xs text-[#2D2A26] flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in font-sans">
            <div className="flex items-center gap-2">
              <span className="p-1 bg-[#E6E1FF] text-[#2D2A26] rounded-md shrink-0">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span>
                <strong>Guest Sandbox Mode:</strong> Your mistake memory is stored locally on this machine. Sign in to sync.
              </span>
            </div>
            <button
              onClick={store.signInWithGoogle}
              className="px-3.5 py-1.5 bg-[#2D2A26] hover:bg-[#4A453E] text-white font-bold rounded-lg shrink-0 text-[11px] uppercase tracking-wider self-start sm:self-auto cursor-pointer"
            >
              Link Google Account
            </button>
          </div>
        )}

        {selectedMistakeId ? (
          /* Individual Mistake Detail Card gets top operational precedence */
          <MistakeDetailView
            mistakeId={selectedMistakeId}
            subjects={store.subjects}
            topics={store.topics}
            subtopics={store.subtopics}
            mistakes={store.mistakes}
            editMistake={store.editMistake}
            deleteMistake={store.deleteMistake}
            onGoBack={clearSelectedMistakeAndGoBack}
          />
        ) : (
          /* Normal Primary Tab Router Views */
          (() => {
            switch (currentView) {
              case 'dashboard':
                return (
                  <DashboardView
                    subjects={store.subjects}
                    mistakes={store.mistakes}
                    onNavigate={handleNavigate}
                    onSelectMistake={handleSelectMistake}
                    onStartReview={handleStartQuickReview}
                    userName={resolvedUserName}
                    onOpenQuickAdd={() => setIsQuickAddOpen(true)}
                  />
                );
              case 'topics':
                return (
                  <SubjectsTopicsView
                    subjects={store.subjects}
                    topics={store.topics}
                    subtopics={store.subtopics}
                    mistakes={store.mistakes}
                    addSubject={store.addSubject}
                    editSubject={store.editSubject}
                    deleteSubject={store.deleteSubject}
                    addTopic={store.addTopic}
                    editTopic={store.editTopic}
                    deleteTopic={store.deleteTopic}
                    addSubtopic={store.addSubtopic}
                    editSubtopic={store.editSubtopic}
                    deleteSubtopic={store.deleteSubtopic}
                    onSelectMistake={handleSelectMistake}
                    deleteMistake={store.deleteMistake}
                    initialSelectedSubjectId={initialSelectedSubjectId}
                    onNavigateToCreate={() => handleNavigate('add')}
                    onTriggerReview={handleStartQuickReview}
                  />
                );
              case 'add':
                return (
                  <CreateMistakeView
                    subjects={store.subjects}
                    topics={store.topics}
                    subtopics={store.subtopics}
                    addSubject={store.addSubject}
                    addTopic={store.addTopic}
                    addMistake={store.addMistake}
                    onNavigateToMistake={handleSelectMistake}
                    onNavigateToLibrary={() => handleNavigate('insights')}
                  />
                );
              case 'insights':
                return (
                  <div className="space-y-12 animate-fade-in">
                    <InsightsView
                      subjects={store.subjects}
                      topics={store.topics}
                      mistakes={store.mistakes}
                      onTriggerReviewForTopic={handleTriggerReviewForTopic}
                    />
                    
                    <div className="border-t border-gray-100 pt-10">
                      <MistakeLibraryView
                        subjects={store.subjects}
                        topics={store.topics}
                        subtopics={store.subtopics}
                        mistakes={store.mistakes}
                        onSelectMistake={handleSelectMistake}
                        deleteMistake={store.deleteMistake}
                      />
                    </div>
                  </div>
                );
              case 'profile':
                return (
                  <ProfileView
                    userName={resolvedUserName}
                    setUserName={setUserName}
                    subjects={store.subjects}
                    topics={store.topics}
                    mistakes={store.mistakes}
                    onResetToDemo={handleResetToDemo}
                    onClearAll={handleClearAllMemory}
                    user={store.user}
                    onSignInWithGoogle={store.signInWithGoogle}
                    onLogout={handleLogout}
                  />
                );
              default:
                return (
                  <div className="text-center py-20 text-gray-400">
                    Tab not found.
                  </div>
                );
            }
          })()
        )}
      </main>

      {/* Floating flashcard modal-review session overlay */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#FDFCF8] border border-stone-200 rounded-3xl p-6 shadow-2xl w-full max-w-2xl animate-scale-up flex flex-col justify-between max-h-[92vh] overflow-y-auto">
            
            {/* Header review state */}
            <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3 mb-4">
              <span className="font-sans text-xs font-bold text-[#6B6357] uppercase tracking-widest flex items-center gap-1.5">
                <GraduationCap className="w-5.5 h-5.5 text-[#D98A6C]" />
                {isReviewSetupActive ? 'Configure Practice Session' : `Active Recall Deck (Card ${reviewIndex + 1} of ${reviewMistakes.length})`}
              </span>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 px-1.5 text-stone-400 hover:text-black hover:bg-stone-100 rounded-full transition-colors flex items-center justify-center cursor-pointer"
                title="Exit Session"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {isReviewSetupActive ? (
              /* State A: Practice Configuration Hub Setup */
              <div className="space-y-5 py-2 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif text-2xl font-semibold text-[#2D2A26] mb-1">
                    What would you like to review today?
                  </h3>
                  <p className="font-sans text-xs text-[#6B6357] mb-4">
                    Target your focus by selecting specific subjects, topics, and cumulative review options below.
                  </p>

                  <div className="space-y-4 bg-[#F5F2ED] p-5 rounded-2xl border border-[#E8E2D9]">
                    {/* Subject filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider mb-1.5">
                        Subject Filter
                      </label>
                      <select
                        value={reviewFilterSubjectId}
                        onChange={(e) => {
                          setReviewFilterSubjectId(e.target.value);
                          setReviewFilterTopicId('all');
                        }}
                        className="w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-xl px-3 py-2.5 text-xs text-[#2D2A26] font-sans font-semibold focus:outline-none focus:border-[#5A5A40]"
                      >
                        <option value="all">📚 All Subjects ({store.mistakes.filter((m) => m.status !== 'Mastered').length} active mistakes)</option>
                        {store.subjects.map((sub) => {
                          const count = store.mistakes.filter(m => m.subjectId === sub.id && m.status !== 'Mastered').length;
                          return (
                            <option key={sub.id} value={sub.id}>
                              {sub.name} ({count} active)
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    {/* Topic filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider mb-1.5">
                        Topic Filter
                      </label>
                      <select
                        value={reviewFilterTopicId}
                        onChange={(e) => setReviewFilterTopicId(e.target.value)}
                        disabled={reviewFilterSubjectId === 'all'}
                        className={`w-full bg-[#FDFCF8] border border-[#E8E2D9] rounded-xl px-3 py-2.5 text-xs text-[#2D2A26] font-sans font-semibold focus:outline-none focus:border-[#5A5A40] ${reviewFilterSubjectId === 'all' ? 'opacity-55 cursor-not-allowed bg-stone-100' : ''}`}
                      >
                        <option value="all">📁 All Topics for this Subject</option>
                        {store.topics
                          .filter((t) => t.subjectId === reviewFilterSubjectId)
                          .map((topic) => {
                            const count = store.mistakes.filter((m) => m.topicId === topic.id && m.status !== 'Mastered').length;
                            return (
                              <option key={topic.id} value={topic.id}>
                                {topic.name} ({count} active)
                              </option>
                            );
                          })}
                      </select>
                      {reviewFilterSubjectId === 'all' && (
                        <p className="text-[10px] text-[#9A9184] mt-1 italic">
                          *Select a specific subject module first to filter its nested units.
                        </p>
                      )}
                    </div>

                    {/* Mode selector */}
                    <div className="pt-2 border-t border-[#E8E2D9] flex items-center justify-between">
                      <div>
                        <span className="block text-[11px] font-bold text-[#2D2A26] uppercase">Include Mastered logs</span>
                        <span className="text-[10px] text-[#6B6357]">Practice both solved and unresolved errors for a complete mock revision run.</span>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={includeMasteredInReview}
                          onChange={(e) => setIncludeMasteredInReview(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-11 h-6 bg-stone-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#8DA38A]"></div>
                      </label>
                    </div>
                  </div>

                  {/* Matching Indicator Status */}
                  <div className="mt-4 p-4 rounded-xl flex items-center gap-3 bg-[#E8E2D9]/40 border border-[#E8E2D9]">
                    <div className="p-2 bg-[#FDFCF8] rounded-xl border border-[#E8E2D9]">
                      <span className="text-xl font-bold font-serif text-[#2D2A26]">{reviewMistakes.length}</span>
                    </div>
                    <div className="text-xs">
                      <span className="block font-bold text-[#2D2A26]">Mistake cards found</span>
                      <span className="text-[#6B6357]">ready to be loaded into your dynamic study rotation grid.</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row justify-end gap-3 border-t border-[#E8E2D9] pt-4">
                  <button
                    onClick={() => setIsReviewOpen(false)}
                    className="px-4.5 py-2.5 bg-stone-100 hover:bg-stone-200 text-[#6B6357] font-sans font-bold text-xs rounded-full transition-colors cursor-pointer order-2 sm:order-1"
                  >
                    Close Dialog
                  </button>
                  <button
                    onClick={() => {
                      if (reviewMistakes.length > 0) {
                        setReviewIndex(0);
                        setIsAnswerRevealed(false);
                        setIsReviewSetupActive(false);
                      }
                    }}
                    disabled={reviewMistakes.length === 0}
                    className={`px-6 py-2.5 bg-[#D98A6C] text-[#FDFCF8] hover:bg-[#C17A5E] font-sans font-bold text-xs rounded-full shadow-sm flex items-center justify-center gap-1.5 transition-colors order-1 sm:order-2 cursor-pointer ${reviewMistakes.length === 0 ? 'opacity-55 cursor-not-allowed bg-stone-400 hover:bg-stone-400 text-white' : ''}`}
                  >
                    <span>LAUNCH REVISION SESSION</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              /* State B: Active Flashcard recall practice session */
              <div className="space-y-4 my-2 flex-1 flex flex-col justify-between">
                {reviewMistakes.length === 0 ? (
                  <div className="text-center py-10 space-y-4">
                    <AlertCircle className="w-12 h-12 text-[#D98A6C] mx-auto opacity-70" />
                    <h3 className="font-serif text-xl font-bold text-[#2D2A26]">No mistake logs matched this folder.</h3>
                    <p className="text-xs text-[#6B6357]">Adjust your filters in the setup screen to include other topics or resolved items.</p>
                    <button
                      onClick={() => setIsReviewSetupActive(true)}
                      className="px-4 py-2 bg-[#5A5A40] text-white text-xs font-bold rounded-full hover:bg-[#4D4D36]"
                    >
                      Back to Setup config
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="overflow-y-auto max-h-[82vh] space-y-4 pr-1">
                      <div>
                        {/* Subject, Topic, Subtopic tags */}
                        <div className="flex flex-wrap items-center gap-1.5 mb-1 bg-[#F5F2ED] p-2 rounded-xl border border-[#E8E2D9]">
                          <span className="text-[10px] font-bold text-[#D98A6C] bg-[#D98A6C]/10 px-2 py-0.5 rounded-md">
                            Subject: {store.subjects.find((s) => s.id === reviewMistakes[reviewIndex].subjectId)?.name}
                          </span>
                          <span className="text-[10px] font-semibold text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-0.5 rounded-md">
                            Topic: {store.topics.find((t) => t.id === reviewMistakes[reviewIndex].topicId)?.name}
                          </span>
                          {reviewMistakes[reviewIndex].subtopicId && (
                            <span className="text-[10px] text-[#6B6357] bg-stone-150 px-2 py-0.5 rounded-md">
                              Subtopic: {store.subtopics.find((st) => st.id === reviewMistakes[reviewIndex].subtopicId)?.name || 'Unit'}
                            </span>
                          )}
                          {/* Status tag */}
                          <span className={`text-[10px] font-bold ml-auto px-2 py-0.5 rounded-full text-white ${reviewMistakes[reviewIndex].status === 'Mastered' ? 'bg-[#8DA38A]' : reviewMistakes[reviewIndex].status === 'Reviewing' ? 'bg-[#D98A6C]' : 'bg-[#E8E2D9] text-[#2D2A26]'}`}>
                            {reviewMistakes[reviewIndex].status}
                          </span>
                        </div>

                        <h3 className="font-serif text-xl font-bold text-[#2D2A26] mt-2 mb-2 leading-tight">
                          {reviewMistakes[reviewIndex].title}
                        </h3>

                        {/* Error category elements array */}
                        {reviewMistakes[reviewIndex].categories && reviewMistakes[reviewIndex].categories.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-2">
                            {reviewMistakes[reviewIndex].categories.map((cat, i) => (
                              <span key={i} className="text-[9px] font-bold tracking-tight bg-[#F2EDE6] text-[#4A453E] px-2 py-0.5 rounded border border-[#E8E2D9]">
                                ⚠ {cat}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      {/* Original Question Segment */}
                      <div className="bg-white border p-4.5 rounded-2xl border-[#E8E2D9] shadow-inner space-y-3">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-[#5A5A40] font-sans block border-b border-[#F2EDE6] pb-1">
                          Original Question Prompt
                        </span>
                        <p className="font-serif text-[#2D2A26] leading-relaxed text-base italic newline-style pr-2">
                          "{reviewMistakes[reviewIndex].originalQuestion || 'No question details recorded. Edit mistake to append prompt.'}"
                        </p>

                        {/* Attached image check */}
                        {reviewMistakes[reviewIndex].imageUrl && (
                          <div className="mt-3 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl p-2 relative overflow-hidden flex items-center justify-between gap-3 select-none">
                            <div className="flex items-center gap-2">
                              <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 text-[9px] font-bold px-1.5 py-0.5 rounded uppercase">Image Reference Attached</span>
                              <span className="text-[10px] text-[#6B6357] italic">Interact with full view directly from Mistake Library.</span>
                            </div>
                            <img
                              src={reviewMistakes[reviewIndex].imageUrl}
                              referrerPolicy="no-referrer"
                              alt="Reference"
                              className="w-12 h-12 object-cover rounded-lg border border-[#E8E2D9]"
                            />
                          </div>
                        )}
                      </div>

                      {/* Active scratchpad response area */}
                      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 space-y-2">
                        <label className="text-[10px] uppercase font-bold tracking-wider text-[#5A5A40] font-sans block">
                          Whiteboard practice scratchpad (Active Recall Sandbox)
                        </label>
                        <textarea
                          value={scratchpadText}
                          onChange={(e) => setScratchpadText(e.target.value)}
                          placeholder="Write down your calculated solution, response draft, or recall formulas here... Then reveal answer to cross-check!"
                          rows={2}
                          className="w-full bg-[#FDFCF8] border border-[#E8E2D9] text-xs font-sans rounded-xl p-2.5 text-[#2D2A26] focus:outline-none focus:ring-1 focus:ring-[#5A5A40] focus:border-[#5A5A40] placeholder-[#9A9184]"
                        />
                      </div>

                      {/* Reveal Answers block */}
                      {isAnswerRevealed ? (
                        <div className="space-y-3.5 mt-2 animate-slide-down">
                          
                          {/* Padded answers side-by-side or stacked */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {/* My Incorrect Attempt */}
                            {reviewMistakes[reviewIndex].myAnswer && (
                              <div className="bg-red-50/70 p-3.5 rounded-xl text-xs leading-normal font-sans border border-red-105">
                                <span className="font-bold text-red-700 block mb-1 uppercase tracking-wider text-[9px]">
                                  Your Logged Incorrect Attempt
                                </span>
                                <div className="font-mono text-[#2D2A26] bg-[#FDFCF8]/90 p-2 rounded border border-red-200">
                                  {reviewMistakes[reviewIndex].myAnswer}
                                </div>
                              </div>
                            )}

                            {/* Correct Answer */}
                            {reviewMistakes[reviewIndex].correctAnswer && (
                              <div className="bg-[#8DA38A]/10 p-3.5 rounded-xl text-xs leading-normal font-sans border border-[#8DA38A]/30">
                                <span className="font-bold text-[#4D5D4B] block mb-1 uppercase tracking-wider text-[9px]">
                                  Correct Answer Outcome
                                </span>
                                <div className="font-mono text-[#2D2A26] bg-[#FDFCF8]/90 p-2 rounded border border-[#8DA38A]/30">
                                  {reviewMistakes[reviewIndex].correctAnswer}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Detailed Step-by-Step Explanation */}
                          {reviewMistakes[reviewIndex].correctExplanation && (
                            <div className="bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl p-3.5 text-xs text-[#2D2A26]">
                              <span className="block font-bold text-[#5A5A40] text-[10px] uppercase mb-1">CORRECT PRACTICE EXPLANATION & STEPS:</span>
                              <p className="font-sans text-stone-700 leading-relaxed whitespace-pre-wrap">{reviewMistakes[reviewIndex].correctExplanation}</p>
                            </div>
                          )}

                          {/* Reflections and Advice block */}
                          <div className="bg-[#EAEAF2] border border-[#E8E2D9] p-4 rounded-xl text-stone-850">
                            {reviewMistakes[reviewIndex].futureAdvice && (
                              <div className="mb-2">
                                <span className="font-sans text-[10px] font-bold text-[#5e5c75] uppercase tracking-wider block mb-0.5">
                                  Future Self Advice (Next Time Strategy):
                                </span>
                                <p className="font-serif text-sm font-semibold italic text-[#2D2A26]">
                                  "{reviewMistakes[reviewIndex].futureAdvice}"
                                </p>
                              </div>
                            )}
                            {reviewMistakes[reviewIndex].reflection && (
                              <div className="border-t border-[#E8E2D9] pt-2 mt-2">
                                <span className="font-sans text-[10px] font-bold text-[#5e5c75] uppercase tracking-wider block mb-0.5">
                                  My Self-Reflection (Conceptual Deep-Dive):
                                </span>
                                <p className="font-sans text-xs text-[#4D453E]">
                                  {reviewMistakes[reviewIndex].reflection}
                                </p>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="py-2.5 text-center transition-all">
                          <button
                            onClick={() => setIsAnswerRevealed(true)}
                            className="px-6 py-3 bg-[#5A5A40] hover:bg-[#4D4D36] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-full cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-1.5 mx-auto shadow-sm"
                          >
                            <Eye className="w-4 h-4 text-[#D98A6C]" />
                            Reveal Correct Answer & Advice
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Bottom Actions Row Practice */}
                    <div className="border-t border-[#E8E2D9] pt-4 mt-2 flex flex-col md:flex-row justify-between gap-4 font-sans">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setIsReviewSetupActive(true)}
                          className="text-stone-400 hover:text-black text-xs font-bold px-3 py-1 bg-stone-100 hover:bg-stone-150 rounded-full cursor-pointer"
                        >
                          ‹ Config
                        </button>
                        <span className="text-xs text-stone-400 font-medium">
                          {reviewIndex + 1} of {reviewMistakes.length} matched logs
                        </span>
                      </div>

                      {/* Flashcard Response Outcomes */}
                      <div className="flex flex-wrap items-center gap-2">
                        {isAnswerRevealed ? (
                          <>
                            {/* Outcome: Unresolved Status */}
                            <button
                              onClick={() => handleNextReviewItem('New')}
                              className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 rounded-xl text-xs font-semibold cursor-pointer border border-red-200 flex items-center gap-1"
                              title="Keep in rotation as unresolved"
                            >
                              Still practicing
                            </button>

                            {/* Outcome: Reviewing status */}
                            <button
                              onClick={() => handleNextReviewItem('Reviewing')}
                              className="px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded-xl text-xs font-semibold cursor-pointer border border-amber-200 flex items-center gap-1"
                              title="Keep as intermediate studying"
                            >
                              Almost got it!
                            </button>

                            {/* Outcome: Mastered status */}
                            <button
                              onClick={() => handleNextReviewItem('Mastered')}
                              className="px-4 py-2 bg-[#8DA38A] hover:bg-[#728570] text-white rounded-xl text-xs font-bold flex items-center gap-1 cursor-pointer"
                              title="Mark log as Mastered and pull out of rotation"
                            >
                              <CheckCircle className="w-3.5 h-3.5 text-stone-100" /> Got it! Mastered
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => {
                              // Skip card outcome without changing DB status
                              setScratchpadText('');
                              if (reviewIndex + 1 < reviewMistakes.length) {
                                setReviewIndex(reviewIndex + 1);
                                setIsAnswerRevealed(false);
                              } else {
                                setIsReviewOpen(false);
                                alert('Review completed.');
                              }
                            }}
                            className="px-5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-600 rounded-xl text-xs font-semibold cursor-pointer ml-auto"
                          >
                            Skip card ›
                          </button>
                        )}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {/* Quick Add Mistake Dialog Modal overlay */}
      <QuickAddModal
        isOpen={isQuickAddOpen}
        onClose={() => setIsQuickAddOpen(false)}
        subjects={store.subjects}
        topics={store.topics}
        addSubject={store.addSubject}
        addTopic={store.addTopic}
        addMistake={store.addMistake}
        onNavigateToMistake={handleSelectMistake}
      />

      {/* Global Tab Navigation Footer */}
      <BottomNavBar
        currentView={currentView}
        onNavigate={handleNavigate}
      />
    </div>
  );
}
