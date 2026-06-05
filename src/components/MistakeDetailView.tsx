/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry, MistakeCategory, ReviewStatus } from '../types';
import { ChevronLeft, Share2, Eye, FileImage, Sparkles, PencilLine, Trash2, Calendar, BookOpen, AlertTriangle, CheckSquare, Save, X, Lightbulb, FileText, ArrowRight, Maximize2, ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MistakeDetailViewProps {
  mistakeId: string;
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  mistakes: MistakeEntry[];
  editMistake: (id: string, fields: Partial<MistakeEntry>) => void;
  deleteMistake: (id: string) => void;
  onGoBack: () => void;
}

export function MistakeDetailView({
  mistakeId,
  subjects,
  topics,
  subtopics,
  mistakes,
  editMistake,
  deleteMistake,
  onGoBack,
}: MistakeDetailViewProps) {
  
  // Find current mistake entry
  const mistake = useMemo(() => {
    return mistakes.find((m) => m.id === mistakeId);
  }, [mistakes, mistakeId]);

  // Is editing state
  const [isEditing, setIsEditing] = useState(false);

  // Fullscreen image light box state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomScale, setZoomScale] = useState(1);

  // Form edit states
  const [editTitle, setEditTitle] = useState('');
  const [editSubjectId, setEditSubjectId] = useState('');
  const [editTopicId, setEditTopicId] = useState('');
  const [editSubtopicId, setEditSubtopicId] = useState('');
  const [editDate, setEditDate] = useState('');
  
  // Image links
  const [editImageUrl, setEditImageUrl] = useState('');

  // Learnings
  const [editOriginalQuestion, setEditOriginalQuestion] = useState('');
  const [editMyAnswer, setEditMyAnswer] = useState('');
  const [editCorrectAnswer, setEditCorrectAnswer] = useState('');
  const [editWhatGotWrong, setEditWhatGotWrong] = useState('');
  const [editCorrectExplanation, setEditCorrectExplanation] = useState('');

  // Reflection and Advice
  const [editReflection, setEditReflection] = useState('');
  const [editFutureAdvice, setEditFutureAdvice] = useState('');

  // Status & Tags
  const [editStatus, setEditStatus] = useState<ReviewStatus>('New');
  const [editCategories, setEditCategories] = useState<MistakeCategory[]>([]);

  // Category tags helper list
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

  // Initialize edit fields
  const handleStartEdit = () => {
    if (!mistake) return;
    setEditTitle(mistake.title);
    setEditSubjectId(mistake.subjectId);
    setEditTopicId(mistake.topicId);
    setEditSubtopicId(mistake.subtopicId || '');
    setEditDate(mistake.dateLogged);
    setEditImageUrl(mistake.imageUrl || '');
    
    setEditOriginalQuestion(mistake.originalQuestion);
    setEditMyAnswer(mistake.myAnswer || '');
    setEditCorrectAnswer(mistake.correctAnswer || '');
    setEditWhatGotWrong(mistake.whatIGotWrong || '');
    setEditCorrectExplanation(mistake.correctExplanation || '');

    setEditReflection(mistake.reflection);
    setEditFutureAdvice(mistake.futureAdvice);
    setEditStatus(mistake.status);
    setEditCategories([...mistake.categories]);

    setIsEditing(true);
  };

  // Form submission handler
  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editSubjectId || !editTopicId) {
      alert('Please fill out the subject and topic fields.');
      return;
    }

    if (editCategories.length === 0) {
      alert('Please select at least one Mistake Category Tag.');
      return;
    }

    const finalTitle = editCategories.join(' & ');

    editMistake(mistakeId, {
      title: finalTitle,
      subjectId: editSubjectId,
      topicId: editTopicId,
      subtopicId: editSubtopicId || undefined,
      dateLogged: editDate,
      imageUrl: editImageUrl ? editImageUrl.trim() : undefined,
      
      originalQuestion: editOriginalQuestion.trim(),
      myAnswer: editMyAnswer.trim(),
      correctAnswer: editCorrectAnswer.trim(),
      whatIGotWrong: '',
      correctExplanation: editCorrectExplanation.trim(),

      reflection: editReflection.trim(),
      futureAdvice: editFutureAdvice.trim(),
      status: editStatus,
      categories: editCategories,
    });

    setIsEditing(false);
  };

  // Quick state toggling directly in standard view mode (Feature 6 core workflow)
  const handleQuickStatusChange = (newStatus: ReviewStatus) => {
    editMistake(mistakeId, { status: newStatus });
  };

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleDelete = () => {
    deleteMistake(mistakeId);
    onGoBack();
  };

  // Copy sample reference link
  const handleShare = () => {
    navigator.clipboard.writeText(`${window.location.host}/mistake/${mistakeId}`);
    alert('Mock share link copied to clipboard!');
  };

  // Filtering subtopics and topics during editing
  const filteredTopics = useMemo(() => {
    return topics.filter((t) => t.subjectId === editSubjectId);
  }, [topics, editSubjectId]);

  const filteredSubtopics = useMemo(() => {
    return subtopics.filter((st) => st.topicId === editTopicId);
  }, [subtopics, editTopicId]);

  // Resolving text mapping for breadcrumbs
  const mappings = useMemo(() => {
    if (!mistake) return { subjectName: '', topicName: '', subtopicName: '' };
    const subName = subjects.find((s) => s.id === mistake.subjectId)?.name || 'Subject';
    const topName = topics.find((t) => t.id === mistake.topicId)?.name || 'Topic';
    const sbtName = subtopics.find((st) => st.id === mistake.subtopicId)?.name || '';
    return { subjectName: subName, topicName: topName, subtopicName: sbtName };
  }, [mistake, subjects, topics, subtopics]);

  // Handle Tag clicks during editing
  const toggleCategoryTag = (cat: MistakeCategory) => {
    setEditCategories((prev) => {
      if (prev.includes(cat)) {
        return prev.filter((c) => c !== cat);
      } else {
        return [...prev, cat];
      }
    });
  };

  // Mock Practice State
  const [practiceStatus, setPracticeStatus] = useState<string | null>(null);
  const triggerPractice = () => {
    setPracticeStatus('loading');
    setTimeout(() => {
      setPracticeStatus('loaded');
    }, 1200);
  };

  if (!mistake) {
    return (
      <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center text-[#6B6357] animate-fade-in">
        <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-[#C17A5E]" />
        <p className="text-sm font-semibold">Active mistake log not found.</p>
        <button onClick={onGoBack} className="mt-4 px-5 py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-xs font-bold uppercase tracking-wider rounded-full cursor-pointer transition-colors">
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Navigation Line Details */}
      <div className="flex items-center justify-between">
        <button
          onClick={onGoBack}
          className="flex items-center gap-1.5 text-[#4A453E] hover:text-[#2D2A26] font-sans text-xs font-bold bg-white px-3.5 py-2 border border-[#E8E2D9] rounded-full cursor-pointer shadow-sm transition-colors"
        >
          <ChevronLeft className="w-4 h-4" /> Go Back
        </button>

        {!isEditing && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleStartEdit}
              className="px-4 py-2 bg-[#F5F2ED] border border-[#E8E2D9] text-[#2D2A26] rounded-full font-sans text-xs font-bold hover:bg-[#E8E2D9] transition-colors flex items-center gap-1 cursor-pointer"
            >
              <PencilLine className="w-3.5 h-3.5 text-[#5A5A40]" /> Edit Log
            </button>
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="p-2 border border-red-100 bg-red-50/60 text-red-600 rounded-full hover:bg-red-100/80 transition-colors flex items-center justify-center cursor-pointer"
              title="Delete Mistake"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>

      {isEditing ? (
        /* FULL SCREEN EDIT MODE */
        <form onSubmit={handleSaveEdit} className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm space-y-6 animate-slide-up">
          <div className="flex justify-between items-center border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-xl font-bold text-[#2D2A26] flex items-center gap-2">
              <PencilLine className="w-5 h-5 text-[#5A5A40]" />
              Edit Mistake Entry
            </h3>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] text-xs font-bold rounded-full cursor-pointer transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-[#D98A6C] hover:bg-[#C17A5E] text-white text-xs font-bold rounded-full flex items-center gap-1 cursor-pointer transition-colors"
              >
                <Save className="w-3.5 h-3.5" /> Save Changes
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Left Box: Hierarchy and details */}
            <div className="md:col-span-2 space-y-4">

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subject Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Subject</label>
                  <select
                    value={editSubjectId}
                    onChange={(e) => {
                      setEditSubjectId(e.target.value);
                      setEditTopicId('');
                      setEditSubtopicId('');
                    }}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/50 text-[#2D2A26] focus:bg-white outline-none"
                    required
                  >
                    <option value="">Select Subject...</option>
                    {subjects.map((sub) => (
                      <option key={sub.id} value={sub.id}>{sub.name}</option>
                    ))}
                  </select>
                </div>

                {/* Topic Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Topic</label>
                  <select
                    value={editTopicId}
                    onChange={(e) => {
                      setEditTopicId(e.target.value);
                      setEditSubtopicId('');
                    }}
                    disabled={!editSubjectId}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/50 text-[#2D2A26] disabled:opacity-55"
                    required
                  >
                    <option value="">Select Topic...</option>
                    {filteredTopics.map((top) => (
                      <option key={top.id} value={top.id}>{top.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Subtopic Selector */}
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Subtopic (Optional)</label>
                  <select
                    value={editSubtopicId}
                    onChange={(e) => setEditSubtopicId(e.target.value)}
                    disabled={!editTopicId}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/50 text-[#4A453E] disabled:opacity-55"
                  >
                    <option value="">No subtopic selected</option>
                    {filteredSubtopics.map((st) => (
                      <option key={st.id} value={st.id}>{st.name}</option>
                    ))}
                  </select>
                </div>

                {/* Date */}
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Date Logged</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/50 text-[#2D2A26]"
                    required
                  />
                </div>
              </div>

              {/* Learning section fields */}
              <div className="border-t border-[#E8E2D9] pt-4 space-y-4">
                <span className="font-serif text-sm font-semibold text-[#2D2A26] block mb-2">Learning Sections</span>
                
                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Original Question</label>
                  <textarea
                    rows={2}
                    value={editOriginalQuestion}
                    onChange={(e) => setEditOriginalQuestion(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl outline-none focus:border-[#5A5A40] bg-[#F5F2ED]/30 text-[#2D2A26]"
                    placeholder="Enter the source question..."
                    required
                  ></textarea>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">My Answer</label>
                    <textarea
                      rows={2}
                      value={editMyAnswer}
                      onChange={(e) => setEditMyAnswer(e.target.value)}
                      className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/30 text-[#2D2A26]"
                      placeholder="What was your initial response?"
                    ></textarea>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Correct Answer</label>
                    <textarea
                      rows={2}
                      value={editCorrectAnswer}
                      onChange={(e) => setEditCorrectAnswer(e.target.value)}
                      className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/30 text-[#2D2A26]"
                      placeholder="What was the correct solution?"
                    ></textarea>
                  </div>
                </div>



                <div>
                  <label className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-widest mb-1">Correct explanation or reasoning</label>
                  <textarea
                    rows={3}
                    value={editCorrectExplanation}
                    onChange={(e) => setEditCorrectExplanation(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#F5F2ED]/30 text-[#2D2A26]"
                    placeholder="Provide detailed proof concepts, formulas..."
                  ></textarea>
                </div>
              </div>

              {/* Reflection and advice */}
              <div className="border-t border-[#E8E2D9] pt-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest mb-1">Reflection ("What did I misunderstand?")</label>
                  <textarea
                    rows={4}
                    value={editReflection}
                    onChange={(e) => setEditReflection(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#E8E2D9] rounded-xl bg-[#FDFCF8] text-[#2D2A26]"
                    placeholder="Briefly analyze why you fell into this trap..."
                    required
                  ></textarea>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1">Advice Note ("What should I remember next time?")</label>
                  <textarea
                    rows={4}
                    value={editFutureAdvice}
                    onChange={(e) => setEditFutureAdvice(e.target.value)}
                    className="w-full text-xs p-2.5 border border-[#8DA38A] rounded-xl bg-[#F5F2ED] text-[#2D2A26]"
                    placeholder="A key visual warning for your future self..."
                    required
                  ></textarea>
                </div>
              </div>
            </div>

            {/* Right Box: Status and Category Tags checkboxes */}
            <div className="col-span-1 space-y-6">
              
              {/* Status Picker */}
              <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9]">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2">Review Status</label>
                <div className="space-y-2 font-sans">
                  {(['New', 'Reviewing', 'Mastered'] as ReviewStatus[]).map((st) => (
                    <label key={st} className="flex items-center gap-2 text-xs text-[#2D2A26] cursor-pointer">
                      <input
                        type="radio"
                        name="edit_status"
                        value={st}
                        checked={editStatus === st}
                        onChange={() => setEditStatus(st)}
                        className="rounded-full text-[#5A5A40] border-[#E8E2D9] focus:ring-0 checked:bg-[#5A5A40] checked:border-[#5A5A40]"
                      />
                      <span className={editStatus === st ? 'font-bold text-black' : ''}>{st}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image capture url */}
              <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9] space-y-2">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1">Question Image URL (Hotlink)</label>
                <input
                  type="text"
                  placeholder="e.g. https://unsp...img.jpg"
                  value={editImageUrl}
                  onChange={(e) => setEditImageUrl(e.target.value)}
                  className="w-full text-xs p-2 border border-[#E8E2D9] bg-white text-[#2D2A26] rounded-lg outline-none focus:border-[#5A5A40]"
                />
                <span className="text-[9px] text-[#6B6357] block leading-tight">Optional. Paste a direct link to any math, diagram, or homework equation picture.</span>
              </div>

              {/* Multi-select Tags Checkbox Group */}
              <div className="bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9]">
                <label className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-2">Mistake Categories (Multi-select)</label>
                <div className="space-y-1.5 h-[230px] overflow-y-auto pr-1">
                  {allCategories.map((cat) => {
                    const isChecked = editCategories.includes(cat);
                    return (
                      <div
                        key={cat}
                        onClick={() => toggleCategoryTag(cat)}
                        className={`flex items-center justify-between text-xs p-2 rounded-lg cursor-pointer border transition-colors ${isChecked ? 'bg-[#5A5A40] text-white border-[#5A5A40]' : 'bg-white border-[#E8E2D9] text-[#2D2A26] hover:bg-[#F5F2ED]'}`}
                      >
                        <span>{cat}</span>
                        {isChecked && <CheckSquare className="w-3.5 h-3.5 text-[#E8E2D9]" />}
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          </div>
        </form>
      ) : (
        /* STANDARD DETAILED VIEW MODE matches mock screen 3 styled completely */
        <div className="space-y-6">
          
          {/* Breadcrumbs and active status banner */}
          <div className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
              <div className="space-y-1">
                <nav className="flex items-center gap-1.5 text-[#9A9184] font-sans text-[10px] font-bold uppercase tracking-widest">
                  <span className="hover:text-[#5A5A40] cursor-pointer transition-colors">Subjects</span>
                  <span>/</span>
                  <span className="hover:text-[#5A5A40] cursor-pointer transition-colors">{mappings.subjectName}</span>
                  <span>/</span>
                  <span className="text-[#2D2A26]">{mappings.topicName}</span>
                </nav>
                <h2 className="font-serif text-2xl md:text-3xl font-semibold text-[#2D2A26] mt-1">
                  {mistake.title}
                </h2>
              </div>
              
              {/* Quick Status workflow actions */}
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                
                {/* 3 Status selection bubbles directly in view */}
                <div className="bg-[#F5F2ED] p-1 rounded-full border border-[#E8E2D9] flex items-center gap-0.5">
                  {(['New', 'Reviewing', 'Mastered'] as ReviewStatus[]).map((st) => {
                    const isActive = mistake.status === st;
                    let activeStyles = 'bg-[#5A5A40] text-white font-bold';
                    if (st === 'Reviewing' && isActive) activeStyles = 'bg-[#D98A6C] text-white font-bold';
                    if (st === 'Mastered' && isActive) activeStyles = 'bg-[#8DA38A] text-white font-bold';
                    
                    return (
                      <button
                        key={st}
                        onClick={() => handleQuickStatusChange(st)}
                        className={`px-3 py-1 font-sans text-xs rounded-full transition-all cursor-pointer ${isActive ? activeStyles : 'text-[#6B6357] hover:text-[#2D2A26]'}`}
                      >
                        {st}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleShare}
                  className="w-9 h-9 rounded-full flex items-center justify-center border border-[#E8E2D9] hover:bg-[#F5F2ED] transition-colors shadow-sm bg-white"
                  title="Share Reference"
                >
                  <Share2 className="w-4 h-4 text-[#2D2A26]" />
                </button>
              </div>
            </div>
          </div>

          {/* Bento Grid Layout Split */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
            
            {/* LEFT COLUMN: Original Question & Deep explanation cards */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Card 1: Original Question */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-sm">
                <h3 className="font-serif text-lg font-bold text-[#2D2A26] flex items-center gap-2 mb-4">
                  <Eye className="w-5 h-5 text-[#5A5A40]" />
                  Original Question
                </h3>

                {/* Picture Image representation matched with Quantum equations from chalk template direct */}
                {mistake.imageUrl && (
                  <div 
                    onClick={() => {
                      setIsFullscreen(true);
                      setZoomScale(1);
                    }}
                    className="aspect-video w-full rounded-xl bg-stone-950 flex items-center justify-center overflow-hidden mb-4 relative group shadow-inner cursor-pointer"
                  >
                    <img
                      src={mistake.imageUrl}
                      alt="equations"
                      className="w-full h-full object-cover opacity-80 group-hover:scale-105 transition-transform duration-700 border border-black/10"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100 duration-300">
                      <span className="bg-[#2D2A26]/90 text-[#FDFCF8] px-4 py-2 rounded-full font-sans text-xs font-bold flex items-center gap-1.5 shadow-lg border border-[#E8E2D9]/20 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300">
                        <Maximize2 className="w-4 h-4 text-[#D98A6C]" /> View Fullscreen
                      </span>
                    </div>
                    <div className="absolute bottom-3 left-3 bg-white/95 backdrop-blur-sm px-3.5 py-1.5 rounded-full font-sans text-[10px] font-bold text-[#2D2A26] border border-[#E8E2D9]">
                      Captured reference image
                    </div>
                  </div>
                )}

                <div className="prose max-w-none text-[#2D2A26] font-serif text-lg leading-relaxed bg-[#F5F2ED]/60 p-4 rounded-xl border border-[#E8E2D9]">
                  "{mistake.originalQuestion}"
                </div>

                {/* Sub Answers split representation */}
                {(mistake.myAnswer || mistake.correctAnswer) && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4 bg-[#F5F2ED]/40 p-4 rounded-xl border border-dashed border-[#E8E2D9]">
                    {mistake.myAnswer && (
                      <div>
                        <span className="block text-[10px] font-bold text-[#C17A5E] uppercase tracking-widest mb-1 font-sans">My Answer</span>
                        <p className="text-xs text-[#2D2A26] leading-relaxed font-sans">{mistake.myAnswer}</p>
                      </div>
                    )}
                    {mistake.correctAnswer && (
                      <div>
                        <span className="block text-[10px] font-bold text-[#5A5A40] uppercase tracking-widest mb-1 font-sans">Correct Answer</span>
                        <p className="text-xs text-[#2D2A26] leading-relaxed font-sans font-semibold">{mistake.correctAnswer}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Card 2: Deep Dive Explanation */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-sm space-y-4">
                <h3 className="font-serif text-lg font-bold text-[#2D2A26] flex items-center gap-2">
                  <Lightbulb className="w-5 h-5 text-[#D98A6C]" />
                  Deep Dive Explanation
                </h3>



                <div className="space-y-2">
                  <span className="block text-[10px] font-bold text-[#9A9184] uppercase tracking-wider font-sans">Correct Explanation</span>
                  <p className="font-sans text-sm text-[#4A453E] leading-relaxed bg-[#F5F2ED]/55 p-4 rounded-xl border border-[#E8E2D9]">
                    {mistake.correctExplanation}
                  </p>
                </div>
              </div>

            </div>

            {/* RIGHT COLUMN: Reflection & Future self advice tags */}
            <div className="lg:col-span-4 space-y-6">
              
              {/* Card 3: Reflection */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm space-y-4">
                <h3 className="font-serif text-base font-bold text-[#2D2A26] flex items-center gap-2">
                  <FileText className="w-4.5 h-4.5 text-[#5A5A40]" />
                  Reflection
                </h3>
                <p className="font-sans text-xs text-[#4A453E] italic leading-relaxed bg-[#F5F2ED]/40 p-3 rounded-lg border border-[#E8E2D9]/60">
                  "{mistake.reflection}"
                </p>

                {/* Tags list */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[#E8E2D9]">
                  {mistake.categories.map((cat) => (
                    <span key={cat} className="px-3 py-1 bg-[#E8E2D9] text-[#4A453E] border border-[#E8E2D9] rounded-full font-sans text-[9px] font-bold uppercase tracking-tight">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>

              {/* Card 4: Future Self Advice on Warm Neutral Background */}
              <div className="bg-[#F5F2ED] border border-[#E8E2D9] rounded-2xl p-6 shadow-sm relative overflow-hidden group">
                <div className="absolute -right-4 -top-4 w-24 h-24 bg-[#8DA38A]/10 rounded-full blur-2xl pointer-events-none group-hover:scale-150 transition-transform duration-1000"></div>
                
                <h3 className="font-serif text-base font-bold text-[#2D2A26] flex items-center gap-2 mb-3 relative z-10">
                  <Sparkles className="w-4.5 h-4.5 text-[#5A5A40]" />
                  Future Self Advice
                </h3>

                {/* Custom scribble script italic look */}
                <div className="font-serif italic text-lg text-[#2D2A26] mb-5 relative z-10 font-semibold leading-relaxed">
                  "{mistake.futureAdvice}"
                </div>

                <div className="flex items-center gap-1.5 text-[#6B6357] text-[10px] font-sans font-medium relative z-10 border-t border-[#E8E2D9]/80 pt-2">
                  <Calendar className="w-3.5 h-3.5 opacity-60 text-[#5A5A40]" />
                  <span>Logged {mistake.dateLogged} by Julian</span>
                </div>
              </div>

              {/* Card 5: Mastery track progress */}
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-sm space-y-4">
                <h4 className="font-sans text-[10px] font-bold text-[#2D2A26] uppercase tracking-wider block">Mastery Track Progress</h4>
                
                {/* Simulated Mastery levels */}
                <div className="space-y-1.5">
                  <div className="w-full bg-[#F5F2ED] border border-[#E8E2D9] h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-700 ${mistake.status === 'Mastered' ? 'bg-[#8DA38A] w-full' : mistake.status === 'Reviewing' ? 'bg-[#D98A6C] w-[65%]' : 'bg-[#C17A5E] w-[20%]'}`}
                    ></div>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-sans font-bold text-[#6B6357] uppercase">
                    <span>
                      {mistake.status === 'Mastered' ? 'Level: Mastered (100%)' : mistake.status === 'Reviewing' ? 'Level: Intermediate (65%)' : 'Level: Unresolved (20%)'}
                    </span>
                    <span>
                      {mistake.status === 'Mastered' ? 'Done' : mistake.status === 'Reviewing' ? '65%' : 'Retry'}
                    </span>
                  </div>
                </div>

                {/* Quick Practice Trigger and result */}
                <div className="pt-2">
                  {practiceStatus === 'loaded' ? (
                    <div className="bg-[#F5F2ED] border border-[#8DA38A]/60 p-2.5 rounded-xl text-[#5A5A40] text-xs flex items-center gap-1.5 animate-fade-in font-sans">
                      <Sparkles className="w-4 h-4 text-[#8DA38A]" /> Practice simulation load verified. Recommended concept logs updated.
                    </div>
                  ) : (
                    <button
                      onClick={triggerPractice}
                      disabled={practiceStatus === 'loading'}
                      className="w-full py-2.5 bg-[#5A5A40] hover:bg-[#4A453E] text-white rounded-full font-sans text-xs font-bold uppercase tracking-widest flex items-center justify-center gap-1 transition-all active:scale-95 cursor-pointer"
                    >
                      {practiceStatus === 'loading' ? 'Simulating...' : 'Practice Similar'}
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

            </div>

          </div>

        </div>
      )}

      {showDeleteConfirm && mistake && (
        <div className="fixed inset-0 bg-[#2D2A26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-2xl p-6 shadow-xl max-w-sm w-full animate-scale-up space-y-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#2D2A26]">Confirm Deletion</h4>
              <p className="text-xs text-[#6B6357] mt-2 leading-relaxed">
                Deletions are permanent! Are you sure you want to delete the mistake log <strong>"{mistake.title}"</strong>?
              </p>
            </div>
            <div className="flex gap-2 justify-center font-sans text-xs pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] rounded-full transition-colors cursor-pointer font-bold"
              >
                No, Keep It
              </button>
              <button
                type="button"
                onClick={() => {
                  handleDelete();
                  setShowDeleteConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {isFullscreen && mistake?.imageUrl && (
        <div className="fixed inset-0 bg-[#2D2A26]/95 backdrop-blur-md flex flex-col z-50 select-none animate-fade-in">
          {/* Header toolbar */}
          <div className="flex items-center justify-between p-4 bg-[#2D2A26]/80 border-b border-[#E8E2D9]/10 text-white font-sans">
            <div className="flex flex-col text-left">
              <span className="text-[9px] font-bold uppercase tracking-widest text-[#D98A6C]">Fullscreen Mode</span>
              <h4 className="text-xs font-serif font-bold text-[#FDFCF8] max-w-[200px] md:max-w-md line-clamp-1">{mistake.title}</h4>
            </div>
            
            {/* Control buttons */}
            <div className="flex items-center gap-1.5 md:gap-2">
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.max(0.5, prev - 0.25))}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom Out"
              >
                <ZoomOut className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <span className="text-[10px] md:text-xs font-mono font-bold text-[#9A9184] min-w-[32px] md:min-w-[40px] text-center">
                {Math.round(zoomScale * 100)}%
              </span>
              <button
                type="button"
                onClick={() => setZoomScale(prev => Math.min(4, prev + 0.25))}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Zoom In"
              >
                <ZoomIn className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              <button
                type="button"
                onClick={() => setZoomScale(1)}
                className="p-1.5 md:p-2 bg-[#F5F2ED]/10 hover:bg-[#F5F2ED]/20 text-[#E8E2D9] hover:text-white rounded-lg transition-colors cursor-pointer"
                title="Reset Zoom"
              >
                <RotateCcw className="w-3.5 h-3.5 md:w-4 md:h-4" />
              </button>
              
              <div className="w-[1px] h-5 bg-[#E8E2D9]/10 mx-0.5 md:mx-1"></div>
              
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
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
            onClick={() => setIsFullscreen(false)}
          >
            <div 
              className="transition-transform duration-200 ease-out origin-center select-none"
              style={{ transform: `scale(${zoomScale})` }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={mistake.imageUrl}
                alt={mistake.title}
                className="max-h-[75vh] max-w-full md:max-h-[80vh] object-contain rounded-lg border border-[#E8E2D9]/20 shadow-2xl pointer-events-auto"
                style={{ cursor: zoomScale > 1 ? 'grab' : 'zoom-in' }}
                onClick={() => {
                  // Click image to toggle zoom
                  if (zoomScale === 1) {
                    setZoomScale(1.75);
                  } else {
                    setZoomScale(1);
                  }
                }}
              />
            </div>
          </div>
          
          {/* Footer usage tip */}
          <div className="p-2.5 bg-[#2D2A26] text-center text-[9px] font-sans font-medium text-[#9A9184]/70 border-t border-[#E8E2D9]/5">
            Tip: Use the zoom buttons, scroll/swipe, or tap the image to toggle scale. Tap backdrop to exit.
          </div>
        </div>
      )}

    </div>
  );
}
