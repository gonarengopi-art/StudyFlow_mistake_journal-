import React, { useState, useEffect, useMemo, useRef } from 'react';
import { 
  X, 
  GraduationCap, 
  Trophy, 
  Zap, 
  Flame, 
  Volume2, 
  VolumeX, 
  Eye, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw, 
  ChevronRight, 
  ChevronLeft, 
  Maximize2, 
  Sparkles,
  Timer,
  Play,
  Heart,
  BookOpen,
  Award,
  Check,
  Compass,
  ArrowRight,
  Share2,
  Download,
  Copy,
  ExternalLink
} from 'lucide-react';
import { MistakeEntry, Subject, Topic, Subtopic, MistakeCategory } from '../types';
import { AiClonePracticeModal } from './AiClonePracticeModal';
import { copyToClipboard } from '../utils/clipboard';
import { safeSetItem } from '../utils/storage';

// Native Web Audio synth engine for rewarding chimes without external assets
const playSound = (type: 'success' | 'reveal' | 'complete' | 'streak' | 'error', isMuted: boolean) => {
  if (isMuted) return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    
    if (type === 'success') {
      // Nice happy major chime (two rising notes)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.08); // E5
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } else if (type === 'reveal') {
      // Soft high sparkle chime
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(440, ctx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.12); // A5
      
      gain.gain.setValueAtTime(0.05, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'streak') {
      // Dual-oscillator arcade upgrade chirp
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);
      
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc1.frequency.setValueAtTime(880.00, ctx.currentTime + 0.06); // A5
      
      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(1174.66, ctx.currentTime); // D6
      
      gain.gain.setValueAtTime(0.06, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + 0.22);
      
      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.22);
      osc2.stop(ctx.currentTime + 0.22);
    } else if (type === 'error') {
      // Soft feedback bonk
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(220, ctx.currentTime); // A3
      osc.frequency.linearRampToValueAtTime(180, ctx.currentTime + 0.15);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.18);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.18);
    } else if (type === 'complete') {
      // Magnificent major arpeggio fanfare!
      const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 1046.50]; // C4, E4, G4, C5, E5, C6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.07);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + i * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.005, ctx.currentTime + i * 0.07 + 0.35);
        osc.start(ctx.currentTime + i * 0.07);
        osc.stop(ctx.currentTime + i * 0.07 + 0.35);
      });
    }
  } catch (err) {
    console.warn('Audio synthesis failed', err);
  }
};

interface ReviewArenaModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  mistakes: MistakeEntry[];
  editMistake: (id: string, updates: Partial<MistakeEntry>) => Promise<void>;
  initialSubjectId?: string;
  initialTopicId?: string;
  initialCategories?: MistakeCategory[];
  isPremium: boolean;
  isAdmin: boolean;
  onNavigate: (view: any) => void;
}

interface Particle {
  id: number;
  text: string;
  x: number;
  y: number;
  colorClass: string;
}

