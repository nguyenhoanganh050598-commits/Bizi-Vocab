export type Level = 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2';

export interface LevelInfo {
  level: Level;
  ielts: string;
  description: string;
  requiredWords: number;
}

export const LEVELS: LevelInfo[] = [
  { level: 'A1', ielts: '0 - 1.0', description: 'Beginner', requiredWords: 500 },
  { level: 'A2', ielts: '1.5 - 2.5', description: 'Elementary', requiredWords: 1000 },
  { level: 'B1', ielts: '3.0 - 4.0', description: 'Intermediate', requiredWords: 2000 },
  { level: 'B2', ielts: '4.5 - 5.5', description: 'Upper Intermediate', requiredWords: 4000 },
  { level: 'C1', ielts: '6.0 - 7.0', description: 'Advanced', requiredWords: 8000 },
  { level: 'C2', ielts: '7.5 - 9.0', description: 'Proficient', requiredWords: 16000 },
];

export interface Word {
  id?: string;
  word: string;
  level: Level;
  vietnameseMeaning: string;
  ipa: string;
  wordFamily: string[];
  partOfSpeech: string;
  definition: string;
}

export interface UserProgress {
  wordId: string;
  status: 'learning' | 'known';
  lastReviewed: string; // ISO string
  nextReview: string; // ISO string
  interval: number;
  easeFactor: number;
  attempts: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  currentLevel?: Level;
  xp: number;
}
