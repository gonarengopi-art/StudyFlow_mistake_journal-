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
