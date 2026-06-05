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

    const unsubSubjects = onSnapshot(
      query(collection(db, 'subjects'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Subject[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Subject);
        });
        setSubjects(items);
        setLoading(false);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'subjects')
    );

    const unsubTopics = onSnapshot(
      query(collection(db, 'topics'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Topic[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Topic);
        });
        setTopics(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'topics')
    );

    const unsubSubtopics = onSnapshot(
      query(collection(db, 'subtopics'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: Subtopic[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as Subtopic);
        });
        setSubtopics(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'subtopics')
    );

    const unsubMistakes = onSnapshot(
      query(collection(db, 'mistakes'), where('userId', '==', user.uid)),
      (snapshot) => {
        const items: MistakeEntry[] = [];
        snapshot.forEach((doc) => {
          items.push(doc.data() as MistakeEntry);
        });
        setMistakes(items);
      },
      (error) => handleFirestoreError(error, OperationType.LIST, 'mistakes')
    );

    return () => {
      unsubSubjects();
      unsubTopics();
      unsubSubtopics();
      unsubMistakes();
    };
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
    
    if (user) {
      try {
        await setDoc(doc(db, 'subjects', newId), cleanUndefined({ ...newSubject, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subjects/${newId}`);
      }
    } else {
      const newSubjects = [...subjects, newSubject];
      setSubjects(newSubjects);
      localStorage.setItem('studyflow_subjects', JSON.stringify(newSubjects));
    }
    return newId;
  };

  const editSubject = async (id: string, name: string) => {
    if (user) {
      try {
        await setDoc(doc(db, 'subjects', id), cleanUndefined({ id, name, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subjects/${id}`);
      }
    } else {
      const newSubjects = subjects.map((s) => (s.id === id ? { ...s, name } : s));
      setSubjects(newSubjects);
      localStorage.setItem('studyflow_subjects', JSON.stringify(newSubjects));
    }
  };

  const deleteSubject = async (id: string) => {
    if (user) {
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

      localStorage.setItem('studyflow_subjects', JSON.stringify(newSubjects));
      localStorage.setItem('studyflow_topics', JSON.stringify(newTopics));
      localStorage.setItem('studyflow_subtopics', JSON.stringify(newSubtopics));
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  // TOPIC OPERATIONS
  const addTopic = async (subjectId: string, name: string): Promise<string> => {
    const newId = `tp-${Date.now()}`;
    const newTopic: Topic = { id: newId, subjectId, name };

    if (user) {
      try {
        await setDoc(doc(db, 'topics', newId), cleanUndefined({ ...newTopic, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `topics/${newId}`);
      }
    } else {
      const newTopics = [...topics, newTopic];
      setTopics(newTopics);
      localStorage.setItem('studyflow_topics', JSON.stringify(newTopics));
    }
    return newId;
  };

  const editTopic = async (id: string, name: string) => {
    if (user) {
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
      localStorage.setItem('studyflow_topics', JSON.stringify(newTopics));
    }
  };

  const deleteTopic = async (id: string) => {
    if (user) {
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

      localStorage.setItem('studyflow_topics', JSON.stringify(newTopics));
      localStorage.setItem('studyflow_subtopics', JSON.stringify(newSubtopics));
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  // SUBTOPIC OPERATIONS
  const addSubtopic = async (topicId: string, name: string): Promise<string> => {
    const newId = `sbt-${Date.now()}`;
    const newSub: Subtopic = { id: newId, topicId, name };

    if (user) {
      try {
        await setDoc(doc(db, 'subtopics', newId), cleanUndefined({ ...newSub, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `subtopics/${newId}`);
      }
    } else {
      const newSubtopics = [...subtopics, newSub];
      setSubtopics(newSubtopics);
      localStorage.setItem('studyflow_subtopics', JSON.stringify(newSubtopics));
    }
    return newId;
  };

  const editSubtopic = async (id: string, name: string) => {
    if (user) {
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
      localStorage.setItem('studyflow_subtopics', JSON.stringify(newSubtopics));
    }
  };

  const deleteSubtopic = async (id: string) => {
    if (user) {
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

      localStorage.setItem('studyflow_subtopics', JSON.stringify(newSubtopics));
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
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

    if (user) {
      try {
        await setDoc(doc(db, 'mistakes', newId), cleanUndefined({ ...newEntry, userId: user.uid }));
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `mistakes/${newId}`);
      }
    } else {
      const newMistakes = [newEntry, ...mistakes];
      setMistakes(newMistakes);
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
    }
    return newId;
  };

  const editMistake = async (id: string, updatedFields: Partial<MistakeEntry>) => {
    if (user) {
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
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  const deleteMistake = async (id: string) => {
    if (user) {
      try {
        await deleteDoc(doc(db, 'mistakes', id));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `mistakes/${id}`);
      }
    } else {
      const newMistakes = mistakes.filter((m) => m.id !== id);
      setMistakes(newMistakes);
      localStorage.setItem('studyflow_mistakes', JSON.stringify(newMistakes));
    }
  };

  return {
    user,
    subjects,
    topics,
    subtopics,
    mistakes,
    loading,
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
    signInWithGoogle,
    logout
  };
}
