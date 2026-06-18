/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Subject, Topic, Subtopic, MistakeEntry } from './types';
import { auth, db } from './firebase';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut, 
  User 
} from 'firebase/auth';
import { 
  collection, 
  doc, 
  setDoc, 
  getDoc,
  deleteDoc, 
  onSnapshot, 
  query, 
  where,
  getDocFromServer
} from 'firebase/firestore';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

let globalQuotaListener: ((exceeded: boolean, msg: string) => void) | null = null;

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));

  const errorMessageText = errInfo.error;
  if (
    errorMessageText.toLowerCase().includes('quota') ||
    errorMessageText.toLowerCase().includes('quota limit') ||
    errorMessageText.toLowerCase().includes('limit exceeded')
  ) {
    if (globalQuotaListener) {
      globalQuotaListener(true, errorMessageText);
    }
  }

  throw new Error(JSON.stringify(errInfo));
}

function cleanUndefined<T extends object>(obj: T): T {
  const result = { ...obj };
  Object.keys(result).forEach((key) => {
    if ((result as any)[key] === undefined) {
      delete (result as any)[key];
    }
  });
  return result;
}

export function useJournalStore() {
  const [user, setUser] = useState<User | null>(null);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [topics, setTopics] = useState<Topic[]>([]);
  const [subtopics, setSubtopics] = useState<Subtopic[]>([]);
  const [mistakes, setMistakes] = useState<MistakeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userDocData, setUserDocData] = useState<any | null>(null);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const [quotaErrorMessage, setQuotaErrorMessage] = useState<string | null>(null);

  // New Quota states
  const [quotaReads, setQuotaReads] = useState<number>(0);

  const getTodayStr = () => {
    return new Date().toISOString().split('T')[0];
  };

  const getLocalQuotaReads = (uid: string) => {
    const today = getTodayStr();
    try {
      const cached = localStorage.getItem(`studyflow_quota_${uid}`);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed.date === today) {
          return parsed.reads || 0;
        }
      }
    } catch (e) {
      console.error(e);
    }
    return 0;
  };

  const saveLocalQuotaReads = (uid: string, reads: number) => {
    const today = getTodayStr();
    try {
      localStorage.setItem(`studyflow_quota_${uid}`, JSON.stringify({ date: today, reads }));
    } catch (e) {
      console.error(e);
    }
  };

  const recordReads = (count: number, syncToFirebase: boolean = true) => {
    if (!user || count <= 0) return;
    const today = getTodayStr();
    const currentLocal = getLocalQuotaReads(user.uid);
    const newReads = currentLocal + count;
    
    saveLocalQuotaReads(user.uid, newReads);
    setQuotaReads(newReads);

    if (syncToFirebase && user.email !== 'gonarengopi@gmail.com') {
      const userRef = doc(db, 'users', user.uid);
      setDoc(userRef, {
        dailyQuotaReads: newReads,
        dailyQuotaDate: today
      }, { merge: true }).catch((err) => {
        console.warn("Could not sync reads to Firestore: ", err);
      });
    }
  };

  const isAdmin = user?.email === 'gonarengopi@gmail.com';
  const quotaLimit = userDocData?.dailyQuotaLimit !== undefined ? userDocData.dailyQuotaLimit : 1000;
  const isQuotaExceeded = !isAdmin && quotaReads >= quotaLimit;

  // Admin-specific state for global quota monitoring
  const [allUsers, setAllUsers] = useState<any[]>([]);

  // Subscribe to all users in real-time ONLY if authenticated and is admin
  useEffect(() => {
    if (!user || user.email !== 'gonarengopi@gmail.com') {
      setAllUsers([]);
      return;
    }

    const unsub = onSnapshot(
      collection(db, 'users'),
      (snapshot) => {
        const list: any[] = [];
        snapshot.forEach((doc) => {
          list.push({ id: doc.id, ...doc.data() });
        });
        setAllUsers(list);
      },
      (err) => {
        console.warn("Could not load users for admin in store:", err);
      }
    );

    return unsub;
  }, [user]);

  const totalLiveReadsToday = (() => {
    const today = getTodayStr();
    return allUsers.reduce((sum, u) => {
      if (u.dailyQuotaDate === today) {
        return sum + (u.dailyQuotaReads || 0);
      }
      return sum;
    }, 0);
  })();

  // Initialize/sync quota reads strictly on authentication
  useEffect(() => {
    if (!user) {
      setQuotaReads(0);
      return;
    }
    setQuotaReads(getLocalQuotaReads(user.uid));
  }, [user]);

  useEffect(() => {
    globalQuotaListener = (exceeded, msg) => {
      setQuotaExceeded(exceeded);
      setQuotaErrorMessage(msg);
      setLoading(false);
    };
    return () => {
      globalQuotaListener = null;
    };
  }, []);

  // Reset user doc data when auth state becomes null
  useEffect(() => {
    if (!user) {
      setUserDocData(null);
    }
  }, [user]);

  // Validate connection on boot as per skill
  useEffect(() => {
    async function testConnection() {
      try {
        await getDocFromServer(doc(db, 'test', 'connection'));
      } catch (error) {
        if (error instanceof Error && error.message.includes('offline')) {
          console.error("Please check your Firebase configuration.");
        }
      }
    }
    testConnection();
  }, []);

  // Listen for Authentication state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setLoading(false);
      }
    });
    return unsubscribe;
  }, []);

  // Sync data with Firestore (if authenticated) or LocalStorage (if guest)
  useEffect(() => {
    if (!user) {
      // Offline/Guest mode - load from localStorage, but default to completely BLANK empty maps
      try {
        const storedSubjects = localStorage.getItem('studyflow_subjects');
        const storedTopics = localStorage.getItem('studyflow_topics');
        const storedSubtopics = localStorage.getItem('studyflow_subtopics');
        const storedMistakes = localStorage.getItem('studyflow_mistakes');

        // Note: Starts with empty arrays [] as requested
        setSubjects(storedSubjects ? JSON.parse(storedSubjects) : []);
        setTopics(storedTopics ? JSON.parse(storedTopics) : []);
        setSubtopics(storedSubtopics ? JSON.parse(storedSubtopics) : []);
        setMistakes(storedMistakes ? JSON.parse(storedMistakes) : []);
      } catch (e) {
        console.error('Failed to load local data', e);
        setSubjects([]);
        setTopics([]);
        setSubtopics([]);
        setMistakes([]);
      }
      setLoading(false);
      return;
    }

    // Remote sync mode
    setLoading(true);

    const unsubUser = onSnapshot(
      doc(db, 'users', user.uid),
      (snapshot) => {
        if (snapshot.exists()) {
          const data = snapshot.data();
          setUserDocData(data);
          localStorage.setItem(`studyflow_user_${user.uid}`, JSON.stringify(data));
          
          const today = getTodayStr();
          if (data.dailyQuotaDate === today && typeof data.dailyQuotaReads === 'number') {
            const localReads = getLocalQuotaReads(user.uid);
            if (data.dailyQuotaReads > localReads) {
              saveLocalQuotaReads(user.uid, data.dailyQuotaReads);
              setQuotaReads(data.dailyQuotaReads);
            }
          }
        } else {
          setUserDocData(null);
        }
        recordReads(1, false); // Record locally, no server sync to prevent loops
      },
      (error) => {
        try {
          const cached = localStorage.getItem(`studyflow_user_${user.uid}`);
          if (cached) setUserDocData(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to load cached user', e);
        }
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      }
    );

    const unsubSubjects = onSnapshot(
      query(collection(db, 'subjects'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Subject[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Subject);
        });
        setSubjects(items);
        localStorage.setItem(`studyflow_subjects_${user.uid}`, JSON.stringify(items));
        setLoading(false);
        recordReads(snapshot.size);
      },
      (error) => {
        try {
          const cached = localStorage.getItem(`studyflow_subjects_${user.uid}`);
          if (cached) setSubjects(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to load cached subjects', e);
        }
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'subjects');
      }
    );

    const unsubTopics = onSnapshot(
      query(collection(db, 'topics'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Topic[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Topic);
        });
        setTopics(items);
        localStorage.setItem(`studyflow_topics_${user.uid}`, JSON.stringify(items));
        recordReads(snapshot.size);
      },
      (error) => {
        try {
          const cached = localStorage.getItem(`studyflow_topics_${user.uid}`);
          if (cached) setTopics(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to load cached topics', e);
        }
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'topics');
      }
    );

    const unsubSubtopics = onSnapshot(
      query(collection(db, 'subtopics'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Subtopic[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Subtopic);
        });
        setSubtopics(items);
        localStorage.setItem(`studyflow_subtopics_${user.uid}`, JSON.stringify(items));
        recordReads(snapshot.size);
      },
      (error) => {
        try {
          const cached = localStorage.getItem(`studyflow_subtopics_${user.uid}`);
          if (cached) setSubtopics(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to load cached subtopics', e);
        }
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'subtopics');
      }
    );

    const unsubMistakes = onSnapshot(
      query(collection(db, 'mistakes'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: MistakeEntry[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as MistakeEntry);
        });
        setMistakes(items);
        localStorage.setItem(`studyflow_mistakes_${user.uid}`, JSON.stringify(items));
        recordReads(snapshot.size);
      },
      (error) => {
        try {
          const cached = localStorage.getItem(`studyflow_mistakes_${user.uid}`);
          if (cached) setMistakes(JSON.parse(cached));
        } catch (e) {
          console.error('Failed to load cached mistakes', e);
        }
        setLoading(false);
        handleFirestoreError(error, OperationType.LIST, 'mistakes');
      }
    );

    return () => {
      unsubUser();
      unsubSubjects();
      unsubTopics();
      unsubSubtopics();
      unsubMistakes();
    };
  }, [user]);

  // Track / Register user session in public users collection to allow admin analytics
  useEffect(() => {
    if (!user) return;

    const trackUserSession = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef).catch(() => null);
        const nowIso = new Date().toISOString();

        if (userSnap && userSnap.exists()) {
          const existingData = userSnap.data();
          const joinedAtVal = existingData?.joinedAt || nowIso;
          // Update last active, do not overwrite joinedAt
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Anonymous Student',
            photoURL: user.photoURL || '',
            joinedAt: joinedAtVal,
            lastActive: nowIso
          }, { merge: true });
        } else {
          // Initialize fresh user entry
          await setDoc(userRef, {
            uid: user.uid,
            email: user.email || '',
            displayName: user.displayName || 'Anonymous Student',
            photoURL: user.photoURL || '',
            joinedAt: nowIso,
            lastActive: nowIso
          });
        }
      } catch (err) {
        console.warn("Could not write user tracking doc: ", err);
      }
    };

    trackUserSession();
  }, [user]);

  // Google Sign In
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      console.error('Google authorization error:', e);
    }
  };

  // Logout
  const logout = async () => {
    try {
      await signOut(auth);
      // Clean memory traces
      setSubjects([]);
      setTopics([]);
      setSubtopics([]);
      setMistakes([]);
    } catch (e) {
      console.error('Signout failed:', e);
    }
  };

  // SUBJECT OPERATIONS
  const addSubject = async (name: string): Promise<string> => {
    const newId = `sb-${Date.now()}`;
    const newSubject: Subject = { id: newId, name };
    
    if (user && !isQuotaExceeded) {
      try {
        await setDoc(doc(db, 'subjects', newId), cleanUndefined({ ...newSubject, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subjects/${newId}`);
      }
    } else {
      const newSubjects = [...subjects, newSubject];
      setSubjects(newSubjects);
      localStorage.setItem(user ? `studyflow_subjects_${user.uid}` : 'studyflow_subjects', JSON.stringify(newSubjects));
    }
    return newId;
  };

  const editSubject = async (id: string, name: string) => {
    if (user && !isQuotaExceeded) {
      try {
        await setDoc(doc(db, 'subjects', id), cleanUndefined({ id, name, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subjects/${id}`);
      }
    } else {
      const newSubjects = subjects.map((s) => (s.id === id ? { ...s, name } : s));
      setSubjects(newSubjects);
      localStorage.setItem(user ? `studyflow_subjects_${user.uid}` : 'studyflow_subjects', JSON.stringify(newSubjects));
    }
  };

  const deleteSubject = async (id: string) => {
    if (user && !isQuotaExceeded) {
      try {
        await deleteDoc(doc(db, 'subjects', id));
        
        // Cascade delete on Firestore for owned resources synchronously
        const topicsToDelete = topics.filter((t) => t.subjectId === id);
        for (const t of topicsToDelete) {
          await deleteDoc(doc(db, 'topics', t.id));
        }

        const topicsToDeleteIds = topicsToDelete.map((t) => t.id);
        const subtopicsToDelete = subtopics.filter((st) => topicsToDeleteIds.includes(st.topicId));
        for (const sbt of subtopicsToDelete) {
          await deleteDoc(doc(db, 'subtopics', sbt.id));
        }

        const mistakesToDelete = mistakes.filter((m) => m.subjectId === id);
        for (const m of mistakesToDelete) {
          await deleteDoc(doc(db, 'mistakes', m.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `subjects/${id}`);
      }
    } else {
      const newSubjects = subjects.filter((s) => s.id !== id);
      const topicsToDelete = topics.filter((t) => t.subjectId === id);
      const topicsToDeleteIds = topicsToDelete.map((t) => t.id);

      const newTopics = topics.filter((t) => t.subjectId !== id);
      const newSubtopics = subtopics.filter((st) => !topicsToDeleteIds.includes(st.topicId));
      const newMistakes = mistakes.filter((m) => m.subjectId !== id);

      setSubjects(newSubjects);
      setTopics(newTopics);
      setSubtopics(newSubtopics);
      setMistakes(newMistakes);

      const keyPref = user ? `_${user.uid}` : '';
      localStorage.setItem(`studyflow_subjects${keyPref}`, JSON.stringify(newSubjects));
      localStorage.setItem(`studyflow_topics${keyPref}`, JSON.stringify(newTopics));
      localStorage.setItem(`studyflow_subtopics${keyPref}`, JSON.stringify(newSubtopics));
      localStorage.setItem(`studyflow_mistakes${keyPref}`, JSON.stringify(newMistakes));
    }
  };

  // TOPIC OPERATIONS
  const addTopic = async (subjectId: string, name: string): Promise<string> => {
    const newId = `tp-${Date.now()}`;
    const newTopic: Topic = { id: newId, subjectId, name };

    if (user && !isQuotaExceeded) {
      try {
        await setDoc(doc(db, 'topics', newId), cleanUndefined({ ...newTopic, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `topics/${newId}`);
      }
    } else {
      const newTopics = [...topics, newTopic];
      setTopics(newTopics);
      localStorage.setItem(user ? `studyflow_topics_${user.uid}` : 'studyflow_topics', JSON.stringify(newTopics));
    }
    return newId;
  };

  const editTopic = async (id: string, name: string) => {
    if (user && !isQuotaExceeded) {
      try {
        const existingTopic = topics.find((t) => t.id === id);
        if (existingTopic) {
          await setDoc(doc(db, 'topics', id), cleanUndefined({
            id,
            subjectId: existingTopic.subjectId,
            name,
            userId: user.uid
          }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `topics/${id}`);
      }
    } else {
      const newTopics = topics.map((t) => (t.id === id ? { ...t, name } : t));
      setTopics(newTopics);
      localStorage.setItem(user ? `studyflow_topics_${user.uid}` : 'studyflow_topics', JSON.stringify(newTopics));
    }
  };

  const deleteTopic = async (id: string) => {
    if (user && !isQuotaExceeded) {
      try {
        await deleteDoc(doc(db, 'topics', id));

        const subtopicsToDelete = subtopics.filter((st) => st.topicId === id);
        for (const sbt of subtopicsToDelete) {
          await deleteDoc(doc(db, 'subtopics', sbt.id));
        }

        const mistakesToDelete = mistakes.filter((m) => m.topicId === id);
        for (const m of mistakesToDelete) {
          await deleteDoc(doc(db, 'mistakes', m.id));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `topics/${id}`);
      }
    } else {
      const newTopics = topics.filter((t) => t.id !== id);
      const newSubtopics = subtopics.filter((st) => st.topicId !== id);
      const newMistakes = mistakes.filter((m) => m.topicId !== id);

      setTopics(newTopics);
      setSubtopics(newSubtopics);
      setMistakes(newMistakes);

      const keyPref = user ? `_${user.uid}` : '';
      localStorage.setItem(`studyflow_topics${keyPref}`, JSON.stringify(newTopics));
      localStorage.setItem(`studyflow_subtopics${keyPref}`, JSON.stringify(newSubtopics));
      localStorage.setItem(`studyflow_mistakes${keyPref}`, JSON.stringify(newMistakes));
    }
  };

  // SUBTOPIC OPERATIONS
  const addSubtopic = async (topicId: string, name: string): Promise<string> => {
    const newId = `sbt-${Date.now()}`;
    const newSub: Subtopic = { id: newId, topicId, name };

    if (user && !isQuotaExceeded) {
      try {
        await setDoc(doc(db, 'subtopics', newId), cleanUndefined({ ...newSub, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subtopics/${newId}`);
      }
    } else {
      const newSubtopics = [...subtopics, newSub];
      setSubtopics(newSubtopics);
      localStorage.setItem(user ? `studyflow_subtopics_${user.uid}` : 'studyflow_subtopics', JSON.stringify(newSubtopics));
    }
    return newId;
  };

  const editSubtopic = async (id: string, name: string) => {
    if (user && !isQuotaExceeded) {
      try {
        const existingSub = subtopics.find((s) => s.id === id);
        if (existingSub) {
          await setDoc(doc(db, 'subtopics', id), cleanUndefined({
            id,
            topicId: existingSub.topicId,
            name,
            userId: user.uid
          }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subtopics/${id}`);
      }
    } else {
      const newSubtopics = subtopics.map((st) => (st.id === id ? { ...st, name } : st));
      setSubtopics(newSubtopics);
      localStorage.setItem(user ? `studyflow_subtopics_${user.uid}` : 'studyflow_subtopics', JSON.stringify(newSubtopics));
    }
  };

  const deleteSubtopic = async (id: string) => {
    if (user && !isQuotaExceeded) {
      try {
        await deleteDoc(doc(db, 'subtopics', id));
        // Unlink associated mistakes rather than deleting
        const mistakesToUnlink = mistakes.filter((m) => m.subtopicId === id);
        for (const m of mistakesToUnlink) {
          await setDoc(doc(db, 'mistakes', m.id), cleanUndefined({
            ...m,
            subtopicId: '', // or delete field
          }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `subtopics/${id}`);
      }
    } else {
      const newSubtopics = subtopics.filter((st) => st.id !== id);
      const newMistakes = mistakes.map((m) => (m.subtopicId === id ? { ...m, subtopicId: undefined } : m));

      setSubtopics(newSubtopics);
      setMistakes(newMistakes);

      const keyPref = user ? `_${user.uid}` : '';
      localStorage.setItem(`studyflow_subtopics${keyPref}`, JSON.stringify(newSubtopics));
      localStorage.setItem(`studyflow_mistakes${keyPref}`, JSON.stringify(newMistakes));
    }
  };

  // MISTAKE OPERATIONS
  const addMistake = async (entry: Omit<MistakeEntry, 'id' | 'dateLogged'> & { dateLogged?: string }): Promise<string> => {
    const newId = `m-${Date.now()}`;
    const today = new Date().toISOString().split('T')[0];
    const newEntry: MistakeEntry = {
      ...entry,
      id: newId,
      dateLogged: entry.dateLogged || today
    };

    if (user && !isQuotaExceeded) {
      try {
        await setDoc(doc(db, 'mistakes', newId), cleanUndefined({ ...newEntry, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `mistakes/${newId}`);
      }
    } else {
      const newMistakes = [newEntry, ...mistakes];
      setMistakes(newMistakes);
      localStorage.setItem(user ? `studyflow_mistakes_${user.uid}` : 'studyflow_mistakes', JSON.stringify(newMistakes));
    }
    return newId;
  };

  const editMistake = async (id: string, updatedFields: Partial<MistakeEntry>) => {
    if (user && !isQuotaExceeded) {
      try {
        const existingMistake = mistakes.find((m) => m.id === id);
        if (existingMistake) {
          await setDoc(doc(db, 'mistakes', id), cleanUndefined({
            ...existingMistake,
            ...updatedFields,
            userId: user.uid
          }));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `mistakes/${id}`);
      }
    } else {
      const newMistakes = mistakes.map((m) => (m.id === id ? { ...m, ...updatedFields } as MistakeEntry : m));
      setMistakes(newMistakes);
      localStorage.setItem(user ? `studyflow_mistakes_${user.uid}` : 'studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  const deleteMistake = async (id: string) => {
    if (user && !isQuotaExceeded) {
      try {
        await deleteDoc(doc(db, 'mistakes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `mistakes/${id}`);
      }
    } else {
      const newMistakes = mistakes.filter((m) => m.id !== id);
      setMistakes(newMistakes);
      localStorage.setItem(user ? `studyflow_mistakes_${user.uid}` : 'studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  const updateNewsletterPreference = async (optIn: boolean) => {
    if (!user) return;
    try {
      const userRef = doc(db, 'users', user.uid);
      await setDoc(userRef, {
        newsletterOptIn: optIn,
        newsletterOptInAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `users/${user.uid}`);
    }
  };

  return {
    user,
    userDocData,
    subjects,
    topics,
    subtopics,
    mistakes,
    loading,
    quotaExceeded: quotaExceeded || isQuotaExceeded,
    quotaErrorMessage: quotaErrorMessage || (isQuotaExceeded ? `Daily reads quota limits reached (${quotaReads}/${quotaLimit} reads). Your changes will be saved to local browser cache.` : null),
    quotaReads,
    quotaLimit,
    isAdmin,
    isQuotaExceeded,
    allUsers,
    totalLiveReadsToday,
    addSubject,
    editSubject,
    deleteSubject,
    addTopic,
    editTopic,
    deleteTopic,
    addSubtopic,
    editSubtopic,
    deleteSubtopic,
    addMistake,
    editMistake,
    deleteMistake,
    updateNewsletterPreference,
    signInWithGoogle,
    logout
  };
}
