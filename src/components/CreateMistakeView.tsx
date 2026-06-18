/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry, MistakeCategory, ReviewStatus } from '../types';
import { 
  Sparkles, 
  Calendar, 
  BookOpen, 
  AlertCircle, 
  HelpCircle, 
  CheckCircle, 
  Plus, 
  Check, 
  ChevronDown, 
  ChevronUp, 
  BookMarked,
  Tag,
  PenTool,
  Upload,
  Trash2,
  Image as ImageIcon,
  Clipboard,
  Camera
} from 'lucide-react';

interface CreateMistakeViewProps {
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  addSubject: (name: string) => string | Promise<string>;
  addTopic: (subjectId: string, name: string) => string | Promise<string>;
  addMistake: (entry: Omit<MistakeEntry, 'id' | 'dateLogged'> & { dateLogged?: string }) => string | Promise<string>;
  onNavigateToMistake: (id: string) => void;
  onNavigateToLibrary: () => void;
}

export function CreateMistakeView({
  subjects,
  topics,
  subtopics,
  addSubject,
  addTopic,
  addMistake,
  onNavigateToMistake,
  onNavigateToLibrary,
}: CreateMistakeViewProps) {
  
  // Primary state
  const [title, setTitle] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Subject/Topic dropdown selectors and inline creation states
  const [selectedSubjectId, setSelectedSubjectId] = useState('');
  const [selectedTopicId, setSelectedTopicId] = useState('');
  const [isNewSubject, setIsNewSubject] = useState(false);
  const [isNewTopic, setIsNewTopic] = useState(false);
  const [customSubjectName, setCustomSubjectName] = useState('');
  const [customTopicName, setCustomTopicName] = useState('');



  // Collapsible toggle for advanced/optional properties
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Secondary/Advanced states
  const [selectedSubtopicId, setSelectedSubtopicId] = useState('');
  const [dateLogged, setDateLogged] = useState(() => {
    return new Date().toISOString().split('T')[0];
  });
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const imageUrl = imageUrls[0] || '';
  const [dragActive, setDragActive] = useState(false);

  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement | null>(null);

  React.useEffect(() => {
    return () => {
      if (cameraStream) {
        cameraStream.getTracks().forEach(track => track.stop());
      }
    };
  }, [cameraStream]);

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

  const handleFileReader = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPG, BMP, WEBP, etc.).');
      return;
    }
    if (file.size > 2.5 * 1024 * 1024) {
      alert('This image exceeds 2.5MB. Please upload a smaller image or compressed screenshot.');
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
  const [originalQuestion, setOriginalQuestion] = useState('');
  const [myAnswer, setMyAnswer] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('');
  const [correctExplanation, setCorrectExplanation] = useState('');
  const [reflection, setReflection] = useState('');
  const [status, setStatus] = useState<ReviewStatus>('New');
  const [chosenCategories, setChosenCategories] = useState<MistakeCategory[]>([]);

  // List of possible categories
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

  // Dynamically update topics based on chosen subject
  const currentTopics = useMemo(() => {
    if (!selectedSubjectId || selectedSubjectId === 'create_new') return [];
    return topics.filter((t) => t.subjectId === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  // Dynamically update subtopics based on chosen topic
  const currentSubtopics = useMemo(() => {
    if (!selectedTopicId || selectedTopicId === 'create_new') return [];
    return subtopics.filter((st) => st.topicId === selectedTopicId);
  }, [subtopics, selectedTopicId]);

  // Handle category multi-selection
  const toggleCategory = (cat: MistakeCategory) => {
    setChosenCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  const handleSubjectChange = (val: string) => {
    setSelectedSubjectId(val);
    setSelectedTopicId('');
    setSelectedSubtopicId('');
    if (val === 'create_new') {
      setIsNewSubject(true);
    } else {
      setIsNewSubject(false);
    }
  };

  const handleTopicChange = (val: string) => {
    setSelectedTopicId(val);
    setSelectedSubtopicId('');
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
        // See if there is an existing subject with this name
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
        const topName = customTopicName.trim() || 'General Module';
        // See if there is an existing topic under this subject with this name
        const match = topics.find(t => t.subjectId === finalSubjectId && t.name.toLowerCase() === topName.toLowerCase());
        if (match) {
          finalTopicId = match.id;
        } else {
          finalTopicId = await addTopic(finalSubjectId, topName);
        }
      }

      const generatedTitle = chosenCategories.join(' & ');

      // 3. Commit log creation in store using intelligent logical defaults for skipped optional fields
      const newId = await addMistake({
        title: generatedTitle,
        subjectId: finalSubjectId,
        topicId: finalTopicId,
        subtopicId: selectedSubtopicId ? selectedSubtopicId : undefined,
        dateLogged,
        imageUrl: imageUrls[0] ? imageUrls[0] : undefined,
        imageUrls: imageUrls.length > 0 ? imageUrls : undefined,
        
        // Logical, descriptive default fallbacks to satisfy database structure without forcing client friction
        originalQuestion: originalQuestion.trim() || `Reference problem for ${generatedTitle}`,
        myAnswer: myAnswer.trim(),
        correctAnswer: correctAnswer.trim(),
        whatIGotWrong: '',
        correctExplanation: correctExplanation.trim() || 'Study steps pending. Review this card later to log full solution details.',
        
        reflection: reflection.trim() || 'Quick logged mistake. Needs reflection.',
        futureAdvice: '',
        categories: chosenCategories.length > 0 ? chosenCategories : ['Other'],
        status: status,
      });

      onNavigateToMistake(newId);
    } catch (err: any) {
      setErrorText(err?.message || 'Failed to submit mistake. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 animate-fade-in font-sans">
      
      {/* Title & Quiet Subtitle */}
      <section className="border-b border-[#E8E2D9] pb-4">
        <h2 className="font-serif text-3xl font-semibold text-[#2D2A26] tracking-tight">
          Log a Mistake
        </h2>
        <p className="text-xs text-[#6B6357] mt-1">
          Make a structured log to analyze learning gaps. Provide core details, explain your reflection, and classify with categories.
        </p>
      </section>

      {/* Validation Message Notification */}
      {errorText && (
        <div className="p-3 bg-red-50 border border-red-200 text-[#C17A5E] text-xs rounded-xl flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-[#C17A5E] shrink-0" />
          <span>{errorText}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        
        {/* Core Quick Cards container */}
        <div className="bg-white border border-[#E8E2D9] p-6 rounded-2xl shadow-sm space-y-5">
          
          {/* Subject & Topic inline picker section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            
            {/* Subject Dropdown & Inline Toggle */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest font-sans">
                Subject Category
              </label>
              
              {!isNewSubject ? (
                <div className="space-y-1">
                  <select
                    value={selectedSubjectId}
                    onChange={(e) => handleSubjectChange(e.target.value)}
                    className="w-full text-xs p-3 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/40 outline-none text-[#2D2A26] cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <option value="">Select Existing Subject (Optional)</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                    <option value="create_new" className="font-bold text-[#D98A6C]">[+ Create New Custom Subject]</option>
                  </select>
                  <p className="text-[10px] text-[#9A9184]">
                    Defaults to "General Study" if left unselected.
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Type subject (e.g. Chemistry, MCAT, SAT)"
                    value={customSubjectName}
                    onChange={(e) => setCustomSubjectName(e.target.value)}
                    className="flex-1 text-xs p-3 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none focus:border-[#d98a6c] font-medium"
                    required={isNewSubject}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewSubject(false);
                      setSelectedSubjectId('');
                    }}
                    className="px-3 py-2.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] rounded-xl text-[10px] font-bold text-[#6B6357] transition-all cursor-pointer"
                    title="Choose from list"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {/* Topic Dropdown & Inline Toggle */}
            <div className="space-y-1">
              <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest font-sans">
                Topic / Area
              </label>

              {!isNewTopic ? (
                <div className="space-y-1">
                  <select
                    value={selectedTopicId}
                    onChange={(e) => handleTopicChange(e.target.value)}
                    disabled={!selectedSubjectId || selectedSubjectId === 'create_new' || isSubmitting}
                    className="w-full text-xs p-3 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/40 outline-none text-[#2D2A26] disabled:opacity-40 cursor-pointer"
                  >
                    <option value="">Select Existing Topic (Optional)</option>
                    {currentTopics.map((top) => (
                      <option key={top.id} value={top.id}>{top.name}</option>
                    ))}
                    <option value="create_new" className="font-bold text-[#D98A6C]">[+ Create New Custom Topic]</option>
                  </select>
                  <p className="text-[10px] text-[#9A9184]">
                    {!selectedSubjectId ? "Please choose a Subject first to enable Topics." : "Defaults to 'General Module' if empty."}
                  </p>
                </div>
              ) : (
                <div className="flex gap-2 items-center">
                  <input
                    type="text"
                    placeholder="Type topic module"
                    value={customTopicName}
                    onChange={(e) => setCustomTopicName(e.target.value)}
                    className="flex-1 text-xs p-3 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none focus:border-[#d98a6c] font-medium"
                    required={isNewTopic}
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsNewTopic(false);
                      setSelectedTopicId('');
                    }}
                    className="px-3 py-2.5 bg-[#F5F2ED] hover:bg-[#E8E2D9] rounded-xl text-[10px] font-bold text-[#6B6357] transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* Elevated Core Prompt & Solution Outcome Fields */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-5 pt-3 border-t border-[#E8E2D9]/60">
            
            {/* Question prompt and solution results */}
            <div className="md:col-span-7 flex flex-col justify-between space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1 font-sans">
                  Original Question / Prompt <span className="text-[#D98A6C]">*</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Paste equation instructions, MCQs, or source prompt..."
                  value={originalQuestion}
                  onChange={(e) => setOriginalQuestion(e.target.value)}
                  className="w-full text-xs p-3 border border-[#E8E2D9] outline-none focus:border-[#5A5A40] rounded-xl bg-[#F5F2ED]/20 focus:bg-white text-[#2D2A26] font-sans resize-none transition-colors"
                  disabled={isSubmitting}
                  required
                ></textarea>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-1">
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1.5 font-sans">
                    My Incorrect Response
                  </label>
                  <input
                    type="text"
                    placeholder="Enter what you put down"
                    value={myAnswer}
                    onChange={(e) => setMyAnswer(e.target.value)}
                    className="w-full text-xs p-3 border border-[#E8E2D9] rounded-xl bg-white text-[#2D2A26] outline-none focus:border-[#9A9184]"
                    disabled={isSubmitting}
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1.5 font-sans">
                    Correct Answer <span className="text-[#D98A6C]">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Enter correct solution card"
                    value={correctAnswer}
                    onChange={(e) => setCorrectAnswer(e.target.value)}
                    className="w-full text-xs p-3 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/40 text-[#2D2A26] outline-none focus:border-[#5A5A40] font-semibold"
                    disabled={isSubmitting}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Visual Proof / Pasteboard attachment */}
            <div className="md:col-span-5 flex flex-col justify-between space-y-2">
              <div>
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1 font-sans">
                  Visual Reference
                </label>
                <p className="text-[10px] text-[#9A9184] mb-2">
                  Drop files, click to browse, or paste with <kbd className="px-1 py-0.5 bg-stone-100 border rounded text-[8px] font-sans">Ctrl+V</kbd> in box
                </p>

                {/* Dropzone Container */}
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  onPaste={handlePasteEvent}
                  tabIndex={0}
                  className={`relative border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center text-center transition-all min-h-[145px] group focus:outline-none focus:ring-1 focus:ring-[#5A5A40] ${
                    dragActive 
                      ? 'border-[#5A5A40] bg-[#5A5A40]/5' 
                      : 'border-[#E8E2D9] bg-[#F5F2ED]/20 hover:border-[#9A9184] hover:bg-[#F5F2ED]/40'
                  }`}
                >
                  <input
                    type="file"
                    id="file-upload-main"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isSubmitting}
                  />

                  {isCameraActive ? (
                    <div className="relative w-full aspect-video min-h-[145px] rounded-lg overflow-hidden bg-black flex flex-col justify-between">
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
                          className="px-3 py-1.5 bg-[#5A5A40] hover:bg-[#474732] text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-colors"
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
                          className="px-3 py-1.5 bg-stone-700 hover:bg-stone-800 text-white rounded-lg text-[10px] font-bold shadow-md cursor-pointer transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center w-full py-2 space-y-3">
                      {/* Multiple photo previews */}
                      {imageUrls.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 w-full mb-3 max-h-[220px] overflow-y-auto p-1 scrollbar-thin">
                          {imageUrls.map((url, index) => (
                            <div key={index} className="relative aspect-video rounded-lg overflow-hidden border border-[#E8E2D9] group shadow-xs">
                              <img src={url} alt={`Uploaded preview ${index + 1}`} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-black/60 text-[9px] text-white py-0.5 text-center font-semibold">
                                Photo {index + 1} {index === 0 && "(Primary)"}
                              </div>
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setImageUrls(prev => prev.filter((_, i) => i !== index));
                                  }}
                                  className="p-1.5 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors cursor-pointer"
                                  title="Remove this photo"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      <div className="flex gap-3 mt-1" onClick={(e) => e.stopPropagation()}>
                        <label 
                          htmlFor="file-upload-main"
                          className="cursor-pointer flex flex-col items-center justify-center px-4 py-2 border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 rounded-xl transition-all shadow-xs text-center min-w-[110px]"
                        >
                          <Upload className="w-4 h-4 text-[#5A5A40] mb-1" />
                          <span className="text-[10px] font-bold text-[#2D2A26]">
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
                          className="flex flex-col items-center justify-center px-4 py-2 border border-stone-200 hover:border-stone-400 bg-white hover:bg-stone-50 rounded-xl transition-all shadow-xs text-center min-w-[110px] cursor-pointer"
                        >
                          <Camera className="w-4 h-4 text-[#5A5A40] mb-1" />
                          <span className="text-[10px] font-bold text-[#2D2A26]">
                            Take Photo
                          </span>
                        </button>
                      </div>

                      <div className="text-center">
                        <span className="text-[10px] text-[#9A9184] block font-sans">
                          Or click & paste image with <kbd className="px-1 py-0.5 bg-stone-100 border rounded text-[8px]">Ctrl+V</kbd>
                        </span>
                        <span className="text-[8px] text-[#9A9184] font-mono mt-0.5 block">
                          PNG, JPG, WEBP formats (Max 2.5MB)
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Reflection Section */}
          <div className="border-t border-[#E8E2D9]/60 pt-4 space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest mb-1.5 font-sans">
                Reflection: What did I misunderstand? <span className="text-[#D98A6C]">*</span>
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Underestimated constant multiplier, forgot temperature kelvin calibration."
                value={reflection}
                onChange={(e) => setReflection(e.target.value)}
                className="w-full text-xs p-3.5 border border-[#E8E2D9] outline-none focus:border-[#C17A5E] rounded-xl bg-[#FDFCF8] text-[#2D2A26] font-sans resize-none shadow-inner"
                disabled={isSubmitting}
                required
              ></textarea>
            </div>

            {/* Select Category Tags multi-checkbox */}
            <div>
              <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2.5 font-sans-medium">
                Mistake Category Tags <span className="text-[#D98A6C]">*</span>
              </label>
              <div className="flex flex-wrap gap-1.5">
                {allCategories.map((cat) => {
                  const isChecked = chosenCategories.includes(cat);
                  return (
                    <button
                      type="button"
                      key={cat}
                      onClick={() => toggleCategory(cat)}
                      className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase transition-colors select-none cursor-pointer ${
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

        </div>

        {/* Accordion / Toggle Box to unveil complex properties */}
        <div className="border border-[#E8E2D9]/70 rounded-2xl bg-white overflow-hidden shadow-sm transition-all">
          <button
            type="button"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className="w-full px-5 py-3.5 bg-[#F5F2ED]/40 hover:bg-[#F5F2ED]/70 flex items-center justify-between text-xs font-bold uppercase tracking-wider text-[#6B6357] cursor-pointer transition-colors border-b border-[#E8E2D9]/40"
          >
            <span className="flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#5A5A40]" />
              {showAdvanced ? 'Hide Exam Specs & Solution details' : 'Show Exam Specs & Solution details (MCQs, logs, answer proofs)'}
            </span>
            {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>

          {showAdvanced && (
            <div className="p-6 space-y-5 animate-slide-up">
              
              {/* Image screenshot url */}
              <div className="space-y-1">
                <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest font-sans">Supporting Reference Image URL</label>
                <input
                  type="text"
                  placeholder="e.g. https://images.unsplash.com/photo-1543002588..."
                  value={imageUrl}
                  onChange={(e) => {
                    const val = e.target.value.trim();
                    if (val) {
                      setImageUrls(prev => {
                        const next = [...prev];
                        next[0] = val;
                        return next;
                      });
                    } else {
                      setImageUrls(prev => prev.slice(1));
                    }
                  }}
                  className="w-full text-xs p-3 border border-[#E8E2D9] outline-none focus:border-[#5A5A40] rounded-xl bg-[#F5F2ED]/30 text-[#2D2A26]"
                  disabled={isSubmitting}
                />
                
                {imageUrl.trim() && (
                  <div className="mt-2 aspect-video max-h-36 rounded-lg overflow-hidden border border-[#E8E2D9]" onError={(e) => {
                    (e.target as any).src = "https://images.unsplash.com/photo-1543002588-bfa74002ed7e?q=80&w=2787&auto=format&fit=crop";
                  }}>
                    <img src={imageUrl} alt="Equation diagram preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>



              {/* Correct Explanation detail */}
              <div>
                <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1 font-sans">Correct Explanation Proof</label>
                <textarea
                  rows={2.5}
                  placeholder="Record correct logic details, formulas, or theorems needed to solve it properly..."
                  value={correctExplanation}
                  onChange={(e) => setCorrectExplanation(e.target.value)}
                  className="w-full text-xs p-3 border border-[#E8E2D9] outline-none focus:border-[#5A5A40] rounded-xl bg-[#F5F2ED]/30 text-[#2D2A26]"
                  disabled={isSubmitting}
                ></textarea>
              </div>



              {/* Review status and date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-[#E8E2D9]/40">
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1">Logged Date</label>
                  <input
                    type="date"
                    value={dateLogged}
                    onChange={(e) => setDateLogged(e.target.value)}
                    className="w-full text-xs p-2 border border-[#E8E2D9] bg-[#F5F2ED]/40 text-[#2D2A26] rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1">Initial Status</label>
                  <select
                    value={status}
                    onChange={(e) => setStatus(e.target.value as ReviewStatus)}
                    className="w-full text-xs p-2 border border-[#E8E2D9] bg-[#F5F2ED]/40 text-[#2D2A26] rounded-xl"
                  >
                    <option value="New">New</option>
                    <option value="Reviewing">Reviewing</option>
                    <option value="Mastered">Mastered</option>
                  </select>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Buttons Row */}
        <div className="flex flex-col sm:flex-row justify-end items-center gap-3 pt-3">
          <button
            type="button"
            onClick={onNavigateToLibrary}
            className="w-full sm:w-auto px-6 py-3 border border-[#E8E2D9] hover:bg-[#F5F2ED] text-[#6B6357] rounded-xl text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer"
            disabled={isSubmitting}
          >
            Discard & Exit
          </button>
          <button
            type="submit"
            className="w-full sm:w-auto px-8 py-3.5 bg-[#D98A6C] hover:bg-[#C17A5E] disabled:opacity-50 text-white rounded-xl text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Logging...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 text-white fill-white" />
                Commit Mistake Log
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
}
