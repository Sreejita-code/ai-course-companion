export interface DaySchedule {
  day: number;
  focus_topic: string;
  summary: string;
}

export interface Syllabus {
  topic: string;
  expertise: string;
  syllabus: string[];
}

export interface TopicItem {
  topic: string;
  tag: 'needed' | 'not needed';
}

// New interfaces for the hierarchical view
export interface Subtopic {
  subtopic_name: string;
  flashcard_content: string[];
  audio_script: string;
  duration_minutes: number;
  reference?: string;
}

export interface CourseModule {
  topic: string;
  tag: 'needed' | 'not needed';
  subtopics: Subtopic[];
}

export interface CoursePlan {
  topic: string;
  total_days: number;
  schedule: DaySchedule[];
  expertise?: string;
  modules?: CourseModule[]; // Added to store the hierarchical plan
  total_duration?: number;
}

export interface Flashcard {
  title: string;
  content: string;
  reference?: string;
  audioScript?: string;
}

export interface DayContent {
  flashcards: Flashcard[];
}

export interface QuizQuestion {
  id: number;
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}


export type AppState = 
  | { step: 'search' }
  | { step: 'loading-syllabus' }
  | { step: 'syllabus' }
  | { step: 'loading-plan' }
  | { step: 'overview' }
  | { step: 'day-cover'; currentDay: number }
  | { step: 'loading-content'; currentDay: number }
  | { step: 'flashcards'; currentDay: number; currentCard: number }
  // --- ADD THESE NEW STATES ---
  | { step: 'loading-quiz'; currentDay: number }
  | { step: 'quiz'; currentDay: number; questions: QuizQuestion[] }
  // ----------------------------
  | { step: 'day-complete'; currentDay: number }
  | { step: 'course-complete' };

  // ... existing types


