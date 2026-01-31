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

// Subtopic with content for flashcards (Frontend State)
export interface Subtopic {
  subtopic_name: string;
  flashcard_content: string[];
  flashcard_emoji?: string;
  audio_script: string;
  duration_minutes: number;
  reference?: string;
}

// Course Module (Frontend State)
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
  isPublished?: boolean; 
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

// --- API Response Types ---

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

// --- Search & Learner Types ---

// 1. Schema for API Response (Full Course Data)
export interface FlashcardSchema {
  title: string;
  content: string[];
  emoji: string;
}

export interface SubtopicSchema {
  title: string;
  description: string;
  flashcards: FlashcardSchema[];
  audio_script?: string;
  duration_minutes: number;
}

export interface ModuleSchema {
  title: string;
  subtopics: SubtopicSchema[];
}

// 2. Updated Search Result Summary
export interface ExistingCourseSummary {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  match_score: number;
  syllabus: ModuleSchema[]; // <--- ADDED: Full syllabus structure from backend
}

export interface AssessmentQuestion {
  id: number;
  question_text: string;
  options: string[];
  type: string;
}

export interface LearnerAssessmentResponse {
  topic: string;
  questions: AssessmentQuestion[];
}

export interface UserAnswer {
  question_id: number;
  question_text: string;
  selected_option: string;
}

export type AppState = 
  | { step: 'search' }
  | { step: 'learner-search-results'; topic: string; courses: ExistingCourseSummary[] }
  | { step: 'learner-assessment'; topic: string; questions: AssessmentQuestion[] }
  | { step: 'evaluating-assessment' }
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