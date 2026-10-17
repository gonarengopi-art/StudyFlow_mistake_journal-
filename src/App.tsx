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
import { AdminView } from './components/AdminView';
import { QuickAddModal } from './components/QuickAddModal';
import { LandingPage } from './components/LandingPage';
import { OnboardingModal } from './components/OnboardingModal';
import { NewsletterModal } from './components/NewsletterModal';
import { FreeTierPromoModal } from './components/FreeTierPromoModal';
import { LimitReachedModal } from './components/LimitReachedModal';
import { UpgradePremiumView } from './components/UpgradePremiumView';
import { LegalModal } from './components/LegalModal';
import { ReviewArenaModal } from './components/ReviewArenaModal';
import { HistoryLogModal } from './components/HistoryLogModal';
import { MistakeCategory } from './types';

import { Sparkles, Calendar, BookOpen, AlertCircle, X, ChevronRight, CheckCircle, GraduationCap, Eye, ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import { INITIAL_SUBJECTS, INITIAL_TOPICS, INITIAL_SUBTOPICS, INITIAL_MISTAKES } from './initialData';
import { safeSetItem } from './utils/storage';

export default function App() {
  const store = useJournalStore();

  const handleLogout = async () => {
    await store.logout();
  };

  const [currentView, setCurrentView] = useState<ViewTab>('dashboard');
  const [selectedMistakeId, setSelectedMistakeId] = useState<string | null>(null);
  const [isQuickAddOpen, setIsQuickAddOpen] = useState(false);
  const [isHistoryLogOpen, setIsHistoryLogOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isFreePromoOpen, setIsFreePromoOpen] = useState(false);
  const [isLimitReachedOpen, setIsLimitReachedOpen] = useState(false);

  const isNewsletterOpen = useMemo(() => {
    // Show only to logged-in users when they haven't set their preference yet
    if (!store.user) return false;
    if (store.loading) return false;
    if (!store.userDocData) return false;
    return store.userDocData.newsletterOptIn === undefined;
  }, [store.user, store.loading, store.userDocData]);
  
  // Custom user name persisted locally, defaulting to clean anonymous state
  const [userName, setUserName] = useState<string>(() => {
    return localStorage.getItem('studyflow_username') || 'New Scholar';
  });

  // Automatically trigger onboarding check when user accesses dashboard via google auth login
  useEffect(() => {
    if (store.user) {
      const onboarded = localStorage.getItem('studyflow_onboarded');
      if (onboarded !== 'true') {
        setIsOnboardingOpen(true);
      }
    }
  }, [store.user]);

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
  const [reviewFilterCategories, setReviewFilterCategories] = useState<MistakeCategory[]>([]);
  const [isReviewSetupActive, setIsReviewSetupActive] = useState<boolean>(true);
  const [includeMasteredInReview, setIncludeMasteredInReview] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [reviewLightboxImgUrl, setReviewLightboxImgUrl] = useState<string | null>(null);
  const [reviewLightboxZoom, setReviewLightboxZoom] = useState<number>(1);

  // Legal Policy Center state handlers
  const [isLegalModalOpen, setIsLegalModalOpen] = useState(false);
  const [legalModalTab, setLegalModalTab] = useState<'privacy' | 'terms'>('privacy');

  const handleOpenLegal = (tab: 'privacy' | 'terms') => {
    setLegalModalTab(tab);
    setIsLegalModalOpen(true);
  };

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
    safeSetItem('studyflow_username', userName);
  }, [userName]);

  // Handle Stripe Payment Redirect Success & Resilient Pending Upgrades
  useEffect(() => {
    const isPaymentSuccess = window.location.search.includes('payment=success') || window.location.href.includes('payment=success');
    if (isPaymentSuccess) {
      safeSetItem('studyflow_pending_premium', 'true');
      const newUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, document.title, newUrl);
    }

    const hasPendingUpgrade = localStorage.getItem('studyflow_pending_premium') === 'true';
    if (hasPendingUpgrade && store.user) {
      const autoUpgrade = async () => {
        try {
          await store.upgradeUserPremium(store.user.uid, true);
          localStorage.removeItem('studyflow_pending_premium');
          setCurrentView('upgrade');
        } catch (err) {
          console.error('Auto premium upgrade failed:', err);
        }
      };
      autoUpgrade();
    }
  }, [store.user]);

  // Helper to trigger navigation
  const handleNavigate = (view: ViewTab, targetSubjectId?: string) => {
    if (view === 'add' && !store.isPremium && !store.isAdmin && store.mistakes.length >= 50) {
      setIsLimitReachedOpen(true);
      return;
    }
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
  const handleStartQuickReview = (subjectId?: string, topicId?: string, categories?: MistakeCategory[]) => {
    setScratchpadText('');
    setIncludeMasteredInReview(false);
    setReviewFilterCategories(categories || []);
    
    if (subjectId) {
      setReviewFilterSubjectId(subjectId);
      if (topicId) {
        setReviewFilterTopicId(topicId);
        setIsReviewSetupActive(false); // Start instantly for a specific topic deeplink!
      } else {
        setReviewFilterTopicId('all');
        setIsReviewSetupActive(categories && categories.length > 0 ? false : true);
      }
    } else {
      setReviewFilterSubjectId('all');
      setReviewFilterTopicId('all');
      setIsReviewSetupActive(categories && categories.length > 0 ? false : true);
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
    safeSetItem('studyflow_subjects', JSON.stringify(INITIAL_SUBJECTS));
    safeSetItem('studyflow_topics', JSON.stringify(INITIAL_TOPICS));
    safeSetItem('studyflow_subtopics', JSON.stringify(INITIAL_SUBTOPICS));
    safeSetItem('studyflow_mistakes', JSON.stringify(INITIAL_MISTAKES));
    
    // Hard refresh window for complete clean memory reinstantiation
    window.location.reload();
  };

  const handleClearAllMemory = () => {
    safeSetItem('studyflow_subjects', JSON.stringify([]));
    safeSetItem('studyflow_topics', JSON.stringify([]));
    safeSetItem('studyflow_subtopics', JSON.stringify([]));
    safeSetItem('studyflow_mistakes', JSON.stringify([]));
    
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

  if (!store.user) {
    return (
      <>
        <LandingPage
          onSignInWithGoogle={store.signInWithGoogle}
          isLoading={store.loading}
          onOpenLegal={handleOpenLegal}
        />
        <LegalModal
          isOpen={isLegalModalOpen}
          onClose={() => setIsLegalModalOpen(false)}
          defaultTab={legalModalTab}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFCF8] text-[#1b1c1c] font-sans selection:bg-[#E6E1FF]">
      
      {/* Top App bar */}
      <Header
        userName={resolvedUserName}
        onNavigate={handleNavigate}
        onActivateSearch={handleGlobalSearchQuery}
        onOpenQuickAdd={() => {
          if (!store.isPremium && !store.isAdmin && store.mistakes.length >= 50) {
            setIsLimitReachedOpen(true);
          } else {
            setIsQuickAddOpen(true);
          }
        }}
        onOpenHistoryLog={() => setIsHistoryLogOpen(true)}
        userPhoto={store.user?.photoURL}
        isPremium={store.isPremium}
      />

      {/* Main Content Layout container */}
      <main className="max-w-7xl mx-auto px-4 md:px-8 pt-24 pb-32">
        {store.quotaExceeded && (
          <div className="bg-[#D98A6C]/10 border border-[#D98A6C]/30 p-4 rounded-2xl mb-6 text-sm text-[#2D2A26] flex flex-col md:flex-row md:items-center justify-between gap-4 animate-fade-in font-sans">
            <div className="flex items-start gap-3">
              <span className="p-1 px-2 bg-[#D98A6C] text-white rounded-md shrink-0 font-bold text-[10px] uppercase tracking-wider">
                QUOTA ALERT
              </span>
              <div className="space-y-1">
                <p className="font-semibold text-xs md:text-sm">
                  Firestore free daily read units quota exceeded for this shared sandbox.
                </p>
                <p className="text-xs text-[#6B6357] leading-relaxed">
                  Your cloud-synced folders may temporarily be offline, but you can still fully construct, view, and read your mistake journal locally as we fell back to your local browser cache. Synchronization will automatically restore in 24 hours.
                </p>
              </div>
            </div>
            <a
              href={`https://console.firebase.google.com/project/project-18702df5-f882-4fb9-a84/firestore/databases/ai-studio-6e96e46c-21fb-4566-98f5-1ac3ca997cff/data?openUpgradeDialog=true`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold uppercase tracking-widest rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 whitespace-nowrap shrink-0 hover:scale-[1.01]"
            >
              Upgrade / Review limits
            </a>
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
            onStartReview={handleStartQuickReview}
          />
        ) : (
          /* Normal Primary Tab Router Views */
          (() => {
            switch (currentView) {
              case 'dashboard':
                return (
                  <DashboardView
                    subjects={store.subjects}
                    topics={store.topics}
                    mistakes={store.mistakes}
                    onNavigate={handleNavigate}
                    onSelectMistake={handleSelectMistake}
                    onStartReview={handleStartQuickReview}
                    userName={resolvedUserName}
                    onOpenQuickAdd={() => {
                      if (!store.isPremium && !store.isAdmin && store.mistakes.length >= 50) {
                        setIsLimitReachedOpen(true);
                      } else {
                        setIsQuickAddOpen(true);
                      }
                    }}
                    onOpenOnboarding={() => setIsOnboardingOpen(true)}
                    quotaReads={store.quotaReads}
                    quotaLimit={store.quotaLimit}
                    isQuotaExceeded={store.isQuotaExceeded}
                    user={store.user}
                    isAdmin={store.isAdmin}
                    totalLiveReadsToday={store.totalLiveReadsToday}
                    allUsers={store.allUsers}
                    isPremium={store.isPremium}
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
                    isPremium={store.isPremium}
                    isAdmin={store.isAdmin}
                    mistakesCount={store.mistakes.length}
                    onNavigate={handleNavigate}
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
                    onOpenOnboarding={() => setIsOnboardingOpen(true)}
                    isPremium={store.isPremium}
                    onNavigate={handleNavigate}
                    onOpenLegal={handleOpenLegal}
                  />
                );
              case 'upgrade':
                return (
                  <UpgradePremiumView
                    user={store.user}
                    isPremium={store.isPremium}
                    upgradeUserPremium={store.upgradeUserPremium}
                    onSignInWithGoogle={store.signInWithGoogle}
                    isAdmin={store.isAdmin}
                  />
                );
              case 'admin':
                return (
                  <AdminView user={store.user} />
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

      {/* Immersive Full-Screen Gamified Review Arena */}
      {isReviewOpen && (
        <ReviewArenaModal
          isOpen={isReviewOpen}
          onClose={() => setIsReviewOpen(false)}
          subjects={store.subjects}
          topics={store.topics}
          subtopics={store.subtopics}
          mistakes={store.mistakes}
          editMistake={store.editMistake}
          initialSubjectId={reviewFilterSubjectId}
          initialTopicId={reviewFilterTopicId}
          initialCategories={reviewFilterCategories}
          isPremium={store.isPremium}
          isAdmin={store.isAdmin}
          onNavigate={handleNavigate}
        />
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
        isPremium={store.isPremium}
        isAdmin={store.isAdmin}
        mistakesCount={store.mistakes.length}
        onNavigate={handleNavigate}
      />

      {/* Interactive History Log Modal */}
      <HistoryLogModal
        isOpen={isHistoryLogOpen}
        onClose={() => setIsHistoryLogOpen(false)}
        subjects={store.subjects}
        topics={store.topics}
        mistakes={store.mistakes}
        onSelectMistake={handleSelectMistake}
      />

      {/* Interactive Onboarding Tutorial Modal overlay for new users */}
      <OnboardingModal
        isOpen={isOnboardingOpen}
        onClose={() => setIsOnboardingOpen(false)}
        userName={resolvedUserName}
        setUserName={setUserName}
        addSubject={store.addSubject}
        addTopic={store.addTopic}
        currentView={currentView}
        onNavigate={handleNavigate}
        subjects={store.subjects}
        topics={store.topics}
        mistakes={store.mistakes}
        isReviewOpen={isReviewOpen}
      />

      {/* Newsletter opt-in modal prompt for registered logged-in users */}
      <NewsletterModal
        isOpen={isNewsletterOpen}
        onClose={() => store.updateNewsletterPreference(false)}
        onSubscribe={(optIn) => store.updateNewsletterPreference(optIn)}
        userEmail={store.user?.email || 'N/A'}
      />

      {/* Welcome popup banner comparing Free Tier vs Lifetime Supporter for free tier logged-in users */}
      <FreeTierPromoModal
        isOpen={isFreePromoOpen}
        onClose={() => setIsFreePromoOpen(false)}
        onUpgrade={() => handleNavigate('upgrade')}
        mistakesCount={store.mistakes.length}
      />

      {/* Limit Reached Warning Modal */}
      <LimitReachedModal
        isOpen={isLimitReachedOpen}
        onClose={() => setIsLimitReachedOpen(false)}
        onViewPerks={() => {
          setIsLimitReachedOpen(false);
          setIsFreePromoOpen(true);
        }}
        mistakesCount={store.mistakes.length}
      />

      {/* Fullscreen Photo Lightbox overlay inside Review Sessions */}
      {reviewLightboxImgUrl && (
        <div className="fixed inset-0 bg-[#2D2A26]/95 backdrop-blur-md flex flex-col z-[210] select-none animate-fade-in font-sans">
          {/* Header toolbar */}
          <div className="flex items-center justify-between p-4 bg-[#2D2A26]/80 border-b border-[#E8E2D9]/10 text-white">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#D98A6C]">Review Fullscreen Viewer</span>
              <h4 className="text-xs font-serif font-bold text-[#FDFCF8] max-w-[200px] md:max-w-md line-clamp-1">Active Recall Reference Image</h4>
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={() => setReviewLightboxZoom(prev => Math.max(0.5, prev - 0.25))}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <span className="text-[10px] md:text-xs font-mono font-bold text-[#9A9184] min-w-[32px] md:min-w-[40px] text-center">
                {Math.round(reviewLightboxZoom * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setReviewLightboxZoom(prev => Math.min(4, prev + 0.25))}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setReviewLightboxZoom(1)}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              
              <div className="w-[1px] h-5 bg-[#E8E2D9]/10 mx-0.5 md:mx-1"></div>
              
              <button
                type="button"
                onClick={() => setReviewLightboxImgUrl(null)}
                className="p-1.5 md:p-2 bg-red-600/20 hover:bg-red-600 text-red-400 hover:text-white rounded-lg transition-colors cursor-pointer flex items-center justify-center font-bold"
                title="Close Fullscreen"
              >
                <X className="w-4 h-4 md:w-5 md:h-5" />
              </button>
            </div>
          </div>
          
          {/* Main viewing area */}
          <div 
            className="flex-1 w-full overflow-auto flex items-center justify-center p-4 relative cursor-zoom-out"
            onClick={() => setReviewLightboxImgUrl(null)}
          >
            <div 
              className="transition-transform duration-200 ease-out origin-center select-none"
              style={{ transform: `scale(${reviewLightboxZoom})` }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={reviewLightboxImgUrl}
                alt="Fullscreen Reference"
                className="max-h-[75vh] max-w-full md:max-h-[80vh] object-contain rounded-lg border border-[#E8E2D9]/20 shadow-2xl pointer-events-auto"
                style={{ cursor: reviewLightboxZoom > 1 ? 'grab' : 'zoom-in' }}
                onClick={() => {
                  // Click image to toggle zoom
                  if (reviewLightboxZoom === 1) {
                    setReviewLightboxZoom(1.75);
                  } else {
                    setReviewLightboxZoom(1);
                  }
                }}
              />
            </div>
          </div>
          
          {/* Footer usage tip */}
          <div className="p-2.5 bg-[#2D2A26] text-center text-[9px] font-sans font-medium text-[#9A9184]/70 border-t border-[#E8E2D9]/5">
            Tip: Use the zoom buttons, scroll/swipe, or click the image to toggle scale. Click backdrop to exit.
          </div>
        </div>
      )}

      {/* Global Legal Policy Center Modal Overlay */}
      <LegalModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
        defaultTab={legalModalTab}
      />

      {/* Global Tab Navigation Footer */}
      <BottomNavBar
        currentView={currentView}
        onNavigate={handleNavigate}
        isAdmin={store.user?.email === 'gonarengopi@gmail.com'}
      />
    </div>
  );
}
