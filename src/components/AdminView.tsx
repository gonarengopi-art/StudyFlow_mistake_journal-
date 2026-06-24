/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { 
  Users, 
  BookOpen, 
  FolderClosed, 
  Layers, 
  Search, 
  ArrowUpDown, 
  Clock, 
  ShieldAlert, 
  ShieldCheck, 
  Mail, 
  Calendar, 
  Star,
  Activity,
  Award,
  ChevronRight,
  TrendingUp
} from 'lucide-react';

interface AdminViewProps {
  user: any; // User | null
}

export function AdminView({ user }: AdminViewProps) {
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminMistakes, setAdminMistakes] = useState<any[]>([]);
  const [adminSubjects, setAdminSubjects] = useState<any[]>([]);
  const [adminTopics, setAdminTopics] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'joinedAt' | 'lastActive' | 'mistakeCount' | 'name'>('joinedAt');
  const [activeTab, setActiveTab] = useState<'students' | 'newsletter'>('students');

  const handleExportCSV = () => {
    const subscribers = adminUsers.filter(u => u.newsletterOptIn === true);
    if (subscribers.length === 0) {
      alert("No newsletter subscribers to export.");
      return;
    }
    
    // Header line
    const csvContent = [
      ["Email", "Display Name", "Opted In At", "Joined At"].join(","),
      ...subscribers.map(u => {
        const email = `"${(u.email || '').replace(/"/g, '""')}"`;
        const name = `"${(u.displayName || '').replace(/"/g, '""')}"`;
        const optedAt = `"${u.newsletterOptInAt ? formatDateTime(u.newsletterOptInAt) : ''}"`;
        const joinedAt = `"${u.joinedAt ? formatDateTime(u.joinedAt) : ''}"`;
        return [email, name, optedAt, joinedAt].join(",");
      })
    ].join("\r\n");

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `studyflow_newsletter_subscribers_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Load and subscribe in real-time
  useEffect(() => {
    if (!user || user.email !== 'gonarengopi@gmail.com') {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Subscribe to all users
    const unsubUsers = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAdminUsers(list);
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching users for admin:", err);
        setError("Missing or insufficient permissions. Please check if your account is authorized.");
        setLoading(false);
      }
    );

    // Subscribe to mistakes
    const unsubMistakes = onSnapshot(
      collection(db, 'mistakes'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAdminMistakes(list);
      },
      (err) => {
        console.error("Error fetching mistakes for admin:", err);
      }
    );

    // Subscribe to subjects
    const unsubSubjects = onSnapshot(
      collection(db, 'subjects'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAdminSubjects(list);
      },
      (err) => {
        console.error("Error fetching subjects for admin:", err);
      }
    );

    // Subscribe to topics
    const unsubTopics = onSnapshot(
      collection(db, 'topics'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAdminTopics(list);
      },
      (err) => {
        console.error("Error fetching topics for admin:", err);
      }
    );

    return () => {
      unsubUsers();
      unsubMistakes();
      unsubSubjects();
      unsubTopics();
    };
  }, [user]);

  // Aggregate user statistics
  const usersWithStats = useMemo(() => {
    return adminUsers.map((u) => {
      const userMistakes = adminMistakes.filter((m) => m.userId === u.uid);
      const userSubjects = adminSubjects.filter((s) => s.userId === u.uid);
      const userTopics = adminTopics.filter((t) => t.userId === u.uid);
      
      // Sort mistakes to find the latest
      const sortedUserMistakes = [...userMistakes].sort((a, b) => {
        return new Date(b.dateLogged || 0).getTime() - new Date(a.dateLogged || 0).getTime();
      });

      return {
        ...u,
        mistakesCount: userMistakes.length,
        subjectsCount: userSubjects.length,
        topicsCount: userTopics.length,
        lastMistakeDate: sortedUserMistakes.length > 0 ? sortedUserMistakes[0].dateLogged : null,
        lastMistakeEntry: sortedUserMistakes.length > 0 ? sortedUserMistakes[0].title : null
      };
    });
  }, [adminUsers, adminMistakes, adminSubjects, adminTopics]);

  // Filter and Sort Users
  const filteredAndSortedUsers = useMemo(() => {
    let result = [...usersWithStats];

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          (u.displayName || '').toLowerCase().includes(q) ||
          (u.email || '').toLowerCase().includes(q)
      );
    }

    // Sorting block
    result.sort((a, b) => {
      if (sortBy === 'joinedAt') {
        const dateA = new Date(a.joinedAt || 0).getTime();
        const dateB = new Date(b.joinedAt || 0).getTime();
        return dateB - dateA; // Newest first
      }
      if (sortBy === 'lastActive') {
        const dateA = new Date(a.lastActive || 0).getTime();
        const dateB = new Date(b.lastActive || 0).getTime();
        return dateB - dateA; // Most active session first
      }
      if (sortBy === 'mistakeCount') {
        return b.mistakesCount - a.mistakesCount; // Most mistakes first
      }
      if (sortBy === 'name') {
        return (a.displayName || '').localeCompare(b.displayName || '');
      }
      return 0;
    });

    return result;
  }, [usersWithStats, searchQuery, sortBy]);

  // Formatter helpers
  const formatDateTime = (isoString?: string) => {
    if (!isoString) return 'Never';
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return isoString;
    }
  };

  const getTimeAgo = (isoString?: string) => {
    if (!isoString) return 'Offline';
    try {
      const date = new Date(isoString);
      const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000);
      
      let interval = seconds / 31536000;
      if (interval > 1) return Math.floor(interval) + " years ago";
      
      interval = seconds / 2592000;
      if (interval > 1) return Math.floor(interval) + " months ago";
      
      interval = seconds / 86400;
      if (interval > 1) return Math.floor(interval) + " days ago";
      
      interval = seconds / 3600;
      if (interval > 1) return Math.floor(interval) + " hours ago";
      
      interval = seconds / 60;
      if (interval > 1) return Math.floor(interval) + " mins ago";
      
      return "seconds ago";
    } catch {
      return 'Recent';
    }
  };

  if (!user || user.email !== 'gonarengopi@gmail.com') {
    return (
      <div id="admin-unauthorized-container" className="flex flex-col items-center justify-center p-8 bg-white border border-[#E8E2D9] rounded-3xl max-w-lg mx-auto text-center space-y-4 animate-fade-in my-12 shadow-sm font-sans">
        <div id="admin-unauth-icon-wrap" className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center text-red-500">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h3 id="admin-unauth-title" className="font-serif text-2xl font-bold text-[#2D2A26]">Access Restrained</h3>
        <p id="admin-unauth-desc" className="text-sm text-[#6B6357] leading-relaxed">
          The administration dashboard is restricted. Only authorized system developers can view aggregated user analytic tracking statistics.
        </p>
      </div>
    );
  }

  return (
    <div id="admin-dashboard-container" className="space-y-6 max-w-4xl mx-auto animate-fade-in font-sans pb-16">
      
      {/* Title block */}
      <section id="admin-header-section" className="border-b border-[#E8E2D9] pb-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <span id="admin-pill" className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#D98A6C]/10 text-[#D98A6C] uppercase tracking-wider mb-2">
            <ShieldCheck className="w-3 h-3" /> System Root Access
          </span>
          <h2 id="admin-main-title" className="font-serif text-3xl font-semibold text-[#2D2A26] tracking-tight">Admin Console</h2>
          <p id="admin-subtitle" className="text-sm text-[#6B6357]">Audit real-time metrics, student join sequences, and user logging volume.</p>
        </div>
        
        <div id="admin-info-badge" className="px-3 py-2 bg-[#F5F2ED] border border-[#E8E2D9] rounded-xl flex items-center gap-2 self-start md:self-auto shadow-xs">
          <div className="w-2.5 h-2.5 rounded-full bg-[#8DA38A] animate-pulse"></div>
          <span className="text-xs font-mono font-bold text-[#5A5A40] uppercase tracking-wide">Live Stream Connected</span>
        </div>
      </section>

      {error && (
        <div id="admin-error-card" className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Analytics Dashboard Grid */}
      <div id="admin-metrics-grid" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        
        {/* Metric 1 */}
        <div id="admin-metric-users" className="bg-white border border-[#E8E2D9] p-4 rounded-2xl shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-2">
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider">Total Students</span>
            <Users className="w-4 h-4 text-[#D98A6C]" />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl md:text-3xl font-black text-[#2D2A26] tracking-tight">
              {loading ? '...' : adminUsers.length}
            </h3>
            <p className="text-[10px] text-[#8DA38A] mt-1 font-semibold flex items-center gap-0.5">
              <TrendingUp className="w-3 h-3" /> Registered accounts
            </p>
          </div>
        </div>

        {/* Metric 2 */}
        <div id="admin-metric-mistakes" className="bg-white border border-[#E8E2D9] p-4 rounded-2xl shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-2">
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider">Mistakes Logged</span>
            <BookOpen className="w-4 h-4 text-[#D98A6C]" />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl md:text-3xl font-black text-[#2D2A26] tracking-tight">
              {loading ? '...' : adminMistakes.length}
            </h3>
            <p className="text-[10px] text-[#6B6357] mt-1 italic font-medium">
              Diagnostic entries saved
            </p>
          </div>
        </div>

        {/* Metric 3 */}
        <div id="admin-metric-subjects" className="bg-white border border-[#E8E2D9] p-4 rounded-2xl shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-2">
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider">Subjects / Topics</span>
            <FolderClosed className="w-4 h-4 text-[#D98A6C]" />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl md:text-3xl font-black text-[#2D2A26] tracking-tight">
              {loading ? '...' : `${adminSubjects.length} / ${adminTopics.length}`}
            </h3>
            <p className="text-[10px] text-[#6B6357] mt-1 italic font-medium">
              Categories mapped
            </p>
          </div>
        </div>

        {/* Metric 4 */}
        <div id="admin-metric-newsletter" className="bg-white border border-[#E8E2D9] p-4 rounded-2xl shadow-sm text-left flex flex-col justify-between">
          <div className="flex items-center justify-between border-b border-[#F5F2ED] pb-2">
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider">Newsletter Members</span>
            <Mail className="w-4 h-4 text-[#D98A6C]" />
          </div>
          <div className="mt-4">
            <h3 className="font-serif text-2xl md:text-3xl font-black text-[#2D2A26] tracking-tight">
              {loading ? '...' : adminUsers.filter(u => u.newsletterOptIn === true).length}
            </h3>
            <p className="text-[10px] text-[#8DA38A] mt-1 font-semibold">
              Opted-in students
            </p>
          </div>
        </div>

      </div>

      {/* Control panel & User List */}
      <div id="admin-controls-card" className="bg-[#FAF8F5] border border-[#E8E2D9] rounded-2xl p-4 md:p-6 shadow-xs space-y-4">
        
        {/* Sub-administration Tabs */}
        <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3 mb-2">
          <div className="flex gap-4">
            <button
              onClick={() => setActiveTab('students')}
              className={`pb-1.5 px-0.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'students' ? 'border-[#D98A6C] text-[#2D2A26]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              Students Directory
            </button>
            <button
              onClick={() => setActiveTab('newsletter')}
              className={`pb-1.5 px-0.5 text-xs font-bold border-b-2 transition-all cursor-pointer ${activeTab === 'newsletter' ? 'border-[#D98A6C] text-[#2D2A26]' : 'border-transparent text-stone-400 hover:text-stone-600'}`}
            >
              Newsletter Sign-Ups ({adminUsers.filter(u => u.newsletterOptIn === true).length})
            </button>
          </div>

          {activeTab === 'newsletter' && (
            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 bg-[#5A5A40] hover:bg-[#4D4D36] text-white text-[10px] font-sans font-bold uppercase tracking-wider rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Mail className="w-3.5 h-3.5" /> Export to CSV
            </button>
          )}
        </div>

        {activeTab === 'newsletter' ? (
          /* Newsletter sub-tab view list block */
          (() => {
            const subscribers = adminUsers.filter(u => u.newsletterOptIn === true);
            if (subscribers.length === 0) {
              return (
                <div className="text-center py-16 text-[#6B6357] space-y-2 bg-white rounded-xl border border-[#E8E2D9]/50 p-4">
                  <Mail className="w-10 h-10 text-[#9A9184]/50 mx-auto" />
                  <p className="text-sm font-semibold">No active newsletter sign-ups found.</p>
                  <p className="text-xs text-stone-400">Newly registered users will be prompted to opt-in on their next sign-in sequence.</p>
                </div>
              );
            }

            return (
              <div className="space-y-3">
                <div className="hidden lg:grid lg:grid-cols-12 gap-2 text-[9px] font-bold text-[#6B6357] uppercase tracking-wider px-4 py-1.5">
                  <div className="col-span-5">Subscriber Identity</div>
                  <div className="col-span-4">Opted-In Timestamp</div>
                  <div className="col-span-3 text-right">Join Date</div>
                </div>

                <div className="space-y-2.5">
                  {subscribers.map((u) => (
                    <div 
                      key={u.id}
                      className="bg-white border border-[#E8E2D9] rounded-xl p-4 lg:grid lg:grid-cols-12 gap-2 items-center hover:shadow-xs transition-shadow"
                    >
                      <div className="col-span-5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-[#E6E1FF] text-[#2D2A26] font-black text-xs flex items-center justify-center uppercase border border-[#d2cbfa]">
                          {(u.displayName || 'S').charAt(0)}
                        </div>
                        <div className="text-left">
                          <h4 className="font-serif font-semibold text-xs text-[#2D2A26]">{u.displayName || 'Anonymous Student'}</h4>
                          <p className="text-[11px] text-[#6B6357] font-mono break-all leading-none">{u.email}</p>
                        </div>
                      </div>

                      <div className="col-span-4 text-left mt-1.5 lg:mt-0 flex lg:block justify-between items-center lg:bg-transparent rounded-lg">
                        <span className="lg:hidden text-[9px] font-bold text-[#9A9184] uppercase">Opted-in At</span>
                        <span className="font-mono text-[10.5px] text-[#2D2A26] flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                          {u.newsletterOptInAt ? formatDateTime(u.newsletterOptInAt) : 'N/A'}
                        </span>
                      </div>

                      <div className="col-span-3 lg:text-right mt-1.5 lg:mt-0 flex lg:block justify-between items-center">
                        <span className="lg:hidden text-[9px] font-bold text-[#9A9184] uppercase">Join Date</span>
                        <span className="font-mono text-[10.5px] text-stone-500 whitespace-nowrap">
                          {u.joinedAt ? formatDateTime(u.joinedAt) : 'N/A'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })()
        ) : (
          /* Student Card list sub-tab content */
          <>
            {/* Search & Sort Panel */}
        <div id="admin-controls-flex" className="flex flex-col md:flex-row gap-3 items-center justify-between border-b border-[#E8E2D9]/60 pb-4">
          
          {/* Search box */}
          <div id="admin-search-wrapper" className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-[#9A9184]" />
            <input
              id="admin-user-search-input"
              type="text"
              placeholder="Search user email or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full text-xs pl-9 pr-4 py-2 border border-[#E8E2D9] focus:outline-none focus:border-[#5A5A40] rounded-xl bg-white text-[#2D2A26] font-medium"
            />
          </div>

          {/* Sort tabs */}
          <div id="admin-sort-tabs" className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto scrollbar-none pb-1 md:pb-0">
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider flex items-center gap-1 whitespace-nowrap mr-1">
              <ArrowUpDown className="w-3.5 h-3.5" /> Sort:
            </span>
            {[
              { id: 'joinedAt', label: 'Joined' },
              { id: 'lastActive', label: 'Last Active' },
              { id: 'mistakeCount', label: 'Mistakes Count' },
              { id: 'name', label: 'Name' }
            ].map((tab) => (
              <button
                key={tab.id}
                id={`admin-btn-sort-${tab.id}`}
                onClick={() => setSortBy(tab.id as any)}
                className={`py-1 px-3 text-[10px] font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${sortBy === tab.id ? 'bg-[#5A5A40] text-white shadow-xs' : 'bg-white hover:bg-stone-100 text-[#6B6357] border border-[#E8E2D9]'}`}
              >
                {tab.label}
              </button>
            ))}
          </div>

        </div>

        {/* List of Users */}
        {loading ? (
          <div id="admin-loading-spinner" className="flex flex-col items-center justify-center py-16 space-y-2">
            <div className="w-8 h-8 rounded-full border-2 border-[#D98A6C] border-t-transparent animate-spin"></div>
            <span className="text-[10px] font-bold text-[#6B6357] uppercase tracking-widest">Loading Analytics Database...</span>
          </div>
        ) : filteredAndSortedUsers.length === 0 ? (
          <div id="admin-empty-state" className="text-center py-12 text-[#6B6357] space-y-2 bg-white rounded-xl border border-[#E8E2D9]/50">
            <Users className="w-10 h-10 text-[#9A9184]/50 mx-auto" />
            <p className="text-xs font-semibold">No students discovered matching current filter.</p>
          </div>
        ) : (
          <div id="admin-user-cards-list" className="space-y-3">
            <div className="hidden lg:grid lg:grid-cols-12 gap-2 text-[9px] font-bold text-[#6B6357] uppercase tracking-wider px-4 py-1.5 hover:bg-transparent">
              <div className="col-span-4">Student Identity</div>
              <div className="col-span-2.5">Joined School</div>
              <div className="col-span-2.5">Last Pulse Active</div>
              <div className="col-span-3 text-right">Volume Stats</div>
            </div>

            {filteredAndSortedUsers.map((item) => {
              const isAdminEmail = item.email === 'gonarengopi@gmail.com';
              return (
                <div
                  key={item.id}
                  id={`admin-user-card-${item.uid}`}
                  className="bg-white border border-[#E8E2D9] rounded-xl p-4 lg:grid lg:grid-cols-12 gap-2 items-center hover:shadow-xs transition-shadow group relative overflow-hidden"
                >
                  {isAdminEmail && (
                    <div className="absolute right-0 top-0 w-12 h-12 overflow-hidden pointer-events-none">
                      <div className="bg-[#D98A6C] text-[7px] text-white font-bold uppercase tracking-widest text-center rotate-45 transform translate-x-3.5 translate-y-2 py-0.5 shadow-sm">
                        Admin
                      </div>
                    </div>
                  )}

                  {/* Student profile identity */}
                  <div className="col-span-4 flex items-center gap-3">
                    {item.photoURL ? (
                      <img
                        src={item.photoURL}
                        alt={item.displayName}
                        referrerPolicy="no-referrer"
                        className="w-9 h-9 rounded-full object-cover border border-[#E8E2D9] bg-[#F5F2ED]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#D98A6C]/10 text-[#D98A6C] font-black text-xs flex items-center justify-center uppercase border border-[#D98A6C]/20">
                        {(item.displayName || 'S').charAt(0)}
                      </div>
                    )}
                    <div className="text-left">
                      <h4 className="font-serif font-semibold text-sm text-[#2D2A26] flex items-center gap-1.5 flex-wrap">
                        {item.displayName || 'Anonymous Student'}
                        {item.isPremium && (
                          <span className="inline-flex items-center gap-0.5 px-1.5 py-0.25 bg-[#D4AF37]/15 text-[#B8901C] border border-[#D4AF37]/25 text-[9px] font-sans font-bold uppercase rounded-md tracking-wider">
                            ★ Lifetime
                          </span>
                        )}
                      </h4>
                      <p className="text-xs text-[#6B6357] leading-tight font-mono break-all">{item.email}</p>
                    </div>
                  </div>

                  {/* Registered sequence joinedAt */}
                  <div className="col-span-2.5 text-left mt-2 lg:mt-0 pt-2 lg:pt-0 border-t border-dashed border-stone-100 lg:border-none flex lg:block justify-between items-center">
                    <span className="lg:hidden text-[9px] font-bold text-[#9A9184] uppercase">Joined School</span>
                    <div className="flex items-center gap-1 font-mono text-[10.5px] text-[#2D2A26]">
                      <Calendar className="w-3.5 h-3.5 text-[#9A9184] shrink-0" />
                      <span>{formatDateTime(item.joinedAt)}</span>
                    </div>
                  </div>

                  {/* Last Active */}
                  <div className="col-span-2.5 text-left mt-1.5 lg:mt-0 flex lg:block justify-between items-center">
                    <span className="lg:hidden text-[9px] font-bold text-[#9A9184] uppercase">Last Pulse Active</span>
                    <div className="flex items-center gap-1 text-[11px] text-[#6B6357]">
                      <Clock className="w-3.5 h-3.5 text-[#9A9184] shrink-0" />
                      <span className="font-semibold">{getTimeAgo(item.lastActive)}</span>
                    </div>
                  </div>

                  {/* Stats columns */}
                  <div className="col-span-3 text-right mt-3 lg:mt-0 pt-3 lg:pt-0 border-t border-stone-100 lg:border-none flex lg:flex-row gap-2 justify-between lg:justify-end items-center">
                    <div className="lg:hidden flex items-center gap-1.5">
                      <span className="text-[9px] font-bold text-[#9A9184] uppercase">Stats</span>
                    </div>

                    <div className="flex gap-2 items-center">
                      {/* Subjects count pill */}
                      <span className="py-1 px-2.5 bg-stone-50 border border-stone-200 text-[#6B6357] font-mono text-[10px] rounded-lg" title="Subjects Created">
                        {item.subjectsCount} subj
                      </span>

                      {/* Mistakes Count badge */}
                      <span 
                        className={`py-1 px-2.5 font-bold font-mono text-[10px] rounded-lg transition-colors flex items-center gap-1 ${item.mistakesCount > 0 ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' : 'bg-stone-50 border border-stone-200 text-stone-400'}`}
                        title="Mistakes Logged"
                      >
                        <Award className="w-3 h-3 shrink-0" />
                        <span>{item.mistakesCount} logged</span>
                      </span>
                    </div>
                  </div>

                  {/* Optional user last active logging glimpse */}
                  {item.lastMistakeEntry && (
                    <div className="col-span-12 mt-3 p-2 bg-[#F5F2ED]/60 border border-[#E8E2D9]/40 rounded-lg text-left text-[10.5px] text-[#6B6357] flex items-center justify-between gap-1.5 animate-slide-down">
                      <span className="font-semibold text-stone-500 shrink-0 uppercase tracking-wider text-[8px] border border-stone-300 px-1 py-0.5 rounded mr-1">Latest Log</span>
                      <span className="truncate italic font-medium">"{item.lastMistakeEntry}"</span>
                      <span className="text-[9px] font-mono text-[#9A9184] tracking-tight shrink-0 flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" /> {item.lastMistakeDate}
                      </span>
                    </div>
                  )}

                  {/* Quota limit controls */}
                  {!isAdminEmail && (
                    <div className="col-span-12 mt-2 p-3 bg-[#FAF8F5] border border-[#E8E2D9]/60 rounded-xl text-left flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-xs">
                      <div className="space-y-1">
                        <h5 className="text-[10px] font-bold text-[#6B6357] uppercase tracking-wider flex items-center gap-1">
                          <Activity className="w-3.5 h-3.5 text-[#D98A6C]" /> Daily Resource Quota
                        </h5>
                        <div className="text-xs text-[#2D2A26] font-medium flex items-center gap-2">
                          <span>Daily Reads:</span>
                          <span className="font-mono bg-white border border-[#E8E2D9] px-2 py-0.5 rounded font-bold text-[#D98A6C]">
                            {item.dailyQuotaDate === new Date().toISOString().split('T')[0] ? (item.dailyQuotaReads || 0) : 0}
                          </span>
                          <span>/</span>
                          <span className="font-mono bg-white border border-[#E8E2D9] px-2 py-0.5 rounded font-bold">
                            {item.dailyQuotaLimit !== undefined ? item.dailyQuotaLimit : 1000}
                          </span>
                          <span className="text-[10px] text-[#6B6357]">reads</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 self-start md:self-auto">
                        <button
                          onClick={async () => {
                            const currentLimit = item.dailyQuotaLimit !== undefined ? item.dailyQuotaLimit : 1000;
                            const newLimit = Math.max(100, currentLimit - 500);
                            await setDoc(doc(db, 'users', item.uid), { dailyQuotaLimit: newLimit }, { merge: true });
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-[#E8E2D9] rounded-lg text-stone-600 font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          -500 Limit
                        </button>
                        <button
                          onClick={async () => {
                            const currentLimit = item.dailyQuotaLimit !== undefined ? item.dailyQuotaLimit : 1000;
                            const newLimit = Math.max(100, currentLimit - 100);
                            await setDoc(doc(db, 'users', item.uid), { dailyQuotaLimit: newLimit }, { merge: true });
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-[#E8E2D9] rounded-lg text-stone-600 font-bold hover:bg-stone-50 transition-colors cursor-pointer"
                        >
                          -100 Limit
                        </button>
                        <button
                          onClick={async () => {
                            const currentLimit = item.dailyQuotaLimit !== undefined ? item.dailyQuotaLimit : 1000;
                            const newLimit = currentLimit + 100;
                            await setDoc(doc(db, 'users', item.uid), { dailyQuotaLimit: newLimit }, { merge: true });
                          }}
                          className="px-2.5 py-1 text-[10px] bg-[#5A5A40]/10 border border-[#5A5A40]/20 rounded-lg text-[#5A5A40] font-bold hover:bg-[#5A5A40]/15 transition-colors cursor-pointer"
                        >
                          +100 Limit
                        </button>
                        <button
                          onClick={async () => {
                            const currentLimit = item.dailyQuotaLimit !== undefined ? item.dailyQuotaLimit : 1000;
                            const newLimit = currentLimit + 500;
                            await setDoc(doc(db, 'users', item.uid), { dailyQuotaLimit: newLimit }, { merge: true });
                          }}
                          className="px-2.5 py-1 text-[10px] bg-[#5A5A40]/10 border border-[#5A5A40]/20 rounded-lg text-[#5A5A40] font-bold hover:bg-[#5A5A40]/15 transition-colors cursor-pointer"
                        >
                          +500 Limit
                        </button>
                        <button
                          onClick={async () => {
                            await setDoc(doc(db, 'users', item.uid), { dailyQuotaLimit: 1000 }, { merge: true });
                          }}
                          className="px-2.5 py-1 text-[10px] bg-white border border-[#E8E2D9] text-[#D98A6C] rounded-lg hover:bg-orange-50 font-bold transition-all cursor-pointer"
                        >
                          Reset Default (1k)
                        </button>
                        <button
                          onClick={async () => {
                            const isPremium = item.isPremium === true;
                            await setDoc(doc(db, 'users', item.uid), { 
                              isPremium: !isPremium, 
                              dailyQuotaLimit: !isPremium ? 100000 : 1000,
                              premiumUpgradedAt: !isPremium ? new Date().toISOString() : null 
                            }, { merge: true });
                          }}
                          className={`px-2.5 py-1 text-[10px] border rounded-lg font-bold transition-all cursor-pointer ${item.isPremium ? 'bg-red-50 border-red-200 text-red-600 hover:bg-red-100' : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'}`}
                        >
                          {item.isPremium ? 'Revoke Premium' : 'Grant Lifetime'}
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              );
            })}
          </div>
        )}
          </>
        )}

      </div>

      {/* Safety info footer */}
      <div id="admin-security-note-card" className="p-4 bg-white border border-[#E8E2D9] rounded-xl flex items-start gap-3 shadow-xs">
        <div id="admin-note-icon" className="p-1.5 bg-[#D98A6C]/10 text-[#D98A6C] rounded-lg mt-0.5">
          <Activity className="w-4 h-4" />
        </div>
        <div className="text-left">
          <h5 id="admin-note-title" className="text-xs font-bold text-[#2D2A26] uppercase tracking-wider mb-0.5">Compliance & Account Isolation Guidance</h5>
          <p id="admin-note-desc" className="text-[11px] text-[#6B6357] leading-relaxed">
            Privacy integrity is rigorously maintained. Admins cannot delete, modify, or insert other students' mistakes directly, ensuring extreme safety. All synchronization data is live and managed in accordance to system permissions.
          </p>
        </div>
      </div>

    </div>
  );
}
