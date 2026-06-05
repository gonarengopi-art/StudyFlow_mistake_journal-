/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry } from '../types';
import { BookOpen, FolderOpen, MoreVertical, Edit2, Trash2, Plus, ChevronDown, ChevronRight, FolderPlus, Eye, AlertCircle, Sparkles, LayoutGrid, CheckSquare, RotateCcw } from 'lucide-react';

interface SubjectsTopicsViewProps {
  subjects: Subject[];
  topics: Topic[];
  subtopics: Subtopic[];
  mistakes: MistakeEntry[];
  
  addSubject: (name: string) => string | Promise<string>;
  editSubject: (id: string, name: string) => void;
  deleteSubject: (id: string) => void;
  
  addTopic: (subjectId: string, name: string) => string | Promise<string>;
  editTopic: (id: string, name: string) => void;
  deleteTopic: (id: string) => void;
  
  addSubtopic: (topicId: string, name: string) => string | Promise<string>;
  editSubtopic: (id: string, name: string) => void;
  deleteSubtopic: (id: string) => void;
  
  onSelectMistake: (id: string) => void;
  deleteMistake: (id: string) => void;
  initialSelectedSubjectId?: string;
  onNavigateToCreate: () => void;
  onTriggerReview?: (subjectId?: string, topicId?: string) => void;
}

