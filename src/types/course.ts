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

// Subtopic with content for flashcards
export interface Subtopic {
  subtopic_name: string;
  flashcard_content: string[];
  flashcard_emoji?: string;
  audio_script: string;
  duration_minutes: number;
  reference?: string;
}

// Course Module (from API response)
export interface CourseModule {
  topic: string;
  tag: 'needed' | 'not needed';
  subtopics: Subtopic[];
}

// Syllabus Module (simpler, before content generation)
export interface SyllabusModule {
  module_title: string;
  subtopics: string[];
}

// Course Plan with modules
export interface CoursePlan {
  topic: string;
  total_days: number;
  schedule: DaySchedule[];
  expertise?: string;
  modules?: CourseModule[];
  total_duration?: number;
  course_id?: string; // Backend course ID for API calls
}

// Flashcard for display
export interface Flashcard {
  title: string;
  content: string;
  reference?: string;
  audioScript?: string;
  flashcard_emoji?: string;
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

// Persona for customized course generation
export interface Persona {
  target_audience?: string;
  current_knowledge?: string;
  learning_goal?: string;
  tone?: string;
}

// API Response Types
export interface CourseDraftResponse {
  course_id: string;
  topic: string;
  syllabus: SyllabusModule[];
  message: string;
}

export interface ModuleContentResponse {
  module_title: string;
  results: {
    subtopic_title: string;
    flashcard_points: string[];
    flashcard_emoji: string;
    audio_script: string;
    duration_minutes: number;
  }[];
}

export interface ContentGenerationResponse {
  course_title: string;
  module_title: string;
  subtopic_title: string;
  flashcard_points: string[];
  flashcard_emoji: string;
  audio_script: string;
  duration_minutes: number;
  message: string;
}

export type AppState = 
  | { step: 'search' }
  | { step: 'loading-syllabus' }
  | { step: 'syllabus' }
  | { step: 'loading-plan' }
  | { step: 'overview' }
  | { step: 'day-cover'; currentDay: number }
  | { step: 'loading-content'; currentDay: number }
  | { step: 'flashcards'; currentDay: number; currentCard: number; moduleTitle?: string }
  | { step: 'loading-quiz'; currentDay: number }
  | { step: 'quiz'; currentDay: number; questions: QuizQuestion[] }
  | { step: 'day-complete'; currentDay: number }
  | { step: 'course-complete' };
