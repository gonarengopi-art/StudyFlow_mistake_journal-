/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Copy, Check, Share2, Users, Sparkles, MessageSquare } from 'lucide-react';
import { StudySquad } from '../types';
import { copyToClipboard } from '../utils/clipboard';

interface InviteSquadModalProps {
  squad: StudySquad;
  isOpen: boolean;
  onClose: () => void;
}

export function InviteSquadModal({ squad, isOpen, onClose }: InviteSquadModalProps) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const inviteUrl = `${window.location.origin}${window.location.pathname}?squad=${squad.code}`;

  const handleCopyCode = async () => {
    const success = await copyToClipboard(squad.code);
    if (success) {
      setCopiedCode(true);
      setTimeout(() => setCopiedCode(false), 2200);
    }
  };

  const handleCopyLink = async () => {
    const success = await copyToClipboard(inviteUrl);
    if (success) {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2200);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `Join our study squad: ${squad.name}`,
          text: `Join our StudyFlow squad "${squad.name}" to share tricky exam mistakes, common pitfalls, and drill together! Squad Code: ${squad.code}`,
          url: inviteUrl,
        });
      } catch (e) {
        // User cancelled or share failed, fallback to copy
        handleCopyLink();
      }
    } else {
      handleCopyLink();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl w-full max-w-md shadow-2xl overflow-hidden p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-[#9A9184] hover:text-[#2D2A26] rounded-full hover:bg-[#F0EAE1] transition-colors"
          title="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#D98A6C]/10 border border-[#D98A6C]/30 flex items-center justify-center text-[#D98A6C]">
            <Users className="w-6 h-6 stroke-[2]" />
          </div>
          <h3 className="font-serif font-black text-2xl text-[#2D2A26]">Invite Classmates</h3>
          <p className="font-sans text-xs text-[#7A7265] mt-1 max-w-xs mx-auto">
            Invite study partners to <strong className="text-[#2D2A26] font-semibold">{squad.name}</strong> to pool tricky pitfalls and compare mastery accuracy.
          </p>
        </div>

        {/* 6-Character Squad Code Display */}
        <div className="bg-white border-2 border-dashed border-[#D98A6C]/40 rounded-xl p-5 mb-5 text-center relative group">
          <span className="font-sans text-[11px] font-bold uppercase tracking-wider text-[#9A9184] block mb-1">
            6-Character Squad Code
          </span>
          <div className="flex items-center justify-center gap-3">
            <span className="font-mono font-black text-3xl sm:text-4xl tracking-widest text-[#2D2A26] select-all">
              {squad.code}
            </span>
            <button
              onClick={handleCopyCode}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                copiedCode
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                  : 'bg-[#FAF8F5] hover:bg-[#F5F2ED] border-[#E8E2D9] text-[#5A5A40]'
              }`}
              title="Copy Squad Code"
            >
              {copiedCode ? <Check className="w-5 h-5 text-emerald-600" /> : <Copy className="w-5 h-5" />}
            </button>
          </div>
          {copiedCode && (
            <span className="text-[11px] font-semibold text-emerald-700 block mt-2 animate-fade-in">
              Code copied to clipboard!
            </span>
          )}
        </div>

        {/* Shareable Link Box */}
        <div className="space-y-3 mb-6">
          <label className="block font-sans text-xs font-semibold text-[#5A5A40]">
            Direct Invite Link
          </label>
          <div className="flex items-center gap-2 bg-white border border-[#E8E2D9] rounded-xl p-2 pl-3">
            <input
              type="text"
              readOnly
              value={inviteUrl}
              className="bg-transparent text-xs text-[#5A5A40] font-mono flex-1 outline-none truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold font-sans transition-all flex items-center gap-1.5 shrink-0 ${
                copiedLink
                  ? 'bg-emerald-600 text-white'
                  : 'bg-[#2D2A26] hover:bg-[#4A453E] text-white'
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" /> Copied
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" /> Copy Link
                </>
              )}
            </button>
          </div>
        </div>

        {/* Quick share buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleNativeShare}
            className="flex-1 py-2.5 px-4 bg-[#D98A6C] hover:bg-[#C17A5E] text-white font-sans text-xs font-bold rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm cursor-pointer"
          >
            <Share2 className="w-4 h-4" /> Share via Apps
          </button>
          <button
            onClick={onClose}
            className="py-2.5 px-4 bg-[#FAF8F5] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-[#2D2A26] font-sans text-xs font-bold rounded-xl transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>

        <p className="text-[11px] text-center text-[#9A9184] mt-4">
          Anyone with this 6-character code can join and review shared mistakes.
        </p>
      </div>
    </div>
  );
}
