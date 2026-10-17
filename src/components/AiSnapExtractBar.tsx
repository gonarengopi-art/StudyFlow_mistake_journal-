/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Sparkles,
  Camera,
  Upload,
  FileText,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  X,
  Zap,
  Image as ImageIcon,
  Clipboard,
} from 'lucide-react';
import { Subject, Topic } from '../types';
import { extractMistakeFromAI, ExtractedMistakeData } from '../services/aiService';
import {
  readImageFromClipboard,
  readTextFromClipboard,
  extractImageFromClipboardEvent,
} from '../utils/clipboard';

interface AiSnapExtractBarProps {
  subjects: Subject[];
  topics: Topic[];
  onExtracted: (data: ExtractedMistakeData, imageUrl?: string) => void;
  isCompact?: boolean;
}

export function AiSnapExtractBar({
  subjects,
  topics,
  onExtracted,
  isCompact = false,
}: AiSnapExtractBarProps) {
  const [activeTab, setActiveTab] = useState<'photo' | 'text'>('photo');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [rawText, setRawText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingStep, setLoadingStep] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [extractedSuccess, setExtractedSuccess] = useState(false);
  const [clipboardFeedback, setClipboardFeedback] = useState<string | null>(null);

  // Camera handling
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [cameraStream]);

  // Read image or text directly from clipboard
  const handlePasteClipboard = async () => {
    setError(null);
    setClipboardFeedback(null);
    try {
      const result = await readImageFromClipboard();
      if (result.dataUrl) {
        setPreviewImage(result.dataUrl);
        setClipboardFeedback('Image successfully pasted from clipboard!');
        setTimeout(() => setClipboardFeedback(null), 3500);
      } else if (result.text) {
        setActiveTab('text');
        setRawText(result.text);
        setClipboardFeedback('Copied question text pasted into text field!');
        setTimeout(() => setClipboardFeedback(null), 3500);
      } else if (result.error) {
        setError(result.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not access clipboard.');
    }
  };

  // Read plain text into text tab
  const handlePasteTextClipboard = async () => {
    setError(null);
    setClipboardFeedback(null);
    try {
      const res = await readTextFromClipboard();
      if (res.text) {
        setRawText(res.text);
        setClipboardFeedback('Question text pasted from clipboard!');
        setTimeout(() => setClipboardFeedback(null), 3500);
      } else if (res.error) {
        setError(res.error);
      }
    } catch (err: any) {
      setError(err?.message || 'Could not paste text.');
    }
  };

  // Listen for user Ctrl+V / Cmd+V on the component
  const handleContainerPaste = (e: React.ClipboardEvent) => {
    const file = extractImageFromClipboardEvent(e);
    if (file) {
      e.preventDefault();
      handleFileReader(file);
      setClipboardFeedback('Image pasted from clipboard (Ctrl+V)!');
      setTimeout(() => setClipboardFeedback(null), 3500);
    }
  };

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch((e) => console.error('Error playing video:', e));
        }
      }, 120);
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check your browser site permissions.');
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setPreviewImage(dataUrl);
      }
      stopCamera();
    }
  };

  const handleFileReader = (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPG, WEBP).');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        setPreviewImage(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileReader(e.target.files[0]);
    }
  };

  const handleAnalyze = async () => {
    if (!previewImage && !rawText.trim()) {
      setError('Please snap/upload a question image or paste question text.');
      return;
    }

    setLoading(true);
    setError(null);
    setExtractedSuccess(false);
    setLoadingStep('Uploading to Gemini OCR...');

    const timer1 = setTimeout(() => setLoadingStep('Extracting formulas, options & answers...'), 800);
    const timer2 = setTimeout(() => setLoadingStep('Diagnosing cognitive trap & reason...'), 1800);

    try {
      const data = await extractMistakeFromAI({
        imageBase64: previewImage || undefined,
        text: rawText.trim() || undefined,
        existingSubjects: subjects,
        existingTopics: topics,
      });

      clearTimeout(timer1);
      clearTimeout(timer2);

      setExtractedSuccess(true);
      onExtracted(data, previewImage || undefined);
    } catch (err: any) {
      clearTimeout(timer1);
      clearTimeout(timer2);
      setError(err?.message || 'Failed to extract mistake. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      tabIndex={0}
      onPaste={handleContainerPaste}
      className="bg-gradient-to-br from-[#5A5A40]/10 via-[#F5F2ED] to-[#D98A6C]/10 border border-[#5A5A40]/25 rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 focus:outline-none focus:ring-1 focus:ring-[#5A5A40]/40"
    >
      {/* Title & Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-[#5A5A40] text-white flex items-center justify-center shadow-xs">
            <Sparkles className="w-4 h-4 text-[#E8D099]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#5A5A40]">
                Feature 1 • Instant Mistake Logger
              </span>
              <span className="px-2 py-0.2 bg-[#D98A6C] text-white text-[9px] font-bold rounded-full uppercase tracking-wider">
                ⚡ 3-Sec AI Snap
              </span>
            </div>
            <h4 className="font-serif text-sm sm:text-base font-bold text-[#2D2A26]">
              Snap & Extract from Exam Photo or Problem
            </h4>
          </div>
        </div>

        {/* Tab switch */}
        <div className="flex bg-white/80 p-0.5 rounded-xl border border-[#E8E2D9]">
          <button
            type="button"
            onClick={() => setActiveTab('photo')}
            className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'photo'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6357] hover:text-[#2D2A26]'
            }`}
          >
            <Camera className="w-3.5 h-3.5" /> Photo / Snap
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('text')}
            className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
              activeTab === 'text'
                ? 'bg-[#5A5A40] text-white shadow-xs'
                : 'text-[#6B6357] hover:text-[#2D2A26]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" /> Paste Text
          </button>
        </div>
      </div>

      {/* Mode 1: Photo & Camera */}
      {activeTab === 'photo' && (
        <div className="space-y-3">
          {isCameraActive ? (
            <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-h-60 mx-auto flex items-center justify-center">
              <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
              <div className="absolute bottom-3 inset-x-0 flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-4 py-2 bg-white text-[#2D2A26] rounded-full text-xs font-bold shadow-lg flex items-center gap-2 cursor-pointer hover:bg-stone-100"
                >
                  <Camera className="w-4 h-4 text-[#D98A6C]" /> Capture Problem
                </button>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-3 py-2 bg-red-600/80 hover:bg-red-600 text-white rounded-full text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : previewImage ? (
            <div className="relative rounded-xl overflow-hidden border border-[#E8E2D9] bg-stone-100 max-h-48 flex items-center justify-center group">
              <img src={previewImage} alt="Mistake problem preview" className="max-h-48 object-contain" />
              <button
                type="button"
                onClick={() => setPreviewImage(null)}
                className="absolute top-2 right-2 p-1.5 bg-black/60 hover:bg-black text-white rounded-full transition-colors cursor-pointer"
                title="Remove image"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-2 left-2 bg-black/60 text-white text-[10px] px-2 py-0.5 rounded-full font-mono">
                Ready for AI analysis
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Option A: Take Live Photo */}
              <button
                type="button"
                onClick={startCamera}
                className="p-3.5 bg-white hover:bg-[#F5F2ED] border-2 border-dashed border-[#5A5A40]/30 hover:border-[#5A5A40] rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group"
              >
                <div className="w-8 h-8 rounded-full bg-[#5A5A40]/10 text-[#5A5A40] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Camera className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#2D2A26]">Take Photo</span>
                <span className="text-[10px] text-[#6B6357]">Snap test paper / screen</span>
              </button>

              {/* Option B: Upload file */}
              <label className="p-3.5 bg-white hover:bg-[#F5F2ED] border-2 border-dashed border-[#5A5A40]/30 hover:border-[#5A5A40] rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group">
                <div className="w-8 h-8 rounded-full bg-[#D98A6C]/10 text-[#D98A6C] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Upload className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-[#2D2A26]">Upload File</span>
                <span className="text-[10px] text-[#6B6357]">PNG, JPG, or WEBP</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>

              {/* Option C: Paste from Clipboard */}
              <button
                type="button"
                onClick={handlePasteClipboard}
                className="p-3.5 bg-white hover:bg-[#F5F2ED] border-2 border-dashed border-[#5A5A40]/40 hover:border-[#5A5A40] rounded-xl flex flex-col items-center justify-center gap-1 text-center transition-all cursor-pointer group hover:shadow-xs"
                title="Paste screenshot directly from your clipboard or press Ctrl+V"
              >
                <div className="w-8 h-8 rounded-full bg-[#5A5A40]/15 text-[#5A5A40] flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Clipboard className="w-4 h-4" />
                </div>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-bold text-[#2D2A26]">Paste Clipboard</span>
                  <span className="text-[9px] px-1 bg-stone-100 rounded text-stone-600 font-mono font-semibold">Ctrl+V</span>
                </div>
                <span className="text-[10px] text-[#6B6357]">Click to paste screenshot</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Mode 2: Raw Text */}
      {activeTab === 'text' && (
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#5A5A40] uppercase tracking-wider">
              Paste Question / Exam Text
            </span>
            <button
              type="button"
              onClick={handlePasteTextClipboard}
              className="text-[11px] font-bold text-[#5A5A40] hover:text-[#2D2A26] flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white/80 hover:bg-white border border-[#E8E2D9] shadow-2xs transition-colors cursor-pointer"
            >
              <Clipboard className="w-3.5 h-3.5 text-[#5A5A40]" /> Paste from Clipboard
            </button>
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste problem text, exam snippet, or question with your incorrect answer here..."
            rows={3}
            className="w-full text-xs p-3 bg-white border border-[#E8E2D9] rounded-xl text-[#2D2A26] placeholder-[#9A9184] focus:outline-none focus:ring-2 focus:ring-[#5A5A40]/30 resize-none font-sans"
          />
        </div>
      )}

      {/* Clipboard feedback toast */}
      {clipboardFeedback && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-2.5 rounded-xl flex items-center gap-2 animate-fade-in shadow-2xs">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span className="font-medium">{clipboardFeedback}</span>
        </div>
      )}

      {/* Error or Success feedback */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 text-xs p-2.5 rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {extractedSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-900 text-xs p-2.5 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-semibold">
              Mistake analyzed & auto-filled! Review the extracted fields below.
            </span>
          </div>
          <span className="text-[10px] uppercase font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-md">
            7 Fields Populated
          </span>
        </div>
      )}

      {/* Extraction action trigger button */}
      <div className="flex items-center justify-between pt-1">
        <span className="text-[11px] text-[#6B6357] font-medium hidden sm:inline">
          Extracts: Subject, Topic, Question, Wrong Answer, Explanation & Mistake Tag.
        </span>

        <button
          type="button"
          disabled={loading || (!previewImage && !rawText.trim())}
          onClick={handleAnalyze}
          className="w-full sm:w-auto px-5 py-2.5 bg-[#5A5A40] hover:bg-[#4A453E] disabled:opacity-40 text-white rounded-full text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
        >
          {loading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>{loadingStep || 'Analyzing with AI...'}</span>
            </>
          ) : (
            <>
              <Zap className="w-3.5 h-3.5 text-[#E8D099]" />
              <span>Analyze & Auto-Fill with AI</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
