export interface DaySchedule {
  day: number;
  focus_topic: string;
  summary: string;
}

export interface CoursePlan {
  topic: string;
  total_days: number;
  schedule: DaySchedule[];
}

export interface Flashcard {
  title: string;
  content: string;
}

export interface DayContent {
  flashcards: Flashcard[];
}

export type AppState = 
  | { step: 'search' }
  | { step: 'loading-plan' }
  | { step: 'overview' }
  | { step: 'day-cover'; currentDay: number }
  | { step: 'loading-content'; currentDay: number }
  | { step: 'flashcards'; currentDay: number; currentCard: number }
  | { step: 'day-complete'; currentDay: number }
  | { step: 'course-complete' };
