/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type MistakeCategory =
  | 'Careless Error'
  | 'Content Gap'
  | 'Misread Question'
  | 'Exam Technique'
  | 'Timing Issue'
  | 'Calculation Error'
  | 'Knowledge Recall'
  | 'Other';

export type ReviewStatus = 'New' | 'Reviewing' | 'Mastered';

export interface Subject {
  id: string;
  name: string;
}

export interface Topic {
  id: string;
  subjectId: string;
  name: string;
}

export interface Subtopic {
  id: string;
  topicId: string;
  name: string;
}

export interface MistakeEntry {
  id: string;
  title: string;
  subjectId: string;
  topicId: string;
  subtopicId?: string; // Subtopic is optional as per core structure list
  dateLogged: string; // YYYY-MM-DD
  imageUrl?: string; // Path or base64 data for display
  imageUrls?: string[]; // Supporting multiple uploaded images / photos
  fileUrl?: string; // Placeholders or dummy file
  fileName?: string;

  // Learning information
  originalQuestion: string;
  myAnswer: string;
  correctAnswer: string;
  whatIGotWrong: string;
  correctExplanation: string;

  // Reflection Section
  reflection: string; // "What did I misunderstand?"

  // Future Self Advice
  futureAdvice: string; // "What should I remember next time?"

  // Mistake Category
  categories: MistakeCategory[];

  // Review Status
  status: ReviewStatus;
}

export interface StudySquad {
  id: string;
  name: string;
  description?: string;
  code: string; // 6-character unique code e.g. 'BIO492'
  subjectId: string;
  ownerUid: string;
  ownerName: string;
  memberUids: string[];
  memberNames?: Record<string, string>; // uid -> displayName
  createdAt: string;
}

export interface SquadMistakeEntry {
  id: string;
  squadId: string;
  title: string;
  subjectId: string;
  topicId?: string;
  subtopicId?: string;
  dateLogged: string;
  imageUrl?: string;
  imageUrls?: string[];
  originalQuestion: string;
  myAnswer: string;
  correctAnswer: string;
  whatIGotWrong?: string;
  correctExplanation: string;
  reflection?: string;
  futureAdvice?: string;
  categories: MistakeCategory[];
  status?: ReviewStatus;
  authorUid: string;
  authorName: string;
  lastEditedByName?: string;
  lastEditedAt?: string;
  likes?: number;
  likedBy?: string[];
}

export interface SquadMemberScore {
  uid: string;
  displayName: string;
  accuracy: number;
  reviewsCompleted: number;
  cardsMastered: number;
  lastActiveDate: string;
}
