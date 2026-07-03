/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { 
  X, 
  Download, 
  Copy, 
  Share2, 
  Check, 
  Sparkles, 
  Trophy,
  Award,
  Calendar,
  Compass,
  Briefcase
} from 'lucide-react';

export interface Achievement {
  id: string;
  title: string;
  description: string;
  emoji: string;
  badgeTitle: string;
  color: string;
  glow: string;
  text: string;
  border: string;
  ring: string;
  requirement: string;
}

interface AchievementShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  achievement: Achievement;
  stats: {
    totalMistakes: number;
    masteredCount: number;
    totalSubjects: number;
    totalTopics: number;
  };
}

export function AchievementShareModal({
  isOpen,
  onClose,
  achievement,
  stats
}: AchievementShareModalProps) {
  const [copySuccess, setCopySuccess] = useState<boolean>(false);
  const [isDownloading, setIsDownloading] = useState<boolean>(false);

  if (!isOpen) return null;

  const shareText = useMemo(() => {
    return `🏆 I unlocked the "${achievement.title}" achievement on StudyFlow!\n✨ Achievement: ${achievement.description}\n📈 My Stats: Logged ${stats.totalMistakes} mistakes (${stats.masteredCount} mastered) across ${stats.totalSubjects} subjects!\n🎯 Accelerating active recall mastery with offline-first precision!`;
  }, [achievement, stats]);

  const handleCopyText = () => {
    navigator.clipboard.writeText(shareText);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `StudyFlow Achievement: ${achievement.title}`,
          text: shareText,
          url: window.location.origin
        });
      } catch (err) {
        console.log('Share canceled or failed', err);
      }
    } else {
      handleCopyText();
    }
  };

  const handleDownloadBadge = () => {
    setIsDownloading(true);
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 600;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw dark background gradient
      const bgGrad = ctx.createRadialGradient(300, 300, 50, 300, 300, 420);
      bgGrad.addColorStop(0, '#131118');
      bgGrad.addColorStop(1, '#050407');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, 600, 600);

      // Accent color matching the badge theme
      let themeColor = '#D98A6C'; // default slate warm
      if (achievement.id === 'pioneer') themeColor = '#10B981'; // emerald
      if (achievement.id === 'retainer') themeColor = '#8B5CF6'; // purple
      if (achievement.id === 'sentinel') themeColor = '#06B6D4'; // cyan
      if (achievement.id === 'sage') themeColor = '#F59E0B'; // amber
      if (achievement.id === 'architect') themeColor = '#3B82F6'; // blue
      if (achievement.id === 'explorer') themeColor = '#EC4899'; // pink

      // Draw metallic outer borders
      ctx.strokeStyle = themeColor + '44';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 560, 560);
      
      ctx.strokeStyle = themeColor;
      ctx.lineWidth = 1;
      ctx.strokeRect(25, 25, 550, 550);

      // Draw subtle background grid lines
      ctx.strokeStyle = '#ffffff03';
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

      // Draw glowing circular emblem shield
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
      
      ctx.fillStyle = '#00000066';
      ctx.fill();

      ctx.shadowBlur = 0;

      // Draw big emoji inside shield
      ctx.font = '72px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(achievement.emoji, 300, 180);

      // Draw header text
      ctx.fillStyle = '#ffffff88';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText('STUDYFLOW ACADEMIC MILESTONES', 300, 65);

      // Title
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText(achievement.title.toUpperCase(), 300, 290);
      
      ctx.fillStyle = themeColor;
      ctx.font = 'bold 11px sans-serif';
      ctx.fillText(achievement.badgeTitle.toUpperCase(), 300, 315);

      // Draw divider line
      ctx.strokeStyle = '#ffffff12';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(100, 340);
      ctx.lineTo(500, 340);
      ctx.stroke();

      // Achievement Description word wrap helper
      ctx.fillStyle = '#ffffffbb';
      ctx.font = '12px sans-serif';
      const words = achievement.description.split(' ');
      let line = '';
      let y = 365;
      const maxWidth = 400;
      const lineHeight = 18;

      for (let n = 0; n < words.length; n++) {
        let testLine = line + words[n] + ' ';
        let metrics = ctx.measureText(testLine);
        let testWidth = metrics.width;
        if (testWidth > maxWidth && n > 0) {
          ctx.fillText(line, 300, y);
          line = words[n] + ' ';
          y += lineHeight;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line, 300, y);

      // Stats Banner
      ctx.fillStyle = '#ffffff04';
      ctx.fillRect(100, 430, 400, 70);
      ctx.strokeStyle = '#ffffff0d';
      ctx.strokeRect(100, 430, 400, 70);

      // Render 3 stats inside the banner
      const statX1 = 170;
      const statX2 = 300;
      const statX3 = 430;

      // Stat 1: Total mistakes
      ctx.fillStyle = '#ffffff66';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('LOGGED MISTAKES', statX1, 452);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${stats.totalMistakes}`, statX1, 475);

      // Stat 2: Mastery
      ctx.fillStyle = '#ffffff66';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('MASTERY SCORE', statX2, 452);
      ctx.fillStyle = '#10B981';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${stats.totalMistakes > 0 ? Math.round((stats.masteredCount / stats.totalMistakes) * 100) : 0}%`, statX2, 475);

      // Stat 3: Subjects
      ctx.fillStyle = '#ffffff66';
      ctx.font = 'bold 8px sans-serif';
      ctx.fillText('SUBJECT MODULES', statX3, 452);
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 16px sans-serif';
      ctx.fillText(`${stats.totalSubjects}`, statX3, 475);

      // Footer Date
      ctx.fillStyle = '#ffffff44';
      ctx.font = '9px sans-serif';
      const achievementDate = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
      ctx.fillText(`Unlocked on ${achievementDate}`, 300, 535);

      ctx.fillStyle = themeColor + 'aa';
      ctx.font = 'bold 9px sans-serif';
      ctx.fillText('VERIFIED SCHOLAR ACHIEVEMENT CERTIFICATE', 300, 555);

      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `StudyFlow_Achievement_${achievement.title.replace(' ', '_')}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Failed to generate canvas download', err);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center p-4 z-[260] overflow-y-auto">
      <div className="w-full max-w-lg p-6 rounded-3xl border border-stone-800 bg-[#0f0d14]/95 shadow-2xl animate-in fade-in zoom-in duration-350 flex flex-col items-center relative">
        
        {/* Header with close button */}
        <div className="w-full flex justify-between items-center mb-5">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-amber-400 animate-bounce" />
            <h3 className="text-sm font-bold uppercase tracking-wider text-stone-200">
              Scholarly Milestone Unlocked!
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-stone-900 hover:bg-stone-800 text-stone-400 hover:text-stone-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Glowing Achievement Badge preview */}
        <div className={`w-full max-w-sm rounded-2xl p-6 border ${achievement.border} ${achievement.glow} relative overflow-hidden flex flex-col items-center text-center shadow-xl mb-6`}>
          
          {/* Corner accent vectors */}
          <div className="absolute top-2 left-2 w-3 h-3 border-t border-l border-stone-700"></div>
          <div className="absolute top-2 right-2 w-3 h-3 border-t border-r border-stone-700"></div>
          <div className="absolute bottom-2 left-2 w-3 h-3 border-b border-l border-stone-700"></div>
          <div className="absolute bottom-2 right-2 w-3 h-3 border-b border-r border-stone-700"></div>

          {/* Sub-header watermark */}
          <span className="text-[8px] font-mono font-bold tracking-[0.2em] text-stone-500 mb-6 block uppercase">
            StudyFlow Scholar Recognition
          </span>

          {/* Emblem with glow */}
          <div className={`w-24 h-24 rounded-full flex items-center justify-center text-5xl mb-4 relative z-10 ring-4 ${achievement.ring} bg-stone-950/60 shadow-inner`}>
            <div className="absolute inset-0 rounded-full bg-radial from-transparent to-black/40"></div>
            {achievement.emoji}
          </div>

          {/* Title and honorary badge text */}
          <h4 className="text-xl font-serif font-black text-white tracking-wide mb-1">
            {achievement.title}
          </h4>
          <p className={`text-[10px] font-sans font-bold uppercase tracking-widest ${achievement.text} mb-3`}>
            {achievement.badgeTitle}
          </p>

          {/* Summary Description */}
          <p className="text-[11px] text-stone-300 px-3 leading-relaxed mb-6">
            {achievement.description}
          </p>

          {/* Mini Stats Line */}
          <div className="flex items-center gap-4 text-[10px] text-stone-500 font-mono">
            <span>LOGS: <strong className="text-stone-300">{stats.totalMistakes}</strong></span>
            <span>•</span>
            <span>MASTERY: <strong className="text-emerald-400">{stats.totalMistakes > 0 ? Math.round((stats.masteredCount / stats.totalMistakes) * 100) : 0}%</strong></span>
            <span>•</span>
            <span>SUBJECTS: <strong className="text-stone-300">{stats.totalSubjects}</strong></span>
          </div>

          {/* Watermark security label */}
          <div className="mt-5 flex items-center justify-center gap-1.5 opacity-40">
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
            <span className="text-[8px] font-mono text-stone-400 uppercase tracking-widest">
              Verified Scholar Achievement
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-stone-400"></div>
          </div>

        </div>

        {/* Action controls footer */}
        <div className="w-full space-y-2 max-w-sm">
          
          <button
            type="button"
            onClick={handleDownloadBadge}
            disabled={isDownloading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-bold text-xs rounded-xl transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isDownloading ? (
              <>
                <Sparkles className="w-4 h-4 animate-spin" />
                Generating PNG Certificate...
              </>
            ) : (
              <>
                <Download className="w-4 h-4" />
                Download Certificate Badge (PNG)
              </>
            )}
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCopyText}
              className="py-2.5 bg-stone-900 hover:bg-stone-800 text-stone-300 font-bold text-[11px] rounded-xl transition-all border border-stone-800 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {copySuccess ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  Copy Text
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleNativeShare}
              className="py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-[11px] rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Stats
            </button>
          </div>

          <p className="text-[9px] text-stone-500 text-center leading-normal pt-2">
            Download the verified academic certificate directly to your device as high-fidelity PNG file, or copy clipboard text containing your active progress.
          </p>

        </div>

      </div>
    </div>
  );
}