export function ReviewArenaModal({
  isOpen,
  onClose,
  subjects,
  topics,
  subtopics,
  mistakes,
  editMistake,
  initialSubjectId = 'all',
  initialTopicId = 'all',
  initialCategories = [],
  isPremium,
  isAdmin,
  onNavigate,
}: ReviewArenaModalProps) {
  // Setup variables
  const [reviewFilterSubjectId, setReviewFilterSubjectId] = useState<string>(initialSubjectId);
  const [reviewFilterTopicId, setReviewFilterTopicId] = useState<string>(initialTopicId);
  const [reviewFilterCategories, setReviewFilterCategories] = useState<MistakeCategory[]>(initialCategories);
  const [includeMasteredInReview, setIncludeMasteredInReview] = useState<boolean>(false);
  const [isSetupActive, setIsSetupActive] = useState<boolean>(true);

  // Active game session states
  const [showQuitConfirm, setShowQuitConfirm] = useState<boolean>(false);
  const [isShareModalOpen, setIsShareModalOpen] = useState<boolean>(false);
  const [badgeCopySuccess, setBadgeCopySuccess] = useState<boolean>(false);
  const [isBadgeDownloading, setIsBadgeDownloading] = useState<boolean>(false);
  const [reviewIndex, setReviewIndex] = useState<number>(0);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState<boolean>(false);
  const [scratchpadText, setScratchpadText] = useState<string>('');
  const [aiCloneCard, setAiCloneCard] = useState<MistakeEntry | null>(null);
  const [isMuted, setIsMuted] = useState<boolean>(() => {
    return localStorage.getItem('studyflow_arena_muted') === 'true';
  });
  
  // Theme state: 'cyberpunk' | 'scholar' | 'minimal'
  const [arenaTheme, setArenaTheme] = useState<'cyberpunk' | 'scholar' | 'minimal'>(() => {
    return (localStorage.getItem('studyflow_arena_theme') as any) || 'scholar';
  });

  // Photo viewer lightbox
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [activeImgIndex, setActiveImgIndex] = useState<number>(0);

  // Reset active image index when card changes
  useEffect(() => {
    setActiveImgIndex(0);
  }, [reviewIndex]);

  // Gamification metrics
  const [sessionXp, setSessionXp] = useState<number>(0);
  const [comboStreak, setComboStreak] = useState<number>(0);
  const [maxComboStreak, setMaxComboStreak] = useState<number>(0);
  const [isScreenShaking, setIsScreenShaking] = useState<boolean>(false);
  const [floatingParticles, setFloatingParticles] = useState<Particle[]>([]);
  const [sessionSeconds, setSessionSeconds] = useState<number>(0);
  const [isFinished, setIsFinished] = useState<boolean>(false);
  
  // Track mastery outcomes for session evaluation
  const [cardHistory, setCardHistory] = useState<Array<{ title: string; outcome: 'Mastered' | 'Reviewing' | 'New' }>>([]);

  // Particle counter
  const particleIdCounter = useRef(0);

  // Timer Ref
  const timerIntervalRef = useRef<any>(null);

  // Sync initial parameters on change
  useEffect(() => {
    if (isOpen) {
      setReviewFilterSubjectId(initialSubjectId);
      setReviewFilterTopicId(initialTopicId);
      setReviewFilterCategories(initialCategories);
      const hasCategories = initialCategories && initialCategories.length > 0;
      setIsSetupActive(hasCategories ? false : (initialSubjectId === 'all' || initialTopicId === 'all'));
      setReviewIndex(0);
      setIsAnswerRevealed(false);
      setScratchpadText('');
      setSessionXp(0);
      setComboStreak(0);
      setMaxComboStreak(0);
      setSessionSeconds(0);
      setIsFinished(false);
      setCardHistory([]);
      setShowQuitConfirm(false);
      setIsShareModalOpen(false);
      setBadgeCopySuccess(false);
      setIsBadgeDownloading(false);
    }
  }, [isOpen, initialSubjectId, initialTopicId, initialCategories]);

  // Persist preferences
  useEffect(() => {
    safeSetItem('studyflow_arena_muted', String(isMuted));
  }, [isMuted]);

  useEffect(() => {
    safeSetItem('studyflow_arena_theme', arenaTheme);
  }, [arenaTheme]);

  // Start & stop timer based on session state
  useEffect(() => {
    if (isOpen && !isSetupActive && !isFinished) {
      timerIntervalRef.current = setInterval(() => {
        setSessionSeconds(prev => prev + 1);
      }, 1000);
    } else {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    }
    return () => {
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
    };
  }, [isOpen, isSetupActive, isFinished]);

  // Derive filtered mistakes
  const targetMistakes = useMemo(() => {
    let list = mistakes;
    if (!includeMasteredInReview) {
      list = list.filter((m) => m.status !== 'Mastered');
    }
    if (reviewFilterSubjectId !== 'all') {
      list = list.filter((m) => m.subjectId === reviewFilterSubjectId);
    }
    if (reviewFilterTopicId !== 'all') {
      list = list.filter((m) => m.topicId === reviewFilterTopicId);
    }
    if (reviewFilterCategories && reviewFilterCategories.length > 0) {
      list = list.filter((m) => m.categories.some((cat) => reviewFilterCategories.includes(cat)));
    }
    return list;
  }, [mistakes, reviewFilterSubjectId, reviewFilterTopicId, reviewFilterCategories, includeMasteredInReview, isSetupActive]);

  // Active recall card
  const currentMistake = targetMistakes[reviewIndex];

  // Automated keyword analysis system to make writing feel like an active word game
  const matchedKeywords = useMemo(() => {
    if (!currentMistake || !scratchpadText.trim()) return [];
    
    // Extract key words/phrases of length > 3 from correct answer or correct explanation
    const referenceText = `${currentMistake.correctAnswer || ''} ${currentMistake.correctExplanation || ''}`.toLowerCase();
    
    // Normalize scratchpad
    const typedWords = scratchpadText.toLowerCase().replace(/[.,/#!$%^&*;:{}=\-_`~()?"']/g, "").split(/\s+/);
    
    // Look for technical terms or exact word matches that are meaningful (> 3 characters)
    const matchesSet = new Set<string>();
    typedWords.forEach(word => {
      if (word.length > 3 && referenceText.includes(word)) {
        matchesSet.add(word);
      }
    });
    
    return Array.from(matchesSet).slice(0, 5); // display top 5
  }, [currentMistake, scratchpadText]);

  // Trigger screen shake on big streak or mastery
  const triggerScreenShake = () => {
    setIsScreenShaking(true);
    setTimeout(() => {
      setIsScreenShaking(false);
    }, 450);
  };

  // Add floating points text at a random or offset position
  const spawnParticle = (text: string, colorClass: string = 'text-amber-500') => {
    const id = ++particleIdCounter.current;
    const newParticle: Particle = {
      id,
      text,
      x: 35 + Math.random() * 30, // center-ish percentage
      y: 40 + Math.random() * 20,
      colorClass
    };
    setFloatingParticles(prev => [...prev, newParticle]);
    setTimeout(() => {
      setFloatingParticles(prev => prev.filter(p => p.id !== id));
    }, 1500);
  };

  // Format active timers
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle active answer submission outcome
  const handleAnswerOutcome = async (outcome: 'Mastered' | 'Reviewing' | 'New') => {
    if (!currentMistake) return;

    let xpGain = 0;
    let particlesText = '';
    let particleColor = 'text-orange-400';

    if (outcome === 'Mastered') {
      // Mastery gains base XP + Combo multipliers
      const nextStreak = comboStreak + 1;
      setComboStreak(nextStreak);
      if (nextStreak > maxComboStreak) {
        setMaxComboStreak(nextStreak);
      }

      const streakBonus = nextStreak > 1 ? (nextStreak - 1) * 5 : 0;
      xpGain = 15 + streakBonus;
      particlesText = `+15 XP${streakBonus > 0 ? ` +${streakBonus} STREAK!` : ''}`;
      particleColor = 'text-emerald-400';
      
      playSound('success', isMuted);
      if (nextStreak % 3 === 0) {
        playSound('streak', isMuted);
        triggerScreenShake();
        spawnParticle(`🔥 COMBO x${nextStreak}!`, 'text-orange-500 font-extrabold text-lg');
      }
    } else {
      // Partial completion or still unresolved
      setComboStreak(0); // break combo
      if (outcome === 'Reviewing') {
        xpGain = 8;
        particlesText = '+8 XP (Studying)';
        particleColor = 'text-amber-400';
        playSound('reveal', isMuted);
      } else {
        xpGain = 3;
        particlesText = '+3 XP (Retry)';
        particleColor = 'text-red-400';
        playSound('error', isMuted);
      }
    }

    // Add optional bonus for matched keywords
    if (matchedKeywords.length > 0) {
      const keywordBonus = matchedKeywords.length * 2;
      xpGain += keywordBonus;
      setTimeout(() => {
        spawnParticle(`✨ Keywords matched: +${keywordBonus} XP`, 'text-cyan-400 font-bold');
      }, 400);
    }

    setSessionXp(prev => prev + xpGain);
    spawnParticle(particlesText, particleColor);

    // Save record to local card history
    setCardHistory(prev => [...prev, {
      title: currentMistake.title,
      outcome
    }]);

    // Perform database/store edit
    try {
      await editMistake(currentMistake.id, { status: outcome });
    } catch (e) {
      console.error(e);
    }

    // Reset inputs & proceed
    setScratchpadText('');
    setIsAnswerRevealed(false);

    if (reviewIndex + 1 < targetMistakes.length) {
      setReviewIndex(prev => prev + 1);
    } else {
      // Session finished!
      setIsFinished(true);
      playSound('complete', isMuted);
    }
  };

  const handleSkipCard = () => {
    setScratchpadText('');
    setIsAnswerRevealed(false);
    setComboStreak(0);
    playSound('error', isMuted);
    
    if (reviewIndex + 1 < targetMistakes.length) {
      setReviewIndex(prev => prev + 1);
    } else {
      setIsFinished(true);
      playSound('complete', isMuted);
    }
  };

  // Generate rewarding rank or tier badge based on performance
  const scoreBadge = useMemo(() => {
    if (cardHistory.length === 0) return { name: 'Novice Monk', color: 'border-stone-200 text-stone-500' };
    const masteredCount = cardHistory.filter(h => h.outcome === 'Mastered').length;
    const ratio = masteredCount / cardHistory.length;
    
    if (ratio >= 0.9) return { name: 'Fidelity Sage 🏆', color: 'border-amber-400 text-amber-600 bg-amber-50/50' };
    if (ratio >= 0.6) return { name: 'Recall Sentinel 🛡️', color: 'border-cyan-300 text-cyan-700 bg-cyan-50/50' };
    if (ratio >= 0.3) return { name: 'Persistence Champion ⚡', color: 'border-[#D98A6C] text-[#C17A5E] bg-orange-50/50' };
    return { name: 'Resilient Scholar 🌱', color: 'border-stone-400 text-stone-600 bg-stone-50/50' };
  }, [cardHistory]);

  const badgeTheme = useMemo(() => {
    const masteredCount = cardHistory.filter(h => h.outcome === 'Mastered').length;
    const ratio = cardHistory.length > 0 ? masteredCount / cardHistory.length : 0;

    if (ratio >= 0.9) {
      return {
        text: 'text-amber-400',
        border: 'border-amber-400/40',
        glow: 'shadow-amber-500/10 bg-amber-500/5',
        accentBg: 'bg-amber-400',
        accentText: 'text-amber-400',
        ring: 'ring-amber-400/30',
        emoji: '🏆',
        title: 'FIDELITY SAGE',
        description: 'Achieved flawless active recall mastery with ≥90% accuracy! Your retention is legendary.'
      };
    } else if (ratio >= 0.6) {
      return {
        text: 'text-cyan-400',
        border: 'border-cyan-400/40',
        glow: 'shadow-cyan-500/10 bg-cyan-500/5',
        accentBg: 'bg-cyan-400',
        accentText: 'text-cyan-400',
        ring: 'ring-cyan-400/30',
        emoji: '🛡️',
        title: 'RECALL SENTINEL',
        description: 'Stellar retention and vigilant recall efficiency with ≥60% accuracy. A true shield against forgetting!'
      };
    } else if (ratio >= 0.3) {
      return {
        text: 'text-orange-400',
        border: 'border-orange-400/40',
        glow: 'shadow-orange-500/10 bg-orange-500/5',
        accentBg: 'bg-orange-400',
        accentText: 'text-orange-400',
        ring: 'ring-orange-400/30',
        emoji: '⚡',
        title: 'PERSISTENCE CHAMPION',
        description: 'Determined repetition and strong study streak focus with ≥30% accuracy. Keep pushing your limits!'
      };
    } else {
      return {
        text: 'text-emerald-400',
        border: 'border-emerald-400/40',
        glow: 'shadow-emerald-500/10 bg-emerald-500/5',
        accentBg: 'bg-emerald-400',
        accentText: 'text-emerald-400',
        ring: 'ring-emerald-400/30',
        emoji: '🌱',
        title: 'RESILIENT SCHOLAR',
        description: 'Embraced the power of learning from mistakes. Every incorrect answer builds a stronger neural pathway!'
      };
    }
  }, [cardHistory]);

  const sharePerformance = () => {
    setIsShareModalOpen(true);
    setBadgeCopySuccess(false);
  };

  const handleCopyShareText = async () => {
    const masteredCount = cardHistory.filter(h => h.outcome === 'Mastered').length;
    const accuracy = cardHistory.length > 0 ? Math.round((masteredCount / cardHistory.length) * 100) : 0;
    const shareText = `🏆 StudyFlow Mistake Recall Arena: Conquered a deck of ${cardHistory.length} cards!\n⚡ Rank achieved: ${scoreBadge.name}\n🔥 Max Flame Streak: ${maxComboStreak}x\n✨ Total XP Earned: ${sessionXp} XP\n📈 Mastery Score: ${accuracy}%!\nAccelerating active recall mastery with offline-first precision!`;

    const success = await copyToClipboard(shareText);
    if (success) {
      setBadgeCopySuccess(true);
      spawnParticle('📋 Copied statistics to clipboard!', 'text-emerald-400 font-sans font-bold');
      setTimeout(() => setBadgeCopySuccess(false), 2000);
    }
  };

  const handleNativeShare = async () => {
    const masteredCount = cardHistory.filter(h => h.outcome === 'Mastered').length;
    const accuracy = cardHistory.length > 0 ? Math.round((masteredCount / cardHistory.length) * 100) : 0;
    const shareText = `🏆 StudyFlow Mistake Recall Arena: Conquered a deck of ${cardHistory.length} cards!\n⚡ Rank achieved: ${scoreBadge.name}\n🔥 Max Flame Streak: ${maxComboStreak}x\n✨ Total XP Earned: ${sessionXp} XP\n📈 Mastery Score: ${accuracy}%!\nAccelerating active recall mastery with offline-first precision!`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'My StudyFlow recall milestone!',
          text: shareText,
          url: window.location.origin
        });
        spawnParticle('🎉 Shared successfully!', 'text-emerald-400 font-sans font-bold');
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyShareText();
    }
  };

  const handleDownloadBadge = () => {
    setIsBadgeDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const masteredCount = cardHistory.filter(h => h.outcome === 'Mastered').length;
      const accuracy = cardHistory.length > 0 ? Math.round((masteredCount / cardHistory.length) * 100) : 0;

      // Draw dark background gradient
      const bgGrad = ctx.createRadialGradient(300, 300, 50, 300, 300, 420);
      bgGrad.addColorStop(0, '#1c152d');
      bgGrad.addColorStop(1, '#09070c');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 600);

      // Determine rank theme colors
      let themeColor = '#D98A6C';
      let emoji = '🌱';
      let title = 'RESILIENT SCHOLAR';
      const ratio = cardHistory.length > 0 ? masteredCount / cardHistory.length : 0;
      
      if (ratio >= 0.9) {
        themeColor = '#F59E0B';
        emoji = '🏆';
        title = 'FIDELITY SAGE';
      } else if (ratio >= 0.6) {
        themeColor = '#06B6D4';
        emoji = '🛡️';
        title = 'RECALL SENTINEL';
      } else if (ratio >= 0.3) {
        themeColor = '#F97316';
        emoji = '⚡';
        title = 'PERSISTENCE CHAMPION';
      }

      // Draw metallic framing
      ctx.strokeStyle = themeColor + '44';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 560, 560);
      
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(25, 25, 550, 550);

      // Draw subtle background grid
      ctx.strokeStyle = '#ffffff04';
      ctx.lineWidth = 1;
      for (let i = 50; i < 600; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 30);
        ctx.lineTo(i, 570);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(30, i);
        ctx.lineTo(570, i);
        ctx.stroke();
      }

      // Draw glowing circular shield
      ctx.shadowColor = themeColor;
      ctx.shadowBlur = 30;
      
      ctx.beginPath();
      ctx.arc(300, 180, 75, 0, Math.PI * 2);
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.shadowBlur = 10;
      ctx.beginPath();
      ctx.arc(300, 180, 68, 0, Math.PI * 2);
      ctx.strokeStyle = '#ffffff22';
      ctx.lineWidth = 1.5;
      ctx.stroke();
      
      ctx.fillStyle = '#00000044';
      ctx.fill();

      ctx.shadowBlur = 0;

      // Draw big emoji inside shield
      ctx.font = '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(emoji, 300, 180);

      // Draw title text
      ctx.fillStyle = '#ffffff88';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('STUDYFLOW ACTIVE RECALL ARENA', 300, 65);

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(title, 300, 290);
      
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText('HONORARY PERFORMANCE BADGE', 300, 315);

      // Draw divider line
      ctx.strokeStyle = '#ffffff15';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 340);
      ctx.lineTo(500, 340);
      ctx.stroke();

      // Draw 2x2 stats grid
      const boxes = [
        { label: 'CARDS STUDIED', value: `${cardHistory.length}` },
        { label: 'MASTERY SCORE', value: `${accuracy}%` },
        { label: 'PEAK STREAK', value: `${maxComboStreak}x` },
        { label: 'XP POINTS GAINED', value: `+${sessionXp} XP` }
      ];

      const drawBox = (x: number, y: number, label: string, val: string) => {
        ctx.fillStyle = '#ffffff04';
        ctx.fillRect(x - 90, y - 10, 180, 55);
        ctx.strokeStyle = '#ffffff0d';
        ctx.lineWidth = 1;
        ctx.strokeRect(x - 90, y - 10, 180, 55);

        ctx.fillStyle = '#ffffff66';
        ctx.font = 'bold 8px sans-serif';
        ctx.fillText(label, x, y + 10);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 18px sans-serif';
        ctx.fillText(val, x, y + 33);
      };

      drawBox(200, 365, boxes[0].label, boxes[0].value);
      drawBox(400, 365, boxes[1].label, boxes[1].value);
      drawBox(200, 445, boxes[2].label, boxes[2].value);
      drawBox(400, 445, boxes[3].label, boxes[3].value);

      // Footer
      ctx.fillStyle = '#ffffff44';
      ctx.font = '9px sans-serif';
      const studyDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillText(`Conquered on ${studyDate}`, 300, 535);

      ctx.fillStyle = themeColor + 'aa';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('VERIFIED MEMORY ACHiEVEMENT', 300, 555);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `StudyFlow_Badge_${title.replace(' ', '_')}.png`;
      link.href = dataUrl;
      link.click();
      spawnParticle('✨ Badge downloaded successfully!', 'text-amber-400 font-sans font-bold');
    } catch (err) {
      console.error(err);
      spawnParticle('❌ Failed to download badge', 'text-red-400 font-sans');
    } finally {
      setIsBadgeDownloading(false);
    }
  };

  // Define Theme Class mapping
  const themeClasses = {
    cyberpunk: {
      bg: 'bg-[#0D0B12] text-stone-100',
      panel: 'bg-[#181524] border-[#2C2442] shadow-cyan-950/20',
      textMain: 'text-stone-100',
      textMuted: 'text-[#8E86A8]',
      inputBg: 'bg-[#1D192D] border-[#362D55] text-stone-100 focus:ring-[#E07A5F] focus:border-[#E07A5F]',
      badgeAccent: 'bg-[#E07A5F]/20 text-[#E07A5F] border-[#E07A5F]/40',
      badgeSuccess: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      primaryBtn: 'bg-[#E07A5F] hover:bg-[#C9694F] text-white',
      secondaryBtn: 'bg-[#1D192D] hover:bg-[#25203A] text-[#8E86A8] border border-[#362D55]',
      cardBg: 'bg-[#14121E] border-[#25203D]',
      accentText: 'text-[#E07A5F]',
    },
    scholar: {
      bg: 'bg-[#1E1C1A] text-[#F5F2ED]',
      panel: 'bg-[#2A2724] border-[#423C36] shadow-stone-950/40',
      textMain: 'text-[#F5F2ED]',
      textMuted: 'text-[#B8AF9E]',
      inputBg: 'bg-[#211F1D] border-[#4A433A] text-[#FDFCF8] focus:ring-[#D98A6C] focus:border-[#D98A6C]',
      badgeAccent: 'bg-[#D98A6C]/25 text-[#D98A6C] border-[#D98A6C]/40',
      badgeSuccess: 'bg-[#8DA38A]/25 text-[#8DA38A] border-[#8DA38A]/40',
      primaryBtn: 'bg-[#D98A6C] hover:bg-[#C17A5E] text-[#FDFCF8]',
      secondaryBtn: 'bg-[#2E2A26] hover:bg-[#38332E] text-[#B8AF9E] border border-[#4A433A]',
      cardBg: 'bg-[#22201E] border-[#3D3730]',
      accentText: 'text-[#D98A6C]',
    },
    minimal: {
      bg: 'bg-[#000000] text-stone-100',
      panel: 'bg-[#0F0F11] border-[#222226]',
      textMain: 'text-stone-100',
      textMuted: 'text-[#8E8E93]',
      inputBg: 'bg-[#18181C] border-[#2D2D34] text-white focus:ring-stone-400 focus:border-stone-400',
      badgeAccent: 'bg-white/10 text-white border-white/20',
      badgeSuccess: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      primaryBtn: 'bg-white hover:bg-stone-200 text-black',
      secondaryBtn: 'bg-[#1C1C1E] hover:bg-[#2C2C2E] text-[#8E8E93] border border-[#2D2D34]',
      cardBg: 'bg-[#0A0A0C] border-[#1C1C1F]',
      accentText: 'text-white',
    }
  };

  const currentTheme = themeClasses[arenaTheme] || themeClasses.scholar;

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-[120] flex flex-col ${currentTheme.bg} transition-colors duration-300 font-sans select-none overflow-hidden ${isScreenShaking ? 'animate-shake' : ''}`}>
      
      {/* Floating Sparkles & Particles Canvas Overlay */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
        {floatingParticles.map(p => (
          <div 
            key={p.id}
            className={`absolute pointer-events-none text-sm font-black tracking-wide font-sans animate-float-fade-up ${p.colorClass}`}
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
          >
            {p.text}
          </div>
        ))}
      </div>

      {/* Header bar */}
      <header className={`px-6 py-4 border-b ${currentTheme.panel} flex justify-between items-center z-20`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-xl ${currentTheme.secondaryBtn} flex items-center justify-center`}>
            <GraduationCap className={`w-6 h-6 ${currentTheme.accentText} animate-bounce`} />
          </div>
          <div>
            <span className={`text-[10px] uppercase font-bold tracking-widest ${currentTheme.accentText} block`}>
              MISTAKE RECALL ARENA
            </span>
            <h1 className="font-serif text-lg font-bold leading-tight">
              {isSetupActive ? 'Configure Training Grid' : isFinished ? 'Performance Evaluation' : `Training Matrix Active`}
            </h1>
          </div>
        </div>

        {/* Dashboard parameters */}
        <div className="flex items-center gap-2.5 sm:gap-4">
          
          {/* Theme switcher */}
          <div className="hidden md:flex items-center gap-1.5 p-1 rounded-full bg-black/30 border border-[#E8E2D9]/10">
            {(['scholar', 'cyberpunk', 'minimal'] as const).map(theme => (
              <button
                key={theme}
                onClick={() => setArenaTheme(theme)}
                className={`px-3 py-1 text-[10px] font-bold uppercase rounded-full transition-all cursor-pointer ${arenaTheme === theme ? 'bg-[#D98A6C] text-[#FDFCF8]' : 'text-stone-400 hover:text-white'}`}
              >
                {theme}
              </button>
            ))}
          </div>

          {/* Sound switch */}
          <button
            onClick={() => {
              setIsMuted(!isMuted);
              playSound('reveal', !isMuted);
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer ${currentTheme.secondaryBtn}`}
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? <VolumeX className="w-4.5 h-4.5 text-red-400" /> : <Volume2 className={`w-4.5 h-4.5 ${currentTheme.accentText}`} />}
          </button>

          {/* Exit / Cross */}
          <button
            onClick={() => {
              if (!isSetupActive && !isFinished) {
                setShowQuitConfirm(true);
              } else {
                onClose();
              }
            }}
            className={`p-2 rounded-xl transition-all cursor-pointer text-stone-400 hover:text-white ${currentTheme.secondaryBtn}`}
            title="Quit Practice Session"
          >
            <X className="w-5 h-5" />
          </button>

        </div>
      </header>

      {/* Main Container workspace */}
      <main className="flex-1 flex flex-col md:grid md:grid-cols-4 gap-6 p-4 sm:p-6 overflow-hidden max-w-7xl mx-auto w-full z-20">
        
        {/* Left Side: Dynamic HUD Statistics panel */}
        <section className="col-span-1 flex flex-row md:flex-col gap-4 overflow-x-auto md:overflow-visible">
          
          {/* Status block A: Level and XP progress tracker */}
          <div className={`flex-1 min-w-[200px] md:w-full p-5 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className={`text-[10px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>Session Accumulation</span>
                  <h3 className="text-2xl font-serif font-black">{sessionXp} <span className="text-xs font-mono font-bold text-amber-500">XP</span></h3>
                </div>
                <div className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${currentTheme.badgeAccent}`}>
                  Lvl {Math.floor(sessionXp / 50) + 1}
                </div>
              </div>

              {/* Progress Bar to next level */}
              <div className="space-y-1.5 mt-2">
                <div className={`w-full h-2 rounded-full bg-black/40 overflow-hidden`}>
                  <div 
                    className="h-full bg-gradient-to-r from-amber-400 to-[#D98A6C] transition-all duration-350"
                    style={{ width: `${(sessionXp % 50) * 2}%` }}
                  />
                </div>
                <div className="flex justify-between text-[9px] font-mono font-bold text-stone-400">
                  <span>NEXT LEVEL</span>
                  <span>{sessionXp % 50} / 50 XP</span>
                </div>
              </div>
            </div>

            <div className="hidden md:block pt-3 border-t border-[#E8E2D9]/10 text-[10px] text-stone-400">
              ⚡ Mastery of any card yields <strong className="text-white">15 XP</strong>, studying yields <strong className="text-white">8 XP</strong>. Keep consecutive masteries active for big combo bonuses!
            </div>
          </div>

          {/* Status block B: Flame combo streak meter */}
          <div className={`flex-1 min-w-[180px] md:w-full p-5 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between relative overflow-hidden`}>
            <div className="flex justify-between items-start">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>Combo Streak multiplier</span>
                <h3 className="text-3xl font-black flex items-center gap-1">
                  {comboStreak}x 
                  {comboStreak > 0 && <span className="text-xs text-orange-400 font-sans tracking-wide uppercase font-black animate-pulse">FLAME</span>}
                </h3>
              </div>
              <div className={`p-2.5 rounded-full ${comboStreak > 0 ? 'bg-orange-500/20 text-orange-400 animate-pulse' : 'bg-black/30 text-stone-500'}`}>
                <Flame className={`w-6 h-6 ${comboStreak > 0 ? 'scale-110' : ''}`} />
              </div>
            </div>

            {/* Micro instructions */}
            <div className="mt-2 text-[10px] text-stone-400">
              <div className="flex justify-between text-[9px] font-mono mb-1">
                <span>PEAK CONSECUTIVE:</span>
                <span className="text-amber-500 font-bold">{maxComboStreak}x</span>
              </div>
              <div className="w-full h-1 bg-black/40 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-orange-400 transition-all duration-500"
                  style={{ width: `${Math.min(100, (comboStreak / 5) * 100)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Status block C: Gamified clock timers */}
          <div className={`flex-1 min-w-[160px] md:w-full p-5 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between`}>
            <div className="flex justify-between items-center">
              <div>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>ELAPSED CLOCK</span>
                <span className="block font-mono text-xl font-bold tracking-tight text-stone-200">
                  {formatTime(sessionSeconds)}
                </span>
              </div>
              <Timer className={`w-5 h-5 ${currentTheme.accentText} animate-pulse`} />
            </div>

            <div className="hidden md:block pt-2 text-[9px] text-stone-500 uppercase font-mono tracking-wider">
              ⏱️ SYSTEM TIME RUNNING
            </div>
          </div>

        </section>

        {/* Center/Right side: Interactive Arena Card stage */}
        <section className="col-span-3 flex flex-col h-full overflow-y-auto">

          {isSetupActive ? (
            /* Setup State */
            <div className={`flex-1 p-6 sm:p-8 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between`}>
              
              <div className="space-y-6">
                <div className="space-y-1">
                  <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${currentTheme.badgeAccent}`}>
                    Step 1 of 2
                  </span>
                  <h2 className="font-serif text-2xl font-bold leading-tight">
                    Select Your Revision Target Deck
                  </h2>
                  <p className={`text-xs ${currentTheme.textMuted}`}>
                    Filter mistake cards to construct a custom training module suited for active focus.
                  </p>
                </div>

                <div className="space-y-4 max-w-xl">
                  {/* Subject filter */}
                  <div className="space-y-1.5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                      Subject Focus area
                    </label>
                    <select
                      value={reviewFilterSubjectId}
                      onChange={(e) => {
                        setReviewFilterSubjectId(e.target.value);
                        setReviewFilterTopicId('all');
                      }}
                      className={`w-full ${currentTheme.inputBg} rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1`}
                    >
                      <option value="all">📚 All Subjects ({mistakes.filter(m => m.status !== 'Mastered').length} active mistakes)</option>
                      {subjects.map((sub) => {
                        const count = mistakes.filter(m => m.subjectId === sub.id && m.status !== 'Mastered').length;
                        return (
                          <option key={sub.id} value={sub.id}>
                            {sub.name} ({count} active)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Topic filter */}
                  <div className="space-y-1.5">
                    <label className={`block text-[11px] font-bold uppercase tracking-wider ${currentTheme.textMuted}`}>
                      Unit / Topic Focus area
                    </label>
                    <select
                      value={reviewFilterTopicId}
                      onChange={(e) => setReviewFilterTopicId(e.target.value)}
                      disabled={reviewFilterSubjectId === 'all'}
                      className={`w-full ${currentTheme.inputBg} rounded-xl px-4 py-3 text-xs font-semibold focus:outline-none focus:ring-1 ${reviewFilterSubjectId === 'all' ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      <option value="all">📁 All Units & Topics</option>
                      {topics
                        .filter((t) => t.subjectId === reviewFilterSubjectId)
                        .map((topic) => {
                          const count = mistakes.filter((m) => m.topicId === topic.id && m.status !== 'Mastered').length;
                          return (
                            <option key={topic.id} value={topic.id}>
                              {topic.name} ({count} active)
                            </option>
                          );
                        })}
                    </select>
                    {reviewFilterSubjectId === 'all' && (
                      <p className="text-[10px] text-stone-500 italic">
                        *Select a specific subject to unlock individual unit topics.
                      </p>
                    )}
                  </div>

                  {/* Include Mastered logic option */}
                  <div className={`p-4 rounded-xl ${currentTheme.cardBg} border flex items-center justify-between`}>
                    <div className="space-y-0.5">
                      <span className="block text-xs font-bold text-stone-100">Include Mastered logs</span>
                      <span className="block text-[10px] text-stone-400">Include correct/resolved cards inside the matrix rotation.</span>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={includeMasteredInReview}
                        onChange={(e) => setIncludeMasteredInReview(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-stone-700 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#D98A6C]"></div>
                    </label>
                  </div>
                </div>

                {/* Status indicator badge */}
                <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border flex items-center gap-3 max-w-xl`}>
                  <div className={`p-2.5 rounded-xl bg-black/30 text-stone-200`}>
                    <span className="text-xl font-bold font-serif">{targetMistakes.length}</span>
                  </div>
                  <div>
                    <span className="block text-xs font-bold">Mistake Cards Loaded</span>
                    <span className="block text-[10px] text-stone-400">Match criteria and will be structured into dynamic flash rotations.</span>
                  </div>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-[#E8E2D9]/10">
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTheme.secondaryBtn}`}
                >
                  Cancel and Exit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    if (targetMistakes.length > 0) {
                      setReviewIndex(0);
                      setIsAnswerRevealed(false);
                      setIsSetupActive(false);
                      playSound('reveal', isMuted);
                      spawnParticle('🚀 DECK LAUNCHED', 'text-cyan-400 font-extrabold text-xs');
                    } else {
                      playSound('error', isMuted);
                      spawnParticle('No matching mistake cards. Adjust filters!', 'text-amber-400 font-bold text-xs');
                    }
                  }}
                  disabled={targetMistakes.length === 0}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${currentTheme.primaryBtn} ${targetMistakes.length === 0 ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:scale-[1.01] active:scale-98'}`}
                >
                  <span>LAUNCH DECK</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : isFinished ? (
            /* Victory / Completion State */
            <div className={`flex-1 p-6 sm:p-8 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between animate-scale-up`}>
              
              <div className="space-y-6 flex-1 overflow-y-auto">
                {/* Header Victory Celebration */}
                <div className="text-center py-4 space-y-3.5 border-b border-[#E8E2D9]/10 pb-6">
                  <div className="relative inline-block">
                    <div className="absolute inset-0 bg-yellow-400/20 blur-xl rounded-full scale-125 animate-pulse" />
                    <div className="w-16 h-16 bg-yellow-400/10 border-2 border-yellow-400/30 text-yellow-400 rounded-full flex items-center justify-center mx-auto z-10 relative">
                      <Trophy className="w-9 h-9 animate-bounce" />
                    </div>
                  </div>
                  <div>
                    <h2 className="font-serif text-3xl font-bold tracking-tight">
                      DECK CONQUERED!
                    </h2>
                    <p className={`text-xs ${currentTheme.textMuted} mt-1 max-w-md mx-auto`}>
                      Sensational effort! Your neural paths have been updated, and mistake patterns successfully evaluated.
                    </p>
                  </div>
                </div>

                {/* Score Summary Metrics Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  
                  {/* Score Card: Ratios */}
                  <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border text-center space-y-1`}>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Mastery Ratio</span>
                    <span className="text-2xl font-black text-emerald-400">
                      {cardHistory.filter(h => h.outcome === 'Mastered').length} <span className="text-xs text-stone-300">/ {cardHistory.length}</span>
                    </span>
                  </div>

                  {/* Score Card: Points */}
                  <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border text-center space-y-1`}>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">XP points gained</span>
                    <span className="text-2xl font-black text-amber-400">
                      +{sessionXp} XP
                    </span>
                  </div>

                  {/* Score Card: Streak */}
                  <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border text-center space-y-1`}>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Peak Streak</span>
                    <span className="text-2xl font-black text-orange-400">
                      {maxComboStreak}x
                    </span>
                  </div>

                  {/* Score Card: Time */}
                  <div className={`p-4 rounded-2xl ${currentTheme.cardBg} border text-center space-y-1`}>
                    <span className="text-[10px] uppercase font-bold text-stone-400 block">Total Duration</span>
                    <span className="text-2xl font-mono font-bold">
                      {formatTime(sessionSeconds)}
                    </span>
                  </div>

                </div>

                {/* Unlocked Rank badge */}
                <div className={`p-4.5 rounded-2xl border ${scoreBadge.color} flex flex-col sm:flex-row items-center justify-between gap-3`}>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white/10 rounded-xl">
                      <Award className="w-6 h-6" />
                    </div>
                    <div className="text-left">
                      <span className="block text-[10px] uppercase font-bold tracking-wider opacity-80">UNLOCKED PERFORMANCE BADGE</span>
                      <strong className="block text-sm font-serif">{scoreBadge.name}</strong>
                    </div>
                  </div>
                  <button
                    onClick={sharePerformance}
                    className="px-4 py-2 bg-stone-800 hover:bg-stone-700 text-stone-100 rounded-xl text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Share Performance stats
                  </button>
                </div>

                {/* Card results log */}
                <div className="space-y-2 text-left pt-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-stone-400">
                    Neural Card Logs
                  </h4>
                  <div className="space-y-1.5 max-h-40 overflow-y-auto pr-1">
                    {cardHistory.map((hist, idx) => (
                      <div key={idx} className={`p-2.5 rounded-xl ${currentTheme.cardBg} border flex items-center justify-between text-xs`}>
                        <span className="font-serif font-semibold truncate max-w-xs">{hist.title}</span>
                        <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase ${hist.outcome === 'Mastered' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : hist.outcome === 'Reviewing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                          {hist.outcome}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

              </div>

              {/* Action buttons footer */}
              <div className="mt-8 flex flex-col sm:flex-row justify-end gap-3 pt-4 border-t border-[#E8E2D9]/10">
                <button
                  type="button"
                  onClick={() => {
                    setIsSetupActive(true);
                    setIsFinished(false);
                    setSessionXp(0);
                    setComboStreak(0);
                    setMaxComboStreak(0);
                    setSessionSeconds(0);
                    setCardHistory([]);
                    playSound('reveal', isMuted);
                  }}
                  className={`px-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${currentTheme.secondaryBtn}`}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start Another Deck</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${currentTheme.primaryBtn}`}
                >
                  Return to Dashboard
                </button>
              </div>

            </div>
          ) : (
            /* Active recall platform card Stage */
            <div className="flex-1 flex flex-col justify-between space-y-4">
              
              {/* Card Meta details bar */}
              <div className={`p-3 rounded-2xl ${currentTheme.panel} border flex flex-wrap items-center gap-2 text-xs`}>
                <span className={`px-2 py-0.5 rounded-md text-[9px] font-mono font-bold uppercase ${currentTheme.badgeAccent}`}>
                  CARD {reviewIndex + 1} OF {targetMistakes.length}
                </span>

                <div className="flex flex-wrap items-center gap-1.5 ml-1">
                  <span className="text-[10px] font-bold text-[#D98A6C] bg-[#D98A6C]/10 px-2 py-0.5 rounded">
                    Subject: {subjects.find((s) => s.id === currentMistake?.subjectId)?.name}
                  </span>
                  <span className="text-[10px] font-semibold text-[#5A5A40] bg-[#5A5A40]/10 px-2 py-0.5 rounded">
                    Topic: {topics.find((t) => t.id === currentMistake?.topicId)?.name}
                  </span>
                  {reviewFilterCategories && reviewFilterCategories.length > 0 && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/40 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900 px-2.5 py-0.5 rounded-full animate-pulse flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Similar Focus: {reviewFilterCategories.join(', ')}
                    </span>
                  )}
                </div>

                <span className={`text-[9px] font-bold ml-auto px-2 py-0.5 rounded-full ${currentMistake?.status === 'Mastered' ? 'bg-[#8DA38A]' : currentMistake?.status === 'Reviewing' ? 'bg-[#D98A6C]' : 'bg-[#EAEAF2] text-[#2D2A26]'}`}>
                  {currentMistake?.status}
                </span>
              </div>

              {/* Physical Flashcard Box */}
              <div className={`flex-1 p-5 sm:p-7 rounded-3xl ${currentTheme.panel} border flex flex-col justify-between space-y-4 shadow-xl overflow-y-auto min-h-[350px]`}>
                
                <div className="space-y-4">
                  
                  {/* Card Title */}
                  <h3 className="font-serif text-xl sm:text-2xl font-bold leading-snug">
                    {currentMistake?.title}
                  </h3>

                  {/* Card Categories */}
                  {currentMistake?.categories && currentMistake.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {currentMistake.categories.map((cat, idx) => (
                        <span key={idx} className="text-[9px] font-bold tracking-tight bg-stone-800 text-stone-300 px-2 py-0.5 rounded border border-stone-700">
                          ⚠ {cat}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Original Question Section */}
                  <div className={`p-4 sm:p-5 rounded-2xl ${currentTheme.cardBg} border space-y-2 shadow-inner text-left`}>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 block border-b border-white/5 pb-1">
                      Original Question Prompt
                    </span>
                    <p className="font-serif text-stone-100 leading-relaxed text-base italic newline-style whitespace-pre-wrap">
                      "{currentMistake?.originalQuestion || 'No question details recorded.'}"
                    </p>

                    {/* Image references inside */}
                    {(() => {
                      const imgs = currentMistake?.imageUrls && currentMistake.imageUrls.length > 0
                        ? currentMistake.imageUrls
                        : (currentMistake?.imageUrl ? [currentMistake.imageUrl] : []);
                      if (imgs.length === 0) return null;

                      const currentUrl = imgs[activeImgIndex] || imgs[0] || '';

                      const handlePrev = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setActiveImgIndex((prev) => (prev - 1 + imgs.length) % imgs.length);
                      };

                      const handleNext = (e: React.MouseEvent) => {
                        e.stopPropagation();
                        setActiveImgIndex((prev) => (prev + 1) % imgs.length);
                      };

                      return (
                        <div className="mt-3 pt-2 border-t border-white/5 space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-stone-300 uppercase tracking-wider flex items-center gap-1.5">
                              📸 Reference Photo {imgs.length > 1 ? `(${activeImgIndex + 1} of ${imgs.length})` : ''}
                            </span>
                            <button
                              type="button"
                              onClick={() => setLightboxImg(currentUrl)}
                              className="text-[9px] font-bold text-[#D98A6C] hover:text-[#C17A5E] bg-stone-850 px-2.5 py-1 rounded-md border border-stone-800 transition-colors flex items-center gap-1 cursor-pointer"
                            >
                              <Maximize2 className="w-3 h-3" />
                              View Fullscreen
                            </button>
                          </div>

                          {/* Enlarged Image Display Box with overlay navigation */}
                          <div className="relative group w-full bg-stone-900/60 rounded-xl overflow-hidden border border-stone-800 flex items-center justify-center p-1.5 select-none min-h-[220px]">
                            {currentUrl ? (
                              <img
                                src={currentUrl}
                                referrerPolicy="no-referrer"
                                alt={`Reference ${activeImgIndex + 1}`}
                                className="max-h-72 sm:max-h-96 w-auto max-w-full object-contain rounded-lg shadow-md cursor-zoom-in transition-transform duration-300 hover:scale-[1.01]"
                                onClick={() => setLightboxImg(currentUrl)}
                              />
                            ) : (
                              <div className="text-stone-500 text-xs py-10">No image source found.</div>
                            )}

                            {/* Arrow Controls (Only if multiple pictures exist) */}
                            {imgs.length > 1 && (
                              <>
                                {/* Left Arrow */}
                                <button
                                  type="button"
                                  onClick={handlePrev}
                                  className="absolute left-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/10 transition-all cursor-pointer shadow-md focus:outline-none flex items-center justify-center opacity-90 group-hover:opacity-100 hover:scale-105"
                                  title="Previous Picture"
                                >
                                  <ChevronLeft className="w-4 h-4" />
                                </button>

                                {/* Right Arrow */}
                                <button
                                  type="button"
                                  onClick={handleNext}
                                  className="absolute right-2.5 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/60 hover:bg-black/85 text-white border border-white/10 transition-all cursor-pointer shadow-md focus:outline-none flex items-center justify-center opacity-90 group-hover:opacity-100 hover:scale-105"
                                  title="Next Picture"
                                >
                                  <ChevronRight className="w-4 h-4" />
                                </button>

                                {/* Bottom Pagination Indicators */}
                                <div className="absolute bottom-2.5 left-1/2 -translate-x-1/2 flex gap-1 bg-black/50 px-2 py-0.5 rounded-full border border-white/15">
                                  {imgs.map((_, i) => (
                                    <button
                                      key={i}
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setActiveImgIndex(i);
                                      }}
                                      className={`w-1.5 h-1.5 rounded-full transition-all cursor-pointer ${i === activeImgIndex ? 'bg-[#D98A6C] w-2.5' : 'bg-stone-500 hover:bg-stone-300'}`}
                                      title={`Go to image ${i + 1}`}
                                    />
                                  ))}
                                </div>
                              </>
                            )}
                          </div>

                          {/* Thumbnail Strip (Only shown if multiple pictures exist, for easy direct clicking) */}
                          {imgs.length > 1 && (
                            <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-thin max-w-full">
                              {imgs.map((url, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setActiveImgIndex(idx)}
                                  className={`relative w-14 h-10 flex-shrink-0 rounded-md overflow-hidden border transition-all duration-200 cursor-pointer ${idx === activeImgIndex ? 'border-amber-400 ring-1 ring-amber-400' : 'border-stone-800 hover:border-stone-500 opacity-60 hover:opacity-100'}`}
                                >
                                  <img
                                    src={url}
                                    referrerPolicy="no-referrer"
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                  />
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })()}
                  </div>

                  {/* Interactive Scratchpad responding sandbox */}
                  <div className="space-y-2 text-left">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] uppercase font-bold tracking-wider text-stone-400 block">
                        Whiteboard practice scratchpad (Active Recall Sandbox)
                      </label>
                      {matchedKeywords.length > 0 && (
                        <span className="text-[9px] font-mono font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded animate-pulse">
                          ✨ {matchedKeywords.length} keywords matching answer!
                        </span>
                      )}
                    </div>
                    <textarea
                      value={scratchpadText}
                      onChange={(e) => setScratchpadText(e.target.value)}
                      placeholder="Write down your calculated solution, response draft, or recall formulas here... Then reveal answer to cross-check!"
                      rows={3}
                      className={`w-full ${currentTheme.inputBg} text-xs font-sans rounded-xl p-3 focus:outline-none focus:ring-1 focus:ring-[#D98A6C] placeholder-stone-500`}
                    />

                    {/* Word check list */}
                    {matchedKeywords.length > 0 && (
                      <div className="flex flex-wrap gap-1 items-center mt-1">
                        <span className="text-[9px] font-bold text-stone-500 uppercase tracking-widest mr-1">Matches:</span>
                        {matchedKeywords.map((word, i) => (
                          <span key={i} className="text-[9px] font-mono font-bold bg-cyan-500/15 text-cyan-300 px-1.5 py-0.5 rounded flex items-center gap-0.5 animate-scale-up">
                            <Check className="w-2.5 h-2.5" /> {word}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Revealable solutions card */}
                  {isAnswerRevealed ? (
                    <div className="space-y-4 mt-2 animate-slide-down text-left border-t border-white/5 pt-4">
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Attempt */}
                        {currentMistake?.myAnswer && (
                          <div className="p-4 rounded-xl text-xs leading-normal font-sans bg-red-500/5 border border-red-500/15">
                            <span className="font-bold text-red-400 block mb-1.5 uppercase tracking-wider text-[9px]">
                              Your Logged Incorrect Attempt
                            </span>
                            <div className={`p-3 rounded border font-mono text-stone-300 ${currentTheme.cardBg}`}>
                              {currentMistake.myAnswer}
                            </div>
                          </div>
                        )}

                        {/* Outcome answer */}
                        {currentMistake?.correctAnswer && (
                          <div className="p-4 rounded-xl text-xs leading-normal font-sans bg-emerald-500/5 border border-emerald-500/15">
                            <span className="font-bold text-emerald-400 block mb-1.5 uppercase tracking-wider text-[9px]">
                              Correct Answer Outcome
                            </span>
                            <div className={`p-3 rounded border font-mono text-stone-300 ${currentTheme.cardBg}`}>
                              {currentMistake.correctAnswer}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Detailed explanation */}
                      {currentMistake?.correctExplanation && (
                        <div className={`p-4 rounded-xl border ${currentTheme.cardBg}`}>
                          <span className={`block font-bold ${currentTheme.accentText} text-[10px] uppercase mb-1.5`}>
                            CORRECT PRACTICE EXPLANATION & STEPS:
                          </span>
                          <p className="font-sans text-stone-300 leading-relaxed text-xs whitespace-pre-wrap">
                            {currentMistake.correctExplanation}
                          </p>
                        </div>
                      )}

                      {/* Self Reflection deep-dive advice */}
                      {currentMistake?.reflection && (
                        <div className="p-4 rounded-xl bg-purple-500/5 border border-purple-500/15 text-left">
                          <span className="font-sans text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-1.5">
                            My Self-Reflection & Conceptual deep-dive:
                          </span>
                          <p className="font-sans text-xs text-stone-300 leading-relaxed italic">
                            "{currentMistake.reflection}"
                          </p>
                        </div>
                      )}

                    </div>
                  ) : (
                    <div className="py-2 text-center">
                      <button
                        type="button"
                        onClick={() => {
                          setIsAnswerRevealed(true);
                          playSound('reveal', isMuted);
                          spawnParticle('✨ SOLVER REVEALED', 'text-amber-400 font-extrabold text-xs');
                        }}
                        className={`px-6 py-3 rounded-full font-bold text-xs uppercase tracking-widest cursor-pointer hover:scale-[1.02] active:scale-98 transition-all flex items-center gap-1.5 mx-auto ${currentTheme.primaryBtn}`}
                      >
                        <Eye className="w-4 h-4" />
                        Reveal Correct Answer & Advice
                      </button>
                    </div>
                  )}

                </div>

                {/* Card Actions Footer Bar inside Recall Box */}
                <div className="border-t border-white/5 pt-4 flex flex-col sm:flex-row justify-between items-center gap-3">
                  
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSetupActive(true)}
                      className={`text-[10px] font-bold px-3 py-1.5 rounded-full ${currentTheme.secondaryBtn}`}
                    >
                      ‹ Adjust Setup
                    </button>
                    <span className="text-[10px] text-stone-400 font-medium">
                      Card {reviewIndex + 1} of {targetMistakes.length} matched
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {isAnswerRevealed ? (
                      <>
                        {/* Keep studying (Unresolved) */}
                        <button
                          onClick={() => handleAnswerOutcome('New')}
                          className="px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          title="Keep in rotation as unresolved mistake"
                        >
                          Still practicing
                        </button>

                        {/* Medium upgrade */}
                        <button
                          onClick={() => handleAnswerOutcome('Reviewing')}
                          className="px-4 py-2 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-xs font-bold cursor-pointer transition-colors"
                          title="Set as intermediate study log"
                        >
                          Almost got it!
                        </button>

                        {/* Got it! Mastered */}
                        <button
                          onClick={() => handleAnswerOutcome('Mastered')}
                          className="px-5 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold cursor-pointer transition-transform hover:scale-[1.02] flex items-center gap-1"
                          title="Mark mistake as Mastered!"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Got it! Mastered
                        </button>

                        {/* AI Clone Challenge Trigger */}
                        {currentMistake && (
                          <button
                            type="button"
                            onClick={() => setAiCloneCard(currentMistake)}
                            className="px-4 py-2 bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 text-amber-300 border border-amber-500/30 rounded-xl text-xs font-bold cursor-pointer transition-all flex items-center gap-1.5 shadow-xs"
                            title="Generate a fresh variation question to test concept mastery"
                          >
                            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                            AI Clone Challenge
                          </button>
                        )}
                      </>
                    ) : (
                      <button
                        onClick={handleSkipCard}
                        className={`px-5 py-2.5 rounded-xl text-xs font-bold ${currentTheme.secondaryBtn}`}
                      >
                        Skip card ›
                      </button>
                    )}
                  </div>

                </div>

              </div>

            </div>
          )}

        </section>

      </main>

      {/* Embedded Single-Photo Zoom Lightbox overlay inside the full-screen Arena */}
      {lightboxImg && (
        <div 
          className="fixed inset-0 bg-[#000000]/95 backdrop-blur-md flex flex-col z-[200] items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <div className="absolute top-4 right-4 flex items-center gap-2 z-30">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setLightboxImg(null);
              }}
              className="p-2 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-100 cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <img
            src={lightboxImg}
            referrerPolicy="no-referrer"
            alt="Reference zoom"
            className="max-w-full max-h-[85vh] object-contain rounded-xl select-none"
            onClick={(e) => e.stopPropagation()}
          />
          <p className="text-stone-400 text-xs mt-3 select-none">
            Click anywhere to close full screen reference image
          </p>
        </div>
      )}

      {/* Custom Exit/Quit Confirmation Overlay */}
      {showQuitConfirm && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-[250]">
          <div className={`w-full max-w-md p-6 rounded-2xl border ${currentTheme.panel} shadow-2xl animate-in fade-in zoom-in duration-200`}>
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-500/15 text-red-400 rounded-xl">
                <AlertCircle className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <h3 className="text-base font-bold text-white mb-2">
                  Abandon Active Recall Session?
                </h3>
                <p className="text-xs text-stone-300 leading-relaxed mb-6">
                  Are you sure you want to quit? Your current XP points earned in this active recall session and your consecutive combo multiplier will be cleared.
                </p>
                <div className="flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowQuitConfirm(false)}
                    className={`px-4 py-2 text-xs font-bold rounded-xl transition-all cursor-pointer ${currentTheme.secondaryBtn}`}
                  >
                    Keep Studying
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowQuitConfirm(false);
                      onClose();
                    }}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-xl transition-all cursor-pointer shadow-lg shadow-red-950/20"
                  >
                    Yes, Abandon Session
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Digital Achievement Badge Share Modal Overlay */}
      {isShareModalOpen && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[260] overflow-y-auto">
          <div className="w-full max-w-lg p-6 rounded-3xl border border-stone-800 bg-[#0f0d14]/95 shadow-2xl animate-in fade-in zoom-in duration-350 flex flex-col items-center">
            
            {/* Header with close button */}
            <div className="w-full flex justify-between items-center mb-5">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-400" />
                <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
                  Arena Memory Milestone
                </h3>
              </div>
              <button
                onClick={() => setIsShareModalOpen(false)}
                className="p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Glowing Digital Achievement Badge Box */}
            <div className={`w-full max-w-sm rounded-2xl p-5 border ${badgeTheme.border} ${badgeTheme.glow} relative overflow-hidden flex flex-col items-center text-center shadow-xl mb-6`}>
              
              {/* Corner accent vectors */}
              <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-stone-700"></div>
              <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-stone-700"></div>
              <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-stone-700"></div>
              <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-stone-700"></div>

              {/* Sub-header watermark */}
              <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-stone-500 mb-6 block uppercase">
                StudyFlow Memory Recognition
              </span>

              {/* Emblem with glow */}
              <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 relative z-10 ring-4 ${badgeTheme.ring} bg-stone-950/60 shadow-inner`}>
                <div className="absolute inset-0 rounded-full bg-radial from-transparent to-black/40"></div>
                {badgeTheme.emoji}
              </div>

              {/* Title and honorary badge text */}
              <h4 className="text-xl font-serif font-black text-white tracking-wide mb-1">
                {badgeTheme.title}
              </h4>
              <p className={`text-[10px] font-sans font-bold uppercase tracking-widest ${badgeTheme.text} mb-3`}>
                Honorary Performance Badge
              </p>

              {/* Summary Description */}
              <p className="text-[11px] text-stone-400 px-3 leading-relaxed mb-6">
                {badgeTheme.description}
              </p>

              {/* Stats Grid */}
              <div className="w-full grid grid-cols-2 gap-2 mt-auto">
                <div className="p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-center space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-500 uppercase tracking-wider block">
                    Cards Studied
                  </span>
                  <span className="text-xs font-bold text-white">
                    {cardHistory.length} cards
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-center space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-500 uppercase tracking-wider block">
                    Mastery Score
                  </span>
                  <span className="text-xs font-bold text-emerald-400">
                    {cardHistory.length > 0 ? Math.round((cardHistory.filter(h => h.outcome === 'Mastered').length / cardHistory.length) * 100) : 0}%
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-center space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-500 uppercase tracking-wider block">
                    Peak Streak
                  </span>
                  <span className="text-xs font-bold text-orange-400">
                    {maxComboStreak}x
                  </span>
                </div>
                <div className="p-2.5 rounded-xl bg-stone-950/40 border border-white/5 text-center space-y-0.5">
                  <span className="text-[8px] font-mono text-stone-500 uppercase tracking-wider block">
                    Total XP
                  </span>
                  <span className="text-xs font-bold text-amber-400">
                    +{sessionXp} XP
                  </span>
                </div>
              </div>

              {/* Watermark security label */}
              <div className="mt-5 flex items-center justify-center gap-1.5 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
                <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest">
                  Verified Memory Achievement
                </span>
                <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
              </div>

            </div>

            {/* Action controls footer */}
            <div className="w-full space-y-2 max-w-sm">
              
              <button
                type="button"
                onClick={handleDownloadBadge}
                disabled={isBadgeDownloading}
                className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isBadgeDownloading ? (
                  <>
                    <Sparkles className="w-4 h-4 animate-spin" />
                    Generating Certificate...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Download Badge Certificate (PNG)
                  </>
                )}
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleCopyShareText}
                  className="py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-[11px] rounded-xl transition-all border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  {badgeCopySuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Copy Stats
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  Share Badge
                </button>
              </div>

              <p className="text-[9px] text-stone-500 text-center leading-normal pt-2">
                Download the verified badge image to save locally or click Share Badge to distribute your academic milestones directly.
              </p>

            </div>

          </div>
        </div>
      )}

      {/* Embedded AI Clone Challenge Arena */}
      <AiClonePracticeModal
        isOpen={!!aiCloneCard}
        onClose={() => setAiCloneCard(null)}
        mistake={aiCloneCard}
        subject={subjects.find((s) => s.id === aiCloneCard?.subjectId)}
        topic={topics.find((t) => t.id === aiCloneCard?.topicId)}
        onMarkMastered={(id) => {
          editMistake(id, { status: 'Mastered' });
        }}
      />

    </div>
  );
}
