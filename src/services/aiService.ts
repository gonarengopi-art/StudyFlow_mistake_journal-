/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Subject, Topic, MistakeCategory } from '../types';

export interface ExtractedMistakeData {
  title: string;
  suggestedSubject: string;
  suggestedTopic: string;
  suggestedSubtopic?: string;
  originalQuestion: string;
  myAnswer: string;
  correctAnswer: string;
  whatIGotWrong: string;
  correctExplanation: string;
  reflection: string;
  futureAdvice: string;
  categories: MistakeCategory[];
}

export interface ClonePracticeOption {
  label: 'A' | 'B' | 'C' | 'D' | string;
  text: string;
  isCorrect: boolean;
  feedback: string;
}

export interface ClonePracticeQuestion {
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Challenging';
  question: string;
  options: ClonePracticeOption[];
  correctOption: string;
  hint: string;
  conceptSummary: string;
  fullSolution: string;
}

export async function extractMistakeFromAI(params: {
  imageBase64?: string;
  text?: string;
  existingSubjects?: Subject[];
  existingTopics?: Topic[];
}): Promise<ExtractedMistakeData> {
  const response = await fetch('/api/ai/extract-mistake', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      imageBase64: params.imageBase64,
      text: params.text,
      existingSubjects: params.existingSubjects || [],
      existingTopics: params.existingTopics || [],
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to extract mistake (${response.status})`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Invalid response structure from AI extraction service.');
  }

  return result.data as ExtractedMistakeData;
}

export async function generateClonePractice(params: {
  originalQuestion: string;
  correctAnswer?: string;
  whatIGotWrong?: string;
  reflection?: string;
  subjectName?: string;
  topicName?: string;
  categories?: string[];
  difficulty?: 'Easy' | 'Medium' | 'Challenging';
}): Promise<ClonePracticeQuestion> {
  const response = await fetch('/api/ai/generate-clone-practice', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Failed to generate clone practice (${response.status})`);
  }

  const result = await response.json();
  if (!result.success || !result.data) {
    throw new Error('Invalid response structure from AI practice generator.');
  }

  return result.data as ClonePracticeQuestion;
}
