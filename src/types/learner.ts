// Learner-specific types for course search, assessment, and enrollment

export interface ExistingCourse {
  id: string;
  title: string;
  description: string;
  creator_name: string;
  match_score: number;
}

export interface CourseSearchResult {
  existing_courses: ExistingCourse[];
  message: string;
}

export interface AssessmentQuestion {
  id: number;
  question_text: string;
  options: string[];
  type: 'multiple_choice';
}

export interface AssessmentResponse {
  topic: string;
  questions: AssessmentQuestion[];
}

export interface AssessmentAnswer {
  question_id: number;
  question_text: string;
  selected_option: string;
}

export interface EvaluateSyllabusRequest {
  topic: string;
  answers: AssessmentAnswer[];
}

export interface EvaluateSyllabusResponse {
  course_id: string;
  topic: string;
  syllabus: any[]; // Dynamic keys like title_1, etc.
  message: string;
}

// Extended AppState for Learner Flow
export type LearnerFlowStep = 
  | 'search'
  | 'searching-courses'          // Loading state while searching
  | 'course-results'             // Show existing courses or option to create new
  | 'loading-assessment'         // Generating assessment quiz
  | 'assessment-quiz'            // Taking the assessment
  | 'evaluating'                 // Evaluating answers & generating syllabus
  | 'overview'                   // Viewing/editing syllabus
  | 'loading-content'            // Generating module content
  | 'flashcards'                 // Viewing flashcards
  | 'loading-quiz'               // Loading knowledge check
  | 'quiz'                       // Taking knowledge quiz
  | 'day-complete'
  | 'course-complete';
