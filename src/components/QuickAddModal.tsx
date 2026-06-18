/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { Subject, Topic, MistakeEntry, MistakeCategory } from '../types';
import { X, Sparkles, AlertCircle, HelpCircle, ArrowRight, BookMarked, ToggleLeft, Upload, Trash2, Image as ImageIcon, Clipboard, Camera } from 'lucide-react';

interface QuickAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: Subject[];
  topics: Topic[];
  addSubject: (name: string) => string | Promise<string>;
  addTopic: (subjectId: string, name: string) => string | Promise<string>;
  addMistake: (entry: Omit<MistakeEntry, 'id' | 'dateLogged'> & { dateLogged?: string }) => string | Promise<string>;
  onNavigateToMistake: (id: string) => void;
}

export function QuickAddModal({
  isOpen,
  onClose,
  subjects,
  topics,
  addSubject,
  addTopic,
  addMistake,
  onNavigateToMistake,
}: QuickAddModalProps) {
  
  const [title, setTitle] = useState('');
  const [dateLogged, setDateLogged] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject and Topic inline creation states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [isNewTopic, setIsNewTopic] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');

  // Answers
  const [myAnswer, setMyAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const imageUrl = imageUrls[0] || '';
  const [dragActive, setDragActive] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

  useEffect(() => {
    if (!isOpen && cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
      setIsCameraActive(false);
    }
  }, [isOpen]);

  const startCamera = async () => {
    try {
      setIsCameraActive(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      setCameraStream(stream);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play().catch(e => console.error("Error playing video:", e));
        }
      }, 120);
    } catch (err) {
      console.error("Camera access error:", err);
      alert("Could not access camera. Please check your browser's site permissions for camera access.");
      setIsCameraActive(false);
    }
  };

  const stopCamera = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach(track => track.stop());
      setCameraStream(null);
    }
    setIsCameraActive(false);
  };

  const addImageToUrls = (url: string) => {
    setImageUrls(prev => {
      if (prev.length >= 10) {
        alert("Maximum of 10 photos / screenshots can be added per mistake log.");
        return prev;
      }
      return [...prev, url];
    });
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
        const dataUrl = canvas.toDataURL('image/jpeg');
        addImageToUrls(dataUrl);
      }
      stopCamera();
    }
  };

  // Compulsory Reflection and Category states for QuickAdd
  const [reflection, setReflection] = useState('');
  const [chosenCategories, setChosenCategories] = useState<MistakeCategory[]>([]);

  const allCategories: MistakeCategory[] = [
    'Careless Error',
    'Content Gap',
    'Misread Question',
    'Exam Technique',
    'Timing Issue',
    'Calculation Error',
    'Knowledge Recall',
    'Other'
  ];

  const toggleCategory = (cat: MistakeCategory) => {
    setChosenCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  // Auto-init defaults whenever modal expands
  useEffect(() => {
    if (isOpen) {
      setDateLogged(new Date().toISOString().split('T')[0]);
      setTitle('');
      setSelectedSubjectId('');
      setSelectedTopicId('');
      setIsNewSubject(false);
      setIsNewTopic(false);
      setCustomSubjectName('');
      setCustomTopicName('');
      setMyAnswer('');
      setCorrectAnswer('');
      setImageUrls([]);
      setDragActive(false);
      setIsCameraActive(false);
      setCameraStream(null);
      setReflection('');
      setChosenCategories([]);
      setErrorText('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  const handleFileReader = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, BMP, WEBP, etc.).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('This image exceeds 2.5MB. Please upload a smaller image.');
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result;
      if (typeof result === 'string') {
        addImageToUrls(result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileReader(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileReader(e.target.files[0]);
    }
  };

  const handlePasteEvent = (e: React.ClipboardEvent) => {
    const items = e.clipboardData?.items;
    if (items) {
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            handleFileReader(file);
            e.preventDefault();
            break;
          }
        }
      }
    }
  };

  // Dynamically update available topics as soon as subject changes
  const filteredTopics = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === 'create_new') return [];
    return topics.filter((t) => t.subjectId === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  if (!isOpen) return null;

  const handleSubjectChange = (val: string) => {
    setSelectedSubjectId(val);
    setSelectedTopicId('');
    if (val === 'create_new') {
      setIsNewSubject(true);
    } else {
      setIsNewSubject(false);
    }
  };

  const handleTopicChange = (val: string) => {
    setSelectedTopicId(val);
    if (val === 'create_new') {
      setIsNewTopic(true);
    } else {
      setIsNewTopic(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorText('');

    if (!reflection.trim()) {
      setErrorText('Please provide your reflection on what you misunderstood.');
      return;
    }

    if (chosenCategories.length === 0) {
      setErrorText('Please select at least one Mistake Category Tag.');
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Resolve Subject
      let finalSubjectId = selectedSubjectId;
      if (isNewSubject || !finalSubjectId) {
        const subName = customSubjectName.trim() || 'General Study';
        const match = subjects.find(s => s.name.toLowerCase() === subName.toLowerCase());
        if (match) {
          finalSubjectId = match.id;
        } else {
          finalSubjectId = await addSubject(subName);
        }
      }

      // 2. Resolve Topic
      let finalTopicId = selectedTopicId;
      if (isNewTopic || !finalTopicId) {
        const topName = customTopicName.trim() || 'General Topic';
        const match = topics.find(t => t.subjectId === finalSubjectId && t.name.toLowerCase() === topName.toLowerCase());
        if (match) {
          finalTopicId = match.id;
        } else {
          finalTopicId = await addTopic(finalSubjectId, topName);
        }
      }

      const generatedTitle = chosenCategories.join(' & ');

      // 3. Create mistake entry with logical defaults to save immediately
      const newId = await addMistake({
        title: generatedTitle,
        subjectId: finalSubjectId,
        topicId: finalTopicId,
        dateLogged: dateLogged || new Date().toISOString().split('T')[0],
        imageUrl: imageUrls[0] ? imageUrls[0] : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        
        // Logical default fallbacks for instant saving
        originalQuestion: `Reference question/formula for: ${generatedTitle}`,
        myAnswer: myAnswer.trim(),
        correctAnswer: correctAnswer.trim(),
        whatIGotWrong: '',
        correctExplanation: 'Details pending review. Click "Edit Log" inside this mistake card later to record calculations, screenshots, or proofs.',
        reflection: reflection.trim(),
        futureAdvice: '',
        categories: chosenCategories,
        status: 'New'
      });

      onClose();
      onNavigateToMistake(newId);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed log entry creation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[150] bg-[#2D2A26]/40 backdrop-blur-sm flex items-center justify-center p-4 font-sans animate-fade-in">
      
      {/* Centered Modal Card */}
      <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-3xl p-6 shadow-2xl w-full max-w-lg animate-scale-up flex flex-col justify-between max-h-[90vh] overflow-y-auto">
        
        {/* Header Block */}
        <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-3 mb-4">
          <span className="font-sans text-xs font-bold text-[#5A5A40] uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 fill-[#D98A6C] text-[#D98A6C] animate-pulse" />
            Quick Add Mistake
          </span>
          <button
            onClick={onClose}
            className="p-1 text-[#9A9184] hover:text-[#2D2A26] hover:bg-[#F5F2ED] rounded-full transition-colors cursor-pointer"
            title="Close Quick Add"
            disabled={isSubmitting}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Validation Alert error */}
        {errorText && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-[#C17A5E] text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#C17A5E]" />
            <span>{errorText}</span>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Subject Select or Inline Create */}
            <div>
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1 font-sans">
                Subject
              </label>

              {!isNewSubject ? (
                <select
                  value={selectedSubjectId}
                  onChange={(e) => handleSubjectChange(e.target.value)}
                  className="w-full text-xs p-3 border border-[#E8E2D9] bg-[#F5F2ED]/40 focus:bg-white rounded-xl outline-none text-[#2D2A26] cursor-pointer"
                  disabled={isSubmitting}
                >
                  <option value="">Choose Subject (Optional)</option>
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>{sub.name}</option>
                  ))}
                  <option value="create_new" className="font-bold text-[#D98A6C]">[+ Add Custom Subject inline]</option>
                </select>
              ) : (
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Subject (e.g. Prep)"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none"
                    required={isNewSubject}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSubject(false);
                      setSelectedSubjectId('');
                    }}
                    className="px-2.5 py-2.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] rounded-xl text-[9px] font-bold text-[#6B6357]"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>

            {/* Topic Select or Inline Create */}
            <div>
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1 font-sans">
                Topic / Module
              </label>

              {!isNewTopic ? (
                <select
                  value={selectedTopicId}
                  onChange={(e) => handleTopicChange(e.target.value)}
                  disabled={!selectedSubjectId || selectedSubjectId === 'create_new' || isSubmitting}
                  className="w-full text-xs p-3 border border-[#E8E2D9] bg-[#F5F2ED]/40 focus:bg-[#FDFCF8] rounded-xl outline-none text-[#2D2A26] disabled:opacity-40 cursor-pointer"
                >
                  <option value="">Choose Topic (Optional)</option>
                  {filteredTopics.map((top) => (
                    <option key={top.id} value={top.id}>{top.name}</option>
                  ))}
                  <option value="create_new" className="font-bold text-[#D98A6C]">[+ Add Custom Topic inline]</option>
                </select>
              ) : (
                <div className="flex gap-1.5 items-center">
                  <input
                    type="text"
                    placeholder="Topic Module"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    className="flex-1 text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none"
                    required={isNewTopic}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewTopic(false);
                      setSelectedTopicId('');
                    }}
                    className="px-2.5 py-2.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] rounded-xl text-[9px] font-bold text-[#6B6357]"
                  >
                    Back
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Quick Option Answers & Visual Drop / Paste Area */}
          <div className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3 pb-1">
              <div>
                <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1 font-sans">
                  My Incorrect Answer
                </label>
                <input
                  type="text"
                  placeholder="Your answer"
                  value={myAnswer}
                  onChange={(e) => setMyAnswer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none focus:border-[#9A9184]"
                  disabled={isSubmitting}
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1 font-sans">
                  Correct Answer
                </label>
                <input
                  type="text"
                  placeholder="The correct solution"
                  value={correctAnswer}
                  onChange={(e) => setCorrectAnswer(e.target.value)}
                  className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/40 text-[#2D2A26] outline-none focus:border-[#5A5A40] font-semibold"
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1.5 font-sans">
                Visual Reference (Optional)
              </label>
              
              <div
                onDragEnter={handleDrag}
                onDragOver={handleDrag}
                onDragLeave={handleDrag}
                onDrop={handleDrop}
                onPaste={handlePasteEvent}
                tabIndex={0}
                className={`relative border-2 border-dashed rounded-xl p-3 flex flex-col items-center justify-center text-center transition-all min-h-[105px] group focus:outline-none focus:ring-1 focus:ring-[#5A5A40] ${
                  dragActive 
                    ? 'border-[#5A5A40] bg-[#5A5A40]/5' 
                    : 'border-[#E8E2D9] bg-[#F5F2ED]/25 hover:border-[#9A9184] hover:bg-[#F5F2ED]/40'
                }`}
              >
                <input
                  type="file"
                  id="file-upload-modal"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isSubmitting}
                />

                {isCameraActive ? (
                  <div className="relative w-full aspect-video min-h-[120px] rounded-lg overflow-hidden bg-black flex flex-col justify-between">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-0 right-0 flex justify-center gap-2 px-2 z-10">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          capturePhoto();
                        }}
                        className="px-2.5 py-1.5 bg-[#5A5A40] hover:bg-[#474732] text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-colors"
                      >
                        Capture Photo
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          stopCamera();
                        }}
                        className="px-2.5 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-colors"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full py-1 space-y-2">
                    {/* Multi-image previews list */}
                    {imageUrls.length > 0 && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 w-full mb-2 max-h-[160px] overflow-y-auto p-1 scrollbar-thin">
                        {imageUrls.map((url, index) => (
                          <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-[#E8E2D9] group shadow-xs">
                            <img src={url} alt={`Uploaded preview ${index + 1}`} className="w-full h-full object-cover" />
                            <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[8px] text-white py-0.5 text-center font-semibold">
                              Photo {index + 1} {index === 0 && "(Primary)"}
                            </div>
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setImageUrls(prev => prev.filter((_, i) => i !== index));
                                }}
                                className="p-1 bg-red-600 hover:bg-red-700 text-white rounded transition-colors cursor-pointer"
                                title="Remove this photo"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="flex gap-2.5 mt-1" onClick={(e) => e.stopPropagation()}>
                      <label 
                        htmlFor="file-upload-modal"
                        className="cursor-pointer flex flex-col items-center justify-center px-3 py-1.5 border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 rounded-lg transition-all shadow-xs text-center min-w-[95px]"
                      >
                        <Upload className="w-3.5 h-3.5 text-[#5A5A40] mb-0.5" />
                        <span className="text-[9px] font-bold text-[#2D2A26]">
                          {imageUrls.length > 0 ? "Upload More" : "Upload File"}
                        </span>
                      </label>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          startCamera();
                        }}
                        className="flex flex-col items-center justify-center px-3 py-1.5 border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 rounded-lg transition-all shadow-xs text-center min-w-[95px] cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5 text-[#5A5A40] mb-0.5" />
                        <span className="text-[9px] font-bold text-[#2D2A26]">
                          Take Photo
                        </span>
                      </button>
                    </div>

                    <div className="text-center">
                      <span className="text-[9px] text-[#9A9184] block font-sans">
                        Or click & paste image with <kbd className="px-0.5 py-0.5 bg-stone-100 border rounded text-[7px]">Ctrl+V</kbd>
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Reflection Field */}
          <div className="space-y-3 pt-3 border-t border-[#E8E2D9]/60">
            <div>
              <label className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest mb-1.5 font-sans">
                Reflection: What did I misunderstand? <span className="text-[#D98A6C]">*</span>
              </label>
              <textarea
                rows={2.5}
                placeholder="Explain why you made this mistake..."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full text-xs p-3 border border-[#E8E2D9] outline-none focus:border-[#C17A5E] rounded-xl bg-[#FDFCF8] text-[#2D2A26] resize-none transition-colors shadow-xs"
                disabled={isSubmitting}
                required
                autoFocus
              ></textarea>
            </div>

            {/* Mistake Category Tags */}
            <div>
              <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1.5 font-sans-medium">
                Mistake Category Tags <span className="text-[#D98A6C]">*</span>
              </label>
              <div className="flex flex-wrap gap-1">
                {allCategories.map((cat) => {
                  const isChecked = chosenCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase transition-colors select-none cursor-pointer ${
                        isChecked 
                          ? 'bg-[#2D2A26] border border-[#2D2A26] text-white shadow-xs' 
                          : 'bg-[#F5F2ED] hover:bg-[#E8E2D9] border border-[#E8E2D9] text-[#6B6357]'
                      }`}
                      disabled={isSubmitting}
                    >
                      {cat}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Tips block */}
          <div className="bg-[#F5F2ED] p-3 border border-[#E8E2D9]/70 rounded-xl flex items-start gap-2 text-[10px] text-[#6B6357] leading-relaxed">
            <HelpCircle className="w-3.5 h-3.5 text-[#5A5A40] shrink-0 mt-0.5" />
            <p>
              <strong>Frictionless Defaults Activated:</strong> If Subjects or Topics remain empty, they default to standard categories automatically!
            </p>
          </div>

          {/* Submit Row elements */}
          <div className="flex justify-end gap-3 pt-3 border-t border-[#E8E2D9] mt-6 font-sans">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] border border-[#E8E2D9] text-xs font-bold rounded-xl transition-colors cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-xs font-bold rounded-xl cursor-pointer flex items-center gap-1.5 transition-colors shadow-sm disabled:opacity-40"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                  Saving...
                </>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Save Mistake
                </>
              )}
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
