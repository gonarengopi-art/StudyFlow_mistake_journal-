/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { User } from 'firebase/auth';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  where,
  onSnapshot,
  arrayUnion,
  serverTimestamp,
} from 'firebase/firestore';
import { auth, db } from '../firebase';
import { StudySquad, SquadMistakeEntry, SquadMemberScore, MistakeEntry } from '../types';
import { INITIAL_SQUADS, INITIAL_SQUAD_MISTAKES, INITIAL_SQUAD_SCORES } from '../initialData';
import { safeSetItem, safeGetItem } from '../utils/storage';

function generateSquadCode(existingCodes: Set<string>): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  if (existingCodes.has(code)) {
    return generateSquadCode(existingCodes);
  }
  return code;
}

export function useSquadStore(currentUser: User | null, currentUserName: string) {
  const [squads, setSquads] = useState<StudySquad[]>(() => {
    const key = currentUser ? `studyflow_squads_${currentUser.uid}` : 'studyflow_squads_guest';
    const cached = safeGetItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch (e) {
        console.warn('Error reading cached squads:', e);
      }
    }
    return INITIAL_SQUADS;
  });

  const [activeSquadId, setActiveSquadId] = useState<string | null>(() => {
    return squads[0]?.id || null;
  });

  const [squadMistakes, setSquadMistakes] = useState<Record<string, SquadMistakeEntry[]>>(() => {
    const key = currentUser ? `studyflow_squad_mistakes_${currentUser.uid}` : 'studyflow_squad_mistakes_guest';
    const cached = safeGetItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.warn('Error reading cached squad mistakes:', e);
      }
    }
    // Group INITIAL_SQUAD_MISTAKES by squadId
    const initialMap: Record<string, SquadMistakeEntry[]> = {};
    INITIAL_SQUAD_MISTAKES.forEach((m) => {
      if (!initialMap[m.squadId]) initialMap[m.squadId] = [];
      initialMap[m.squadId].push(m);
    });
    return initialMap;
  });

  const [squadScores, setSquadScores] = useState<Record<string, SquadMemberScore[]>>(() => {
    const key = currentUser ? `studyflow_squad_scores_${currentUser.uid}` : 'studyflow_squad_scores_guest';
    const cached = safeGetItem(key);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        if (parsed && typeof parsed === 'object') return parsed;
      } catch (e) {
        console.warn('Error reading cached squad scores:', e);
      }
    }
    return INITIAL_SQUAD_SCORES;
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  // Sync to local storage
  useEffect(() => {
    const key = currentUser ? `studyflow_squads_${currentUser.uid}` : 'studyflow_squads_guest';
    safeSetItem(key, JSON.stringify(squads));
  }, [squads, currentUser]);

  useEffect(() => {
    const key = currentUser ? `studyflow_squad_mistakes_${currentUser.uid}` : 'studyflow_squad_mistakes_guest';
    safeSetItem(key, JSON.stringify(squadMistakes));
  }, [squadMistakes, currentUser]);

  useEffect(() => {
    const key = currentUser ? `studyflow_squad_scores_${currentUser.uid}` : 'studyflow_squad_scores_guest';
    safeSetItem(key, JSON.stringify(squadScores));
  }, [squadScores, currentUser]);

  // Real-time Firestore sync for authenticated user squads
  useEffect(() => {
    if (!currentUser) return;

    setLoading(true);
    // Listen to squads where current user is a member
    const squadsCol = collection(db, 'squads');
    const q = query(squadsCol, where('memberUids', 'array-contains', currentUser.uid));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const loadedSquads: StudySquad[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            loadedSquads.push({
              id: docSnap.id,
              name: data.name || 'Unnamed Squad',
              description: data.description || '',
              code: data.code || '',
              subjectId: data.subjectId || '',
              ownerUid: data.ownerUid || '',
              ownerName: data.ownerName || 'Scholar',
              memberUids: Array.isArray(data.memberUids) ? data.memberUids : [currentUser.uid],
              memberNames: data.memberNames || {},
              createdAt: data.createdAt || new Date().toISOString(),
            });
          });
          setSquads(loadedSquads);
          if (loadedSquads.length > 0 && (!activeSquadId || !loadedSquads.some((s) => s.id === activeSquadId))) {
            setActiveSquadId(loadedSquads[0].id);
          }
        } else {
          // If the user has no Firestore squads yet, combine default demo squads so they have immediate content
          setSquads((prev) => (prev.length > 0 ? prev : INITIAL_SQUADS));
        }
        setLoading(false);
      },
      (err) => {
        console.warn('Firestore squads listener note (using local cache):', err.message);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser]);

  // Real-time sync for mistakes in the active squad if Firestore doc exists
  useEffect(() => {
    if (!currentUser || !activeSquadId || activeSquadId.startsWith('sq-')) return;

    const mistakesCol = collection(db, 'squads', activeSquadId, 'mistakes');
    const unsub = onSnapshot(
      mistakesCol,
      (snapshot) => {
        const loaded: SquadMistakeEntry[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          loaded.push({
            id: docSnap.id,
            squadId: activeSquadId,
            title: d.title || 'Untitled Mistake',
            subjectId: d.subjectId || '',
            topicId: d.topicId || '',
            subtopicId: d.subtopicId || undefined,
            dateLogged: d.dateLogged || new Date().toISOString().split('T')[0],
            imageUrl: d.imageUrl || undefined,
            imageUrls: d.imageUrls || undefined,
            originalQuestion: d.originalQuestion || '',
            myAnswer: d.myAnswer || '',
            correctAnswer: d.correctAnswer || '',
            whatIGotWrong: d.whatIGotWrong || '',
            correctExplanation: d.correctExplanation || '',
            reflection: d.reflection || '',
            futureAdvice: d.futureAdvice || '',
            categories: Array.isArray(d.categories) ? d.categories : ['Careless Error'],
            status: d.status || 'New',
            authorUid: d.authorUid || currentUser.uid,
            authorName: d.authorName || 'Scholar',
            lastEditedByName: d.lastEditedByName || undefined,
            lastEditedAt: d.lastEditedAt || undefined,
            likes: typeof d.likes === 'number' ? d.likes : 0,
            likedBy: Array.isArray(d.likedBy) ? d.likedBy : [],
          });
        });

        setSquadMistakes((prev) => ({
          ...prev,
          [activeSquadId]: loaded,
        }));
      },
      (err) => {
        console.warn('Squad mistakes listener note:', err.message);
      }
    );

    return () => unsub();
  }, [currentUser, activeSquadId]);

  // Real-time sync for leaderboard scores in the active squad
  useEffect(() => {
    if (!currentUser || !activeSquadId || activeSquadId.startsWith('sq-')) return;

    const scoresCol = collection(db, 'squads', activeSquadId, 'scores');
    const unsub = onSnapshot(
      scoresCol,
      (snapshot) => {
        const loaded: SquadMemberScore[] = [];
        snapshot.forEach((docSnap) => {
          const d = docSnap.data();
          loaded.push({
            uid: docSnap.id,
            displayName: d.displayName || 'Squad Member',
            accuracy: typeof d.accuracy === 'number' ? d.accuracy : 0,
            reviewsCompleted: typeof d.reviewsCompleted === 'number' ? d.reviewsCompleted : 0,
            cardsMastered: typeof d.cardsMastered === 'number' ? d.cardsMastered : 0,
            lastActiveDate: d.lastActiveDate || 'Recently',
          });
        });

        // Sort descending by accuracy then reviews completed
        loaded.sort((a, b) => b.accuracy - a.accuracy || b.reviewsCompleted - a.reviewsCompleted);

        setSquadScores((prev) => ({
          ...prev,
          [activeSquadId]: loaded,
        }));
      },
      (err) => {
        console.warn('Squad scores listener note:', err.message);
      }
    );

    return () => unsub();
  }, [currentUser, activeSquadId]);

  const activeSquad = useMemo(() => {
    return squads.find((s) => s.id === activeSquadId) || squads[0] || null;
  }, [squads, activeSquadId]);

  const activeMistakes = useMemo(() => {
    if (!activeSquad) return [];
    return squadMistakes[activeSquad.id] || [];
  }, [squadMistakes, activeSquad]);

  const activeScores = useMemo(() => {
    if (!activeSquad) return [];
    const list = squadScores[activeSquad.id] || [];
    return [...list].sort((a, b) => b.accuracy - a.accuracy || b.reviewsCompleted - a.reviewsCompleted);
  }, [squadScores, activeSquad]);

  // Create new squad
  const createSquad = useCallback(
    async (name: string, subjectId: string, description?: string): Promise<StudySquad> => {
      const existingCodes = new Set(squads.map((s) => s.code));
      const code = generateSquadCode(existingCodes);
      const squadId = `squad_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const uid = currentUser?.uid || 'guest-scholar';
      const authorName = currentUser?.displayName || currentUserName || 'Scholar';

      const newSquad: StudySquad = {
        id: squadId,
        name: name.trim(),
        description: description?.trim() || '',
        code,
        subjectId,
        ownerUid: uid,
        ownerName: authorName,
        memberUids: [uid],
        memberNames: { [uid]: authorName },
        createdAt: new Date().toISOString(),
      };

      if (currentUser) {
        try {
          await setDoc(doc(db, 'squads', squadId), newSquad);
        } catch (e) {
          console.warn('Could not persist squad to Firestore, cached locally:', e);
        }
      }

      setSquads((prev) => [newSquad, ...prev]);
      setActiveSquadId(squadId);
      return newSquad;
    },
    [currentUser, currentUserName, squads]
  );

  // Join squad via 6-character code or link
  const joinSquad = useCallback(
    async (rawCodeOrUrl: string): Promise<{ success: boolean; message: string; squad?: StudySquad }> => {
      if (!rawCodeOrUrl || !rawCodeOrUrl.trim()) {
        return { success: false, message: 'Please enter a 6-character squad code or invite link.' };
      }

      let code = rawCodeOrUrl.trim();
      // Extract from URL if pasted as full link e.g. https://...?squad=BIO942
      if (code.includes('?squad=')) {
        const parts = code.split('?squad=');
        code = parts[1]?.split('&')[0] || code;
      } else if (code.includes('&squad=')) {
        const parts = code.split('&squad=');
        code = parts[1]?.split('&')[0] || code;
      }
      code = code.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();

      if (code.length < 4) {
        return { success: false, message: 'Invalid squad code format. Codes are 6 alphanumeric characters.' };
      }

      const uid = currentUser?.uid || 'guest-scholar';
      const myName = currentUser?.displayName || currentUserName || 'Scholar';

      // 1. Check local squads first
      const existingLocal = squads.find((s) => s.code.toUpperCase() === code);
      if (existingLocal) {
        if (existingLocal.memberUids.includes(uid)) {
          setActiveSquadId(existingLocal.id);
          return { success: true, message: `You are already a member of "${existingLocal.name}"!`, squad: existingLocal };
        }
        // Enroll into local squad
        const updatedSquad: StudySquad = {
          ...existingLocal,
          memberUids: [...existingLocal.memberUids, uid],
          memberNames: { ...(existingLocal.memberNames || {}), [uid]: myName },
        };
        setSquads((prev) => prev.map((s) => (s.id === existingLocal.id ? updatedSquad : s)));
        setActiveSquadId(existingLocal.id);

        if (currentUser && !existingLocal.id.startsWith('sq-')) {
          try {
            await updateDoc(doc(db, 'squads', existingLocal.id), {
              memberUids: arrayUnion(uid),
              [`memberNames.${uid}`]: myName,
            });
          } catch (e) {
            console.warn('Update remote squad member failed:', e);
          }
        }
        return { success: true, message: `Joined "${updatedSquad.name}" successfully!`, squad: updatedSquad };
      }

      // 2. Query Firestore for code if user is authenticated
      if (currentUser) {
        try {
          const squadsCol = collection(db, 'squads');
          const q = query(squadsCol, where('code', '==', code));
          const snap = await getDocs(q);

          if (!snap.empty) {
            const foundDoc = snap.docs[0];
            const data = foundDoc.data();
            const squadId = foundDoc.id;

            const updatedMembers = Array.isArray(data.memberUids)
              ? Array.from(new Set([...data.memberUids, uid]))
              : [uid];

            await updateDoc(doc(db, 'squads', squadId), {
              memberUids: arrayUnion(uid),
              [`memberNames.${uid}`]: myName,
            });

            const joinedSquad: StudySquad = {
              id: squadId,
              name: data.name || 'Study Squad',
              description: data.description || '',
              code: data.code || code,
              subjectId: data.subjectId || '',
              ownerUid: data.ownerUid || '',
              ownerName: data.ownerName || 'Scholar',
              memberUids: updatedMembers,
              memberNames: { ...(data.memberNames || {}), [uid]: myName },
              createdAt: data.createdAt || new Date().toISOString(),
            };

            setSquads((prev) => [joinedSquad, ...prev.filter((s) => s.id !== squadId)]);
            setActiveSquadId(squadId);
            return { success: true, message: `Joined "${joinedSquad.name}"!`, squad: joinedSquad };
          }
        } catch (e) {
          console.warn('Error querying Firestore for squad code:', e);
        }
      }

      // 3. Fallback: Check INITIAL_SQUADS demo pool (e.g. BIO942, CHM305)
      const foundDemo = INITIAL_SQUADS.find((s) => s.code.toUpperCase() === code);
      if (foundDemo) {
        const joinedDemo: StudySquad = {
          ...foundDemo,
          memberUids: [...foundDemo.memberUids, uid],
          memberNames: { ...(foundDemo.memberNames || {}), [uid]: myName },
        };
        setSquads((prev) => [joinedDemo, ...prev.filter((s) => s.id !== joinedDemo.id)]);
        setActiveSquadId(joinedDemo.id);
        return { success: true, message: `Joined "${joinedDemo.name}"!`, squad: joinedDemo };
      }

      return { success: false, message: `No active study squad was found with code "${code}". Please verify with your classmate!` };
    },
    [currentUser, currentUserName, squads]
  );

  // Add mistake to squad
  const addSquadMistake = useCallback(
    async (
      squadId: string,
      mistakeData: Omit<SquadMistakeEntry, 'id' | 'squadId' | 'authorUid' | 'authorName' | 'dateLogged'>
    ): Promise<string> => {
      const newId = `sqm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const uid = currentUser?.uid || 'guest-scholar';
      const authorName = currentUser?.displayName || currentUserName || 'Scholar';
      const today = new Date().toISOString().split('T')[0];

      const newEntry: SquadMistakeEntry = {
        ...mistakeData,
        id: newId,
        squadId,
        dateLogged: today,
        authorUid: uid,
        authorName,
        likes: 0,
        likedBy: [],
      };

      setSquadMistakes((prev) => ({
        ...prev,
        [squadId]: [newEntry, ...(prev[squadId] || [])],
      }));

      if (currentUser && !squadId.startsWith('sq-')) {
        try {
          await setDoc(doc(db, 'squads', squadId, 'mistakes', newId), newEntry);
        } catch (e) {
          console.warn('Could not save squad mistake to Firestore:', e);
        }
      }

      return newId;
    },
    [currentUser, currentUserName]
  );

  // Edit squad mistake collaboratively
  const editSquadMistake = useCallback(
    async (squadId: string, mistakeId: string, updates: Partial<SquadMistakeEntry>): Promise<void> => {
      const editorName = currentUser?.displayName || currentUserName || 'Collaborator';
      const enrichedUpdates = {
        ...updates,
        lastEditedByName: editorName,
        lastEditedAt: new Date().toISOString(),
      };

      setSquadMistakes((prev) => {
        const currentList = prev[squadId] || [];
        const nextList = currentList.map((m) => (m.id === mistakeId ? { ...m, ...enrichedUpdates } : m));
        return { ...prev, [squadId]: nextList };
      });

      if (currentUser && !squadId.startsWith('sq-')) {
        try {
          await updateDoc(doc(db, 'squads', squadId, 'mistakes', mistakeId), enrichedUpdates);
        } catch (e) {
          console.warn('Could not update squad mistake in Firestore:', e);
        }
      }
    },
    [currentUser, currentUserName]
  );

  // Delete squad mistake
  const deleteSquadMistake = useCallback(
    async (squadId: string, mistakeId: string): Promise<void> => {
      setSquadMistakes((prev) => {
        const currentList = prev[squadId] || [];
        return { ...prev, [squadId]: currentList.filter((m) => m.id !== mistakeId) };
      });

      if (currentUser && !squadId.startsWith('sq-')) {
        try {
          await deleteDoc(doc(db, 'squads', squadId, 'mistakes', mistakeId));
        } catch (e) {
          console.warn('Could not delete squad mistake from Firestore:', e);
        }
      }
    },
    [currentUser]
  );

  // Toggle like
  const likeSquadMistake = useCallback(
    async (squadId: string, mistakeId: string): Promise<void> => {
      const uid = currentUser?.uid || 'guest-scholar';
      let targetMistake: SquadMistakeEntry | undefined;

      setSquadMistakes((prev) => {
        const currentList = prev[squadId] || [];
        const nextList = currentList.map((m) => {
          if (m.id === mistakeId) {
            const likedBy = m.likedBy || [];
            const hasLiked = likedBy.includes(uid);
            const nextLikedBy = hasLiked ? likedBy.filter((id) => id !== uid) : [...likedBy, uid];
            const updated = {
              ...m,
              likes: nextLikedBy.length,
              likedBy: nextLikedBy,
            };
            targetMistake = updated;
            return updated;
          }
          return m;
        });
        return { ...prev, [squadId]: nextList };
      });

      if (currentUser && targetMistake && !squadId.startsWith('sq-')) {
        try {
          await updateDoc(doc(db, 'squads', squadId, 'mistakes', mistakeId), {
            likes: targetMistake.likes,
            likedBy: targetMistake.likedBy,
          });
        } catch (e) {
          console.warn('Could not update like on Firestore:', e);
        }
      }
    },
    [currentUser]
  );

  // Publish a personal journal mistake into a squad
  const publishPersonalMistakeToSquad = useCallback(
    async (mistake: MistakeEntry, squadId: string): Promise<string> => {
      return addSquadMistake(squadId, {
        title: mistake.title,
        subjectId: mistake.subjectId,
        topicId: mistake.topicId,
        subtopicId: mistake.subtopicId,
        originalQuestion: mistake.originalQuestion,
        myAnswer: mistake.myAnswer,
        correctAnswer: mistake.correctAnswer,
        whatIGotWrong: mistake.whatIGotWrong,
        correctExplanation: mistake.correctExplanation,
        reflection: mistake.reflection,
        futureAdvice: mistake.futureAdvice,
        categories: mistake.categories,
        status: mistake.status,
        imageUrl: mistake.imageUrl,
        imageUrls: mistake.imageUrls,
      });
    },
    [addSquadMistake]
  );

  // Record review score & update squad leaderboard
  const recordSquadReviewScore = useCallback(
    async (squadId: string, accuracy: number, reviewsCount: number, masteredCount: number): Promise<void> => {
      const uid = currentUser?.uid || 'guest-scholar';
      const displayName = currentUser?.displayName || currentUserName || 'You (Scholar)';

      const newScore: SquadMemberScore = {
        uid,
        displayName,
        accuracy: Math.round(accuracy),
        reviewsCompleted: reviewsCount,
        cardsMastered: masteredCount,
        lastActiveDate: 'Just now',
      };

      setSquadScores((prev) => {
        const currentScores = prev[squadId] || [];
        const existingIdx = currentScores.findIndex((s) => s.uid === uid);
        let updated: SquadMemberScore[];
        if (existingIdx >= 0) {
          const old = currentScores[existingIdx];
          const combined: SquadMemberScore = {
            ...old,
            displayName,
            accuracy: Math.round((old.accuracy + accuracy) / 2),
            reviewsCompleted: old.reviewsCompleted + reviewsCount,
            cardsMastered: old.cardsMastered + masteredCount,
            lastActiveDate: 'Just now',
          };
          updated = [...currentScores];
          updated[existingIdx] = combined;
        } else {
          updated = [...currentScores, newScore];
        }
        updated.sort((a, b) => b.accuracy - a.accuracy || b.reviewsCompleted - a.reviewsCompleted);
        return { ...prev, [squadId]: updated };
      });

      if (currentUser && !squadId.startsWith('sq-')) {
        try {
          await setDoc(doc(db, 'squads', squadId, 'scores', uid), newScore, { merge: true });
        } catch (e) {
          console.warn('Could not record squad score to Firestore:', e);
        }
      }
    },
    [currentUser, currentUserName]
  );

  return {
    squads,
    activeSquad,
    activeSquadId,
    setActiveSquadId,
    squadMistakes,
    activeMistakes,
    squadScores,
    activeScores,
    loading,
    statusMessage,
    createSquad,
    joinSquad,
    addSquadMistake,
    editSquadMistake,
    deleteSquadMistake,
    likeSquadMistake,
    publishPersonalMistakeToSquad,
    recordSquadReviewScore,
  };
}