export function SubjectsTopicsView({
  subjects,
  topics,
  subtopics,
  mistakes,
  addSubject,
  editSubject,
  deleteSubject,
  addTopic,
  editTopic,
  deleteTopic,
  addSubtopic,
  editSubtopic,
  deleteSubtopic,
  onSelectMistake,
  deleteMistake,
  initialSelectedSubjectId,
  onNavigateToCreate,
  onTriggerReview,
}: SubjectsTopicsViewProps) {
  
  // Selected state
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>(() => {
    if (initialSelectedSubjectId) return initialSelectedSubjectId;
    return subjects.length > 0 ? subjects[0].id : '';
  });

  // Active inputs for adds and edits
  const [showAddSubject, setShowAddSubject] = useState(false);
  const [newSubjectName, setNewSubjectName] = useState('');
  
  const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
  const [editingSubjectName, setEditingSubjectName] = useState('');

  const [showAddTopic, setShowAddTopic] = useState(false);
  const [newTopicName, setNewTopicName] = useState('');
  
  const [editingTopicId, setEditingTopicId] = useState<string | null>(null);
  const [editingTopicName, setEditingTopicName] = useState('');

  const [addingSubtopicToTopicId, setAddingSubtopicToTopicId] = useState<string | null>(null);
  const [newSubtopicName, setNewSubtopicName] = useState('');
  
  const [editingSubtopicId, setEditingSubtopicId] = useState<string | null>(null);
  const [editingSubtopicName, setEditingSubtopicName] = useState('');

  // Expandable topics and subtopics for viewing mistakes
  const [expandedTopicIds, setExpandedTopicIds] = useState<Record<string, boolean>>({});
  const [expandedSubtopicIds, setExpandedSubtopicIds] = useState<Record<string, boolean>>({});

  const [deleteConfirm, setDeleteConfirm] = useState<{
    type: 'subject' | 'topic' | 'subtopic' | 'mistake';
    id: string;
    name: string;
  } | null>(null);

  // Reset selected subject ID if list changes or selected is empty
  useMemo(() => {
    if (initialSelectedSubjectId) {
      setSelectedSubjectId(initialSelectedSubjectId);
    } else if (subjects.length > 0 && (!selectedSubjectId || !subjects.some((s) => s.id === selectedSubjectId))) {
      setSelectedSubjectId(subjects[0].id);
    }
  }, [subjects, initialSelectedSubjectId]);

  const selectedSubject = useMemo(() => {
    return subjects.find((s) => s.id === selectedSubjectId);
  }, [subjects, selectedSubjectId]);

  // Compute calculated values for selected subject
  const currentSubjectStats = useMemo(() => {
    if (!selectedSubjectId) return { total: 0, unresolved: 0, mastery: 100, focusScore: 'A+' };
    
    const subMistakes = mistakes.filter((m) => m.subjectId === selectedSubjectId);
    const total = subMistakes.length;
    const unresolved = subMistakes.filter((m) => m.status !== 'Mastered').length;
    const mastered = subMistakes.filter((m) => m.status === 'Mastered').length;
    const mastery = total > 0 ? Math.round((mastered / total) * 100) : 100;
    
    // Focus score calculation based on percentage resolved
    let focusScore = 'A+';
    if (mastery < 50) focusScore = 'C-';
    else if (mastery < 65) focusScore = 'B-';
    else if (mastery < 75) focusScore = 'B+';
    else if (mastery < 85) focusScore = 'A-';
    else if (mastery < 95) focusScore = 'A';

    return { total, unresolved, mastery, focusScore };
  }, [selectedSubjectId, mistakes]);

  // Filter topics and subtopics for chosen subject
  const currentTopics = useMemo(() => {
    return topics.filter((t) => t.subjectId === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  const currentSubtopics = useMemo(() => {
    const topicIds = currentTopics.map((t) => t.id);
    return subtopics.filter((st) => topicIds.includes(st.topicId));
  }, [subtopics, currentTopics]);

  // Toggle helpers
  const toggleTopic = (id: string) => {
    setExpandedTopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleSubtopic = (id: string) => {
    setExpandedSubtopicIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // SUBJECT HANDLERS
  const handleCreateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectName.trim()) return;
    const id = addSubject(newSubjectName.trim());
    setSelectedSubjectId(id);
    setNewSubjectName('');
    setShowAddSubject(false);
  };

  const handleUpdateSubject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubjectName.trim() || !editingSubjectId) return;
    editSubject(editingSubjectId, editingSubjectName.trim());
    setEditingSubjectId(null);
  };

  const executeConfirmedDelete = () => {
    if (!deleteConfirm) return;
    const { type, id } = deleteConfirm;
    if (type === 'subject') {
      deleteSubject(id);
      if (selectedSubjectId === id) {
        const remaining = subjects.filter((s) => s.id !== id);
        setSelectedSubjectId(remaining.length > 0 ? remaining[0].id : '');
      }
    } else if (type === 'topic') {
      deleteTopic(id);
    } else if (type === 'subtopic') {
      deleteSubtopic(id);
    } else if (type === 'mistake') {
      deleteMistake(id);
    }
    setDeleteConfirm(null);
  };

  const handleDeleteSubject = (id: string) => {
    const subName = subjects.find(s => s.id === id)?.name || 'Subject';
    setDeleteConfirm({ type: 'subject', id, name: subName });
  };

  // TOPIC HANDLERS
  const handleCreateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTopicName.trim() || !selectedSubjectId) return;
    addTopic(selectedSubjectId, newTopicName.trim());
    setNewTopicName('');
    setShowAddTopic(false);
  };

  const handleUpdateTopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTopicName.trim() || !editingTopicId) return;
    editTopic(editingTopicId, editingTopicName.trim());
    setEditingTopicId(null);
  };

  const handleDeleteTopic = (id: string) => {
    const topicName = topics.find(t => t.id === id)?.name || 'Topic';
    setDeleteConfirm({ type: 'topic', id, name: topicName });
  };

  // SUBTOPIC HANDLERS
  const handleCreateSubtopic = (e: React.FormEvent, topicId: string) => {
    e.preventDefault();
    if (!newSubtopicName.trim()) return;
    addSubtopic(topicId, newSubtopicName.trim());
    setNewSubtopicName('');
    setAddingSubtopicToTopicId(null);
  };

  const handleUpdateSubtopic = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSubtopicName.trim() || !editingSubtopicId) return;
    editSubtopic(editingSubtopicId, editingSubtopicName.trim());
    setEditingSubtopicId(null);
  };

  const handleDeleteSubtopic = (id: string) => {
    const subtopicName = subtopics.find(st => st.id === id)?.name || 'Subtopic';
    setDeleteConfirm({ type: 'subtopic', id, name: subtopicName });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 animate-fade-in">
      
      {/* LEFT COLUMN: Subject Management Column */}
      <div className="lg:col-span-1 space-y-6">
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-4 shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b border-[#E8E2D9] pb-3">
            <h3 className="font-serif text-lg font-semibold text-[#2D2A26] flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-[#9A9184]" />
              Subjects
            </h3>
            <button
              onClick={() => setShowAddSubject(!showAddSubject)}
              className="p-1 px-2.5 bg-[#5A5A40]/10 text-[#5A5A40] rounded-full hover:bg-[#5A5A40]/20 transition-colors font-sans text-xs font-bold flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" /> Subject
            </button>
          </div>

          {/* New Subject Form Inline */}
          {showAddSubject && (
            <form onSubmit={handleCreateSubject} className="mb-4 bg-stone-50 p-3 rounded-xl border border-gray-100 animate-slide-down">
              <input
                type="text"
                placeholder="e.g. Cognitive Biology"
                value={newSubjectName}
                onChange={(e) => setNewSubjectName(e.target.value)}
                className="w-full text-xs p-2 rounded-lg border border-gray-200 outline-none focus:border-stone-400 mb-2 bg-white"
                autoFocus
              />
              <div className="flex justify-end gap-1.5 text-[10px]">
                <button
                  type="button"
                  onClick={() => setShowAddSubject(false)}
                  className="px-2.5 py-1 bg-[#F5F2ED] text-[#6B6357] rounded-md hover:bg-[#E8E2D9] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-2.5 py-1 bg-[#D98A6C] text-[#FDFCF8] rounded-md font-bold hover:bg-[#C17A5E] transition-colors cursor-pointer"
                >
                  Confirm
                </button>
              </div>
            </form>
          )}

          {/* Subjects Navigation Pills List */}
          <div className="space-y-1.5 max-h-[400px] overflow-y-auto pr-1">
            {subjects.map((sub) => {
              const isSelected = sub.id === selectedSubjectId;
              const subMistakeCount = mistakes.filter((m) => m.subjectId === sub.id).length;

              const isEditing = editingSubjectId === sub.id;

              if (isEditing) {
                return (
                  <form onSubmit={handleUpdateSubject} className="p-2 bg-stone-50 rounded-xl" key={sub.id}>
                    <input
                      type="text"
                      value={editingSubjectName}
                      onChange={(e) => setEditingSubjectName(e.target.value)}
                      className="w-full text-xs p-1.5 rounded border border-gray-200 bg-white"
                      autoFocus
                    />
                    <div className="flex justify-end gap-1 mt-1 text-[9px]">
                      <button
                        type="button"
                        onClick={() => setEditingSubjectId(null)}
                        className="px-2 py-0.5 bg-[#F5F2ED] text-[#6B6357] rounded cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2 py-0.5 bg-[#D98A6C] text-[#FDFCF8] rounded font-bold cursor-pointer hover:bg-[#C17A5E]"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                );
              }

              return (
                <div
                  key={sub.id}
                  onClick={() => setSelectedSubjectId(sub.id)}
                  className={`w-full group px-3.5 py-2.5 rounded-xl text-left flex justify-between items-center transition-all cursor-pointer ${isSelected ? 'bg-[#5A5A40] text-[#FDFCF8] shadow-sm' : 'bg-transparent text-[#4A453E] hover:bg-[#5A5A40]/10'}`}
                >
                  <span className="font-sans text-sm font-medium truncate pr-2">{sub.name}</span>
                  
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${isSelected ? 'bg-[#FDFCF8]/20 text-[#FDFCF8]' : 'bg-[#F5F2ED] text-[#9A9184]'}`}>
                      {subMistakeCount}
                    </span>
                    <div className="hidden group-hover:flex items-center gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingSubjectId(sub.id);
                          setEditingSubjectName(sub.name);
                        }}
                        className={`p-1 rounded hover:bg-[#F5F2ED]/20 ${isSelected ? 'hover:bg-[#FDFCF8]/10 text-white/70' : 'text-[#9A9184] hover:text-[#2D2A26]'}`}
                      >
                        <Edit2 className="w-3 h-3" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSubject(sub.id);
                        }}
                        className={`p-1 rounded hover:bg-[#F5F2ED]/20 ${isSelected ? 'hover:bg-[#FDFCF8]/10 text-red-300' : 'text-red-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Short info / help box */}
        <div className="bg-[#F5F2ED] border border-[#E8E2D9] rounded-2xl p-4 text-xs text-[#6B6357] leading-relaxed">
          <p className="font-bold text-[#2D2A26] mb-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-[#D98A6C]" />
            StudyFlow Directory Map
          </p>
          Select a subject to populate its modules. Click a module card to expand subtopics and view its logs directly on the spot.
        </div>
      </div>

      {/* RIGHT COLUMN: Selected Subject Overview + Nested Sub/Topic hierarchy */}
      <div className="lg:col-span-3 space-y-6">
        
        {/* Active Subject Jumbotron */}
        <div className="bg-white border border-[#E8E2D9] rounded-2xl p-6 shadow-sm">
          {selectedSubject ? (
            <>
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 border-b border-[#E8E2D9] pb-5">
                <div>
                  <span className="font-sans text-xs font-semibold text-[#D98A6C] bg-[#D98A6C]/10 px-3 py-1 rounded-full uppercase tracking-wider inline-block mb-3 animate-fade-in">
                    Current Subject
                  </span>
                  <h2 className="font-serif text-3xl md:text-4xl italic font-semibold text-[#2D2A26] tracking-tight mb-2">
                    {selectedSubject.name}
                  </h2>
                  <p className="font-sans text-sm text-[#6B6357]">
                    A secure repository keeping {currentSubjectStats.total} historical mistake entries organized under specific subtopics.
                  </p>
                </div>
                
                <div className="flex flex-wrap gap-2 shrink-0 md:self-end">
                  {onTriggerReview && currentSubjectStats.unresolved > 0 && (
                    <button
                      type="button"
                      onClick={() => onTriggerReview(selectedSubject.id)}
                      className="px-4.5 py-2.5 bg-[#5A5A40] text-white text-xs font-semibold font-sans rounded-full hover:bg-[#4D4D36] transition-colors flex items-center gap-1.5 cursor-pointer shadow-xs font-bold"
                      title={`Review mistakes for ${selectedSubject.name}`}
                    >
                      <RotateCcw className="w-3.5 h-3.5 text-[#D98A6C]" /> PRACTICE {selectedSubject.name.toUpperCase()}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => setShowAddTopic(!showAddTopic)}
                    className="px-4 py-2.5 bg-[#D98A6C] text-[#FDFCF8] text-xs font-semibold font-sans rounded-full hover:bg-[#C17A5E] transition-colors flex items-center gap-1.5 cursor-pointer font-bold"
                  >
                    <Plus className="w-4 h-4" /> NEW TOPIC
                  </button>
                </div>
              </div>

              {/* Stats Strip */}
              <div className="mt-5 grid grid-cols-2 md:grid-cols-4 gap-4 bg-[#F5F2ED] p-4 rounded-xl border border-[#E8E2D9]">
                <div>
                  <span className="block text-[10px] font-semibold text-[#9A9184] uppercase tracking-widest mb-0.5">Total Mistakes</span>
                  <span className="text-xl font-bold font-serif text-[#2D2A26]">{currentSubjectStats.total}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-[#9A9184] uppercase tracking-widest mb-0.5">Unresolved</span>
                  <span className="text-xl font-bold font-serif text-red-600">{currentSubjectStats.unresolved}</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-[#9A9184] uppercase tracking-widest mb-0.5">Mastery Rate</span>
                  <span className="text-xl font-bold font-serif text-[#2D2A26]">{currentSubjectStats.mastery}%</span>
                </div>
                <div>
                  <span className="block text-[10px] font-semibold text-[#9A9184] uppercase tracking-widest mb-0.5">Focus Score</span>
                  <span className="text-xl font-bold font-serif text-[#5A5A40]">{currentSubjectStats.focusScore}</span>
                </div>
              </div>
            </>
          ) : (
            <div className="text-center py-10 text-gray-400">
              <AlertCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Please create or select a subject to begin mapping mistake logs.</p>
            </div>
          )}
        </div>

        {/* Create Topic Inline Input Grid */}
        {showAddTopic && (
          <form onSubmit={handleCreateTopic} className="bg-[#5A5A40]/10 border border-[#5A5A40]/30 rounded-2xl p-4 flex items-center gap-3 animate-slide-down">
            <div className="flex-1">
              <label className="block text-[10px] font-bold text-[#5A5A40] uppercase mb-1">Create Topic for {selectedSubject?.name}</label>
              <input
                type="text"
                placeholder="e.g. Dihybrid Cross Inheritance"
                value={newTopicName}
                onChange={(e) => setNewTopicName(e.target.value)}
                className="w-full text-sm p-2 rounded-xl border border-[#E8E2D9] outline-none focus:border-[#5A5A40] bg-white"
                autoFocus
              />
            </div>
            <div className="flex gap-1.5 shrink-0 pt-5">
              <button
                type="button"
                onClick={() => setShowAddTopic(false)}
                className="px-3.5 py-2 bg-[#F5F2ED] text-[#6B6357] text-xs font-medium rounded-full cursor-pointer hover:bg-[#E8E2D9] transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-[#D98A6C] text-[#FDFCF8] text-xs font-bold rounded-full cursor-pointer hover:bg-[#C17A5E] transition-colors"
              >
                Create
              </button>
            </div>
          </form>
        )}

        {/* Modules Header */}
        <div className="flex justify-between items-center px-1">
          <h3 className="font-serif text-xl font-medium text-[#2D2A26]">Core Modules</h3>
          <span className="font-sans text-xs text-[#9A9184]">{currentTopics.length} topics mapped</span>
        </div>

        {/* Topics List Card Deck */}
        <div className="space-y-4">
          {currentTopics.length === 0 ? (
            <div className="bg-white border border-[#E8E2D9] rounded-2xl p-12 text-center text-[#9A9184]">
              <FolderOpen className="w-8 h-8 mx-auto mb-2 opacity-30 text-[#5A5A40]" />
              <p className="text-sm font-medium mb-1">No topics under this subject</p>
              <p className="text-xs mb-4">Partition your subject into manageable topic chapters.</p>
              <button
                onClick={() => setShowAddTopic(true)}
                className="px-3.5 py-1.5 bg-[#D98A6C] text-[#FDFCF8] text-xs font-bold rounded-full cursor-pointer hover:bg-[#C17A5E] transition-colors"
              >
                + Add Topic
              </button>
            </div>
          ) : (
            currentTopics.map((topic) => {
              const topicSubtopics = currentSubtopics.filter((st) => st.topicId === topic.id);
              const topicMistakes = mistakes.filter((m) => m.topicId === topic.id);
              const unresCount = topicMistakes.filter((m) => m.status !== 'Mastered').length;
              const hasMistakes = topicMistakes.length > 0;

              const isEditingTopic = editingTopicId === topic.id;
              const isAddingSub = addingSubtopicToTopicId === topic.id;
              const isExpanded = !!expandedTopicIds[topic.id];

              return (
                <div key={topic.id} className="bg-white border border-[#E8E2D9] rounded-2xl p-5 shadow-sm transition-all hover:border-[#5A5A40]/30">
                  
                  {/* Topic Title Line */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      {isEditingTopic ? (
                        <form onSubmit={handleUpdateTopic} className="flex gap-2 items-center px-2">
                          <input
                            type="text"
                            value={editingTopicName}
                            onChange={(e) => setNewTopicName(e.target.value)}
                            className="bg-[#F5F2ED] border border-[#E8E2D9] text-sm p-1.5 rounded-lg w-full max-w-sm font-semibold text-black"
                            autoFocus
                          />
                          <button type="submit" className="text-xs bg-[#D98A6C] text-white px-2.5 py-1 rounded-md cursor-pointer">Save</button>
                          <button type="button" onClick={() => setEditingTopicId(null)} className="text-xs text-stone-500 cursor-pointer">Cancel</button>
                        </form>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h4
                            onClick={() => toggleTopic(topic.id)}
                            className="font-serif text-lg font-bold text-[#2D2A26] hover:text-[#5A5A40] transition-colors cursor-pointer flex items-center gap-1"
                          >
                            {topic.name}
                            {isExpanded ? <ChevronDown className="w-4 h-4 text-[#9A9184] inline" /> : <ChevronRight className="w-4 h-4 text-[#9A9184] inline" />}
                          </h4>
                          <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md ${unresCount > 0 ? 'bg-red-50 text-red-500 border border-red-200/50' : 'bg-[#8DA38A]/15 text-[#8DA38A]'}`}>
                            {unresCount > 0 ? `${unresCount} Active` : 'Mastered'}
                          </span>
                        </div>
                      )}
                      
                      <div className="flex items-center gap-4 text-xs text-[#6B6357] mt-1">
                        <span>{topicSubtopics.length} subtopics</span>
                        <span>•</span>
                        <span>{topicMistakes.length} mistakes loaded</span>
                      </div>
                    </div>

                    {/* Topic Controls */}
                    <div className="flex flex-wrap items-center gap-1.5 text-[#9A9184]">
                      {onTriggerReview && unresCount > 0 && (
                        <button
                          type="button"
                          onClick={() => onTriggerReview(selectedSubjectId, topic.id)}
                          className="px-2.5 py-1 text-[10px] bg-[#5A5A40] text-white border border-[#5A5A40] rounded-full hover:bg-[#4D4D36] transition-colors flex items-center gap-0.5 font-bold cursor-pointer"
                          title={`Practice matching topic mistakes for ${topic.name}`}
                        >
                          <RotateCcw className="w-3 h-3 text-[#D98A6C]" /> Practice
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          setAddingSubtopicToTopicId(isAddingSub ? null : topic.id);
                        }}
                        className="px-2.5 py-1 text-[10px] bg-[#F5F2ED] border border-[#E8E2D9] rounded-full hover:bg-[#E8E2D9] transition-colors flex items-center gap-0.5 text-[#2D2A26] font-semibold cursor-pointer"
                        title="Add Subtopic"
                      >
                        <Plus className="w-3 h-3" /> Subtopic
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingTopicId(topic.id);
                          setEditingTopicName(topic.name);
                        }}
                        className="p-1 hover:bg-[#F5F2ED] text-[#6B6357] hover:text-black rounded cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteTopic(topic.id)}
                        className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 rounded cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Add Subtopic Inline Trigger Input */}
                  {isAddingSub && (
                    <form onSubmit={(e) => handleCreateSubtopic(e, topic.id)} className="mt-3 bg-[#F5F2ED] p-2.5 rounded-xl border border-dashed border-[#E8E2D9] animate-slide-down flex items-center gap-2">
                      <input
                        type="text"
                        placeholder="New Subtopic Name..."
                        value={newSubtopicName}
                        onChange={(e) => setNewSubtopicName(e.target.value)}
                        className="p-1.5 text-xs rounded-lg border border-[#E8E2D9] outline-none w-full bg-white"
                        autoFocus
                      />
                      <button type="submit" className="bg-[#D98A6C] text-[#FDFCF8] hover:bg-[#C17A5E] text-xs px-3 py-1.5 rounded-lg shrink-0 cursor-pointer">Confirm</button>
                      <button type="button" onClick={() => setAddingSubtopicToTopicId(null)} className="text-xs text-stone-500 cursor-pointer">Cancel</button>
                    </form>
                  )}

                  {/* Nested Hierarchical Lists (Expanded Content) */}
                  {isExpanded && (
                    <div className="mt-4 border-t border-[#E8E2D9] pt-3 space-y-3 pl-3">
                      
                      {/* 1. List of Subtopics */}
                      {topicSubtopics.length > 0 && (
                        <div className="space-y-2">
                          <span className="text-[10px] font-bold text-[#9A9184] uppercase tracking-widest block mb-1">Subtopics Map</span>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {topicSubtopics.map((st) => {
                              const stMistakes = topicMistakes.filter((m) => m.subtopicId === st.id);
                              const isEditingSub = editingSubtopicId === st.id;
                              const isSubExpanded = !!expandedSubtopicIds[st.id];

                              return (
                                <div key={st.id} className="bg-[#F5F2ED] p-3 rounded-xl border border-[#E8E2D9]/60">
                                  <div className="flex justify-between items-center gap-2">
                                    <div className="flex-1 truncate">
                                      {isEditingSub ? (
                                        <form
                                          onSubmit={handleUpdateSubtopic}
                                          className="flex items-center gap-1"
                                          onClick={(e) => e.stopPropagation()}
                                        >
                                          <input
                                            type="text"
                                            value={editingSubtopicName}
                                            onChange={(e) => setEditingSubtopicName(e.target.value)}
                                            className="bg-white border border-[#E8E2D9] rounded text-xs p-1 h-6 w-full font-sans text-black"
                                            autoFocus
                                          />
                                          <button type="submit" className="bg-[#D98A6C] text-[#FDFCF8] text-[9px] px-1.5 h-6 rounded cursor-pointer">Save</button>
                                        </form>
                                      ) : (
                                        <h5
                                          onClick={() => toggleSubtopic(st.id)}
                                          className="font-sans text-xs font-semibold text-[#2D2A26] hover:text-[#5A5A40] transition-colors cursor-pointer truncate flex items-center gap-1"
                                        >
                                          <FolderOpen className="w-3 h-3 text-[#5A5A40] inline shrink-0" />
                                          {st.name}
                                          <span className="text-[10px] text-[#9A9184] font-normal">({stMistakes.length})</span>
                                        </h5>
                                      )}
                                    </div>
                                    <div className="flex gap-1 shrink-0">
                                      <button
                                        onClick={() => {
                                          setEditingSubtopicId(st.id);
                                          setEditingSubtopicName(st.name);
                                        }}
                                        className="p-1 hover:bg-[#E8E2D9] text-[#9A9184] rounded cursor-pointer"
                                      >
                                        <Edit2 className="w-2.5 h-2.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteSubtopic(st.id)}
                                        className="p-1 hover:bg-red-50 text-red-300 hover:text-red-500 rounded cursor-pointer"
                                      >
                                        <Trash2 className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  </div>

                                  {/* Subtopic Expanded Mistakes */}
                                  {isSubExpanded && (
                                    <div className="mt-2 pl-2 border-l border-[#5A5A40]/40 space-y-1 bg-white p-2 rounded-lg text-[11px] animate-fade-in shadow-inner">
                                      {stMistakes.length === 0 ? (
                                        <div className="text-[#9A9184] italic">No logs on this subtopic</div>
                                      ) : (
                                        stMistakes.map((log) => (
                                          <div
                                            key={log.id}
                                            onClick={() => onSelectMistake(log.id)}
                                            className="hover:text-[#5A5A40] hover:underline cursor-pointer flex justify-between items-center py-1 border-b border-[#F5F2ED] text-[#6B6357]"
                                          >
                                            <span className="font-medium truncate pr-2 flex-grow">• {log.title}</span>
                                            <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                                              <span className="text-[10px] opacity-80 bg-[#F2EDE6] text-[#4A453E] px-1 rounded inline-block">{log.status}</span>
                                              <button
                                                type="button"
                                                onClick={() => {
                                                  setDeleteConfirm({ type: 'mistake', id: log.id, name: log.title || 'Mistake Entry' });
                                                }}
                                                className="p-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors duration-150 cursor-pointer flex items-center justify-center"
                                                title="Delete Log"
                                              >
                                                <Trash2 className="w-2.5 h-2.5" />
                                              </button>
                                            </div>
                                          </div>
                                        ))
                                      )}
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* 2. Topic Isolated Mistakes (No Subtopic associated OR List all Topic Level Mistakes recursively) */}
                      <div className="space-y-1.5">
                        <span className="text-[10px] font-bold text-[#9A9184] uppercase tracking-widest block mb-1">Mistake Entries ({hasMistakes ? topicMistakes.length : 0})</span>
                        {!hasMistakes ? (
                          <div className="bg-[#F5F2ED] p-4 text-center text-xs text-[#9A9184] rounded-xl border border-[#E8E2D9] border-dashed">
                            No log files on this level. Click "+ add" at the bottom nav to log your revision mistakes.
                          </div>
                        ) : (
                          <div className="bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl overflow-hidden divide-y divide-[#E8E2D9]">
                            {topicMistakes.map((log) => {
                              const sbtName = subtopics.find((st) => st.id === log.subtopicId)?.name || 'General';
                              return (
                                <div
                                  key={log.id}
                                  onClick={() => onSelectMistake(log.id)}
                                  className="p-3 bg-white hover:bg-[#F2EDE6] cursor-pointer flex justify-between items-center transition-colors group"
                                >
                                  <div>
                                    <h5 className="font-sans text-xs font-bold text-[#2D2A26] group-hover:text-[#5A5A40] group-hover:underline">{log.title}</h5>
                                    <div className="flex gap-2 text-[10px] text-[#9A9184] mt-0.5">
                                      <span>{log.dateLogged}</span>
                                      <span>•</span>
                                      <span>{sbtName}</span>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-2">
                                    <span className={`text-[10px] py-0.5 px-2 font-medium rounded-full ${log.status === 'Mastered' ? 'bg-[#8DA38A] text-white' : log.status === 'Reviewing' ? 'bg-[#D98A6C] text-white' : 'bg-[#E8E2D9] text-[#2D2A26]'}`}>
                                      {log.status}
                                    </span>
                                    <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                      <button
                                        type="button"
                                        onClick={() => {
                                          setDeleteConfirm({ type: 'mistake', id: log.id, name: log.title || 'Mistake Entry' });
                                        }}
                                        className="p-1 text-red-500 hover:text-red-700 bg-red-50 hover:bg-red-100 rounded transition-colors duration-150 cursor-pointer flex items-center justify-center self-center"
                                        title="Delete Log"
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </button>
                                    </div>
                                    <Eye className="w-3.5 h-3.5 text-[#9A9184] group-hover:text-[#5A5A40] opacity-0 group-hover:opacity-100 transition-opacity" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>

                    </div>
                  )}

                  {/* Empty State Expand Handle */}
                  {!isExpanded && (
                    <div
                      onClick={() => toggleTopic(topic.id)}
                      className="mt-3 text-center text-xs text-[#9A9184] border-t border-[#F5F2ED] pt-2 cursor-pointer hover:text-[#5A5A40] flex items-center justify-center gap-1"
                    >
                      <Eye className="w-3 h-3" /> View Topic Details
                    </div>
                  )}

                </div>
              );
            })
          )}
        </div>
      </div>

      {deleteConfirm && (
        <div 
          className="fixed inset-0 bg-[#2D2A26]/50 backdrop-blur-xs flex items-center justify-center p-4 z-50"
          onClick={() => setDeleteConfirm(null)}
        >
          <div 
            className="bg-[#FDFCF8] border border-[#E8E2D9] rounded-2xl p-6 shadow-xl max-w-sm w-full animate-scale-up space-y-4 text-left"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="text-center">
              <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-3 border border-red-100 animate-pulse">
                <Trash2 className="w-6 h-6" />
              </div>
              <h4 className="font-serif text-lg font-bold text-[#2D2A26] capitalize">Delete {deleteConfirm.type}</h4>
              <p className="text-xs text-[#2D2A26] font-semibold mt-1">"{deleteConfirm.name}"</p>
              <p className="text-xs text-[#6B6357] mt-3 leading-relaxed">
                {(() => {
                  switch (deleteConfirm.type) {
                    case 'subject':
                      return 'Are you sure you want to delete this Subject? This will CASCADE delete all nested Topics, Subtopics, and Mistake Entries associated with it. This action is irreversible!';
                    case 'topic':
                      return 'Are you sure you want to delete this Topic? This will CASCADE delete all nested subtopics and mistake logs under this topic. This action is irreversible!';
                    case 'subtopic':
                      return 'Are you sure you want to delete this Subtopic? Active mistake entries under this subtopic will not be deleted but they will revert to "no subtopic" under the Parent Topic.';
                    case 'mistake':
                      return 'Are you sure you want to delete this mistake log? Deletions are permanent and cannot be undone!';
                    default:
                      return 'Deletions are permanent. Are you sure you want to delete this item?';
                  }
                })()}
              </p>
            </div>
            <div className="flex gap-2 justify-center font-sans text-xs pt-1">
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-4 py-2 bg-[#F5F2ED] hover:bg-[#E8E2D9] text-[#4A453E] rounded-full transition-colors cursor-pointer font-bold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={executeConfirmedDelete}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-full transition-colors cursor-pointer font-bold"
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
