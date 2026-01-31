import { useState, useCallback } from 'react';
import { 
  CoursePlan, 
  DayContent, 
  Flashcard, 
  CourseModule, 
  QuizQuestion, 
  SyllabusModule,
  ModuleContentResponse
} from '@/types/course';
import { 
  ExistingCourse, 
  AssessmentQuestion, 
  AssessmentAnswer,
  CourseSearchResult
} from '@/types/learner';
import { authFetch } from '@/lib/auth';

const API_BASE = 'http://127.0.0.1:8000';

// Learner-specific state type
export type LearnerState = 
  | { step: 'search' }
  | { step: 'searching-courses' }
  | { step: 'course-results'; topic: string; existingCourses: ExistingCourse[] }
  | { step: 'loading-assessment' }
  | { step: 'assessment-quiz'; topic: string; questions: AssessmentQuestion[] }
  | { step: 'evaluating' }
  | { step: 'overview' }
  | { step: 'loading-content'; currentDay: number }
  | { step: 'flashcards'; currentDay: number; currentCard: number; moduleTitle?: string }
  | { step: 'loading-quiz'; currentDay: number }
  | { step: 'quiz'; currentDay: number; questions: QuizQuestion[] }
  | { step: 'day-complete'; currentDay: number }
  | { step: 'course-complete' };

export function useLearnerCourse() {
  const [state, setState] = useState<LearnerState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [syllabusModules, setSyllabusModules] = useState<SyllabusModule[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [currentTopic, setCurrentTopic] = useState<string>('');
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);

  // Edit mode state (for syllabus editing before starting)
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedModules, setEditedModules] = useState<SyllabusModule[]>([]);

  // Parse backend response format with dynamic keys
  const parseSyllabusResponse = useCallback((rawSyllabus: any[]): SyllabusModule[] => {
    return rawSyllabus.map(module => {
      const titleKey = Object.keys(module).find(k => k.startsWith('title_'));
      const moduleTitle = titleKey ? module[titleKey] : 'Untitled Module';

      const subtopics = (module.subtopics || []).map((sub: any) => {
        const subTitleKey = Object.keys(sub).find(k => k.startsWith('title_'));
        return subTitleKey ? sub[subTitleKey] : 'Untitled Subtopic';
      });

      return {
        module_title: moduleTitle,
        subtopics: subtopics
      };
    });
  }, []);

  // Build course state from syllabus modules
  const buildCourseFromSyllabus = useCallback((modules: SyllabusModule[], topicName: string, id: string) => {
    const courseModules: CourseModule[] = modules.map(m => ({
      topic: m.module_title,
      tag: 'needed' as const,
      subtopics: m.subtopics.map(sub => ({
        subtopic_name: sub,
        flashcard_content: [],
        audio_script: '',
        duration_minutes: 5,
      })),
    }));

    const schedule = courseModules.map((mod, idx) => ({
      day: idx + 1,
      focus_topic: mod.topic,
      summary: `${mod.subtopics.length} Subtopics`,
    }));

    return {
      topic: topicName,
      total_days: schedule.length,
      schedule,
      modules: courseModules,
      total_duration: schedule.length * 15,
      course_id: id,
    };
  }, []);

  // 1. Search for existing courses
  const searchCourses = useCallback(async (topic: string) => {
    setState({ step: 'searching-courses' });
    setCurrentTopic(topic);
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/learner/search?topic=${encodeURIComponent(topic)}`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Failed to search courses');
      }

      const data: CourseSearchResult = await response.json();

      if (data.existing_courses && data.existing_courses.length > 0) {
        // Found existing courses - show options
        setState({ 
          step: 'course-results', 
          topic, 
          existingCourses: data.existing_courses 
        });
      } else {
        // No courses found - start assessment flow
        await generateAssessment(topic);
      }
    } catch (err) {
      console.error('Search error:', err);
      // Fallback: start assessment flow on error
      await generateAssessment(topic);
    }
  }, []);

  // 2. Generate assessment quiz
  const generateAssessment = useCallback(async (topic: string) => {
    setState({ step: 'loading-assessment' });
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/learner/generate-assessment`, {
        method: 'POST',
        body: JSON.stringify({ topic }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate assessment');
      }

      const data = await response.json();

      setState({
        step: 'assessment-quiz',
        topic: data.topic || topic,
        questions: data.questions,
      });
    } catch (err) {
      console.error('Assessment generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate assessment');
      setState({ step: 'search' });
    }
  }, []);

  // 3. Evaluate answers and generate syllabus
  const evaluateAndGenerateSyllabus = useCallback(async (topic: string, answers: AssessmentAnswer[]) => {
    setState({ step: 'evaluating' });
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/learner/evaluate-syllabus`, {
        method: 'POST',
        body: JSON.stringify({ topic, answers }),
      });

      if (!response.ok) {
        throw new Error('Failed to evaluate and generate syllabus');
      }

      const data = await response.json();

      const parsedSyllabus = parseSyllabusResponse(data.syllabus);
      
      setCourseId(data.course_id);
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);

      const coursePlan = buildCourseFromSyllabus(parsedSyllabus, data.topic, data.course_id);
      setPlan(coursePlan);

      setState({ step: 'overview' });
    } catch (err) {
      console.error('Evaluation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate personalized syllabus');
      setState({ step: 'search' });
    }
  }, [parseSyllabusResponse, buildCourseFromSyllabus]);

  // 4. Enroll in existing course
  const enrollInCourse = useCallback(async (existingCourseId: string) => {
    setState({ step: 'evaluating' }); // Use as loading state
    setError(null);

    try {
      // Fetch course details and enroll
      const response = await authFetch(`${API_BASE}/learner/enroll/${existingCourseId}`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to enroll in course');
      }

      const data = await response.json();

      const parsedSyllabus = parseSyllabusResponse(data.syllabus || []);
      
      setCourseId(existingCourseId);
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);

      const coursePlan = buildCourseFromSyllabus(parsedSyllabus, data.topic || currentTopic, existingCourseId);
      setPlan(coursePlan);

      setState({ step: 'overview' });
    } catch (err) {
      console.error('Enrollment error:', err);
      setError(err instanceof Error ? err.message : 'Failed to enroll');
      setState({ step: 'search' });
    }
  }, [currentTopic, parseSyllabusResponse, buildCourseFromSyllabus]);

  // 5. Generate module content (reuses creator API)
  const generateModuleContent = useCallback(async (moduleTitle: string, dayNumber: number) => {
    if (!courseId) return;

    setState({ step: 'loading-content', currentDay: dayNumber });
    setError(null);

    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}/generate-module-content`, {
        method: 'POST',
        body: JSON.stringify({ topic: moduleTitle }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate content');
      }

      const data: ModuleContentResponse = await response.json();

      // Convert to flashcards (without exposing audio script)
      const flashcards: Flashcard[] = data.results.map(sub => ({
        title: sub.subtopic_title,
        content: sub.flashcard_points.join('\n\n'),
        audioScript: sub.audio_script, // Keep for audio but hide in UI
        flashcard_emoji: sub.flashcard_emoji || '💡',
      }));

      setDayContents(prev => ({
        ...prev,
        [dayNumber]: { flashcards },
      }));

      // Update plan modules with generated content
      if (plan?.modules) {
        const updatedModules = plan.modules.map(mod => {
          if (mod.topic === moduleTitle) {
            return {
              ...mod,
              subtopics: data.results.map(sub => ({
                subtopic_name: sub.subtopic_title,
                flashcard_content: sub.flashcard_points,
                flashcard_emoji: sub.flashcard_emoji,
                audio_script: sub.audio_script,
                duration_minutes: sub.duration_minutes,
              })),
            };
          }
          return mod;
        });

        setPlan(prev => prev ? { ...prev, modules: updatedModules } : null);
      }

      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0, moduleTitle });
    } catch (err) {
      console.error('Content generation error:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      setState({ step: 'overview' });
    }
  }, [courseId, plan]);

  // Edit mode functions (simplified for learner - only before starting)
  const startEditMode = useCallback(() => {
    setEditedModules([...syllabusModules]);
    setIsEditMode(true);
  }, [syllabusModules]);

  const cancelEditMode = useCallback(() => {
    setEditedModules([...syllabusModules]);
    setIsEditMode(false);
  }, [syllabusModules]);

  const updateModuleTitle = useCallback((oldTitle: string, newTitle: string) => {
    setEditedModules(prev => prev.map(m =>
      m.module_title === oldTitle ? { ...m, module_title: newTitle } : m
    ));
  }, []);

  const updateSubtopicTitle = useCallback((moduleTitle: string, subtopicIndex: number, newSubtopic: string) => {
    setEditedModules(prev => prev.map(m =>
      m.module_title === moduleTitle
        ? { ...m, subtopics: m.subtopics.map((s, i) => i === subtopicIndex ? newSubtopic : s) }
        : m
    ));
  }, []);

  const deleteSubtopic = useCallback((moduleTitle: string, subtopicIndex: number) => {
    setEditedModules(prev => prev.map(m =>
      m.module_title === moduleTitle
        ? { ...m, subtopics: m.subtopics.filter((_, i) => i !== subtopicIndex) }
        : m
    ));
  }, []);

  const addSubtopic = useCallback((moduleTitle: string) => {
    setEditedModules(prev => prev.map(m =>
      m.module_title === moduleTitle
        ? { ...m, subtopics: [...m.subtopics, 'New Subtopic'] }
        : m
    ));
  }, []);

  const reorderSubtopic = useCallback((moduleTitle: string, index: number, direction: 'up' | 'down') => {
    setEditedModules(prev => prev.map(m => {
      if (m.module_title !== moduleTitle) return m;

      const newSubtopics = [...m.subtopics];
      if (direction === 'up' && index > 0) {
        [newSubtopics[index - 1], newSubtopics[index]] = [newSubtopics[index], newSubtopics[index - 1]];
      } else if (direction === 'down' && index < newSubtopics.length - 1) {
        [newSubtopics[index], newSubtopics[index + 1]] = [newSubtopics[index + 1], newSubtopics[index]];
      }

      return { ...m, subtopics: newSubtopics };
    }));
  }, []);

  const deleteModule = useCallback((moduleTitle: string) => {
    setEditedModules(prev => prev.filter(m => m.module_title !== moduleTitle));
  }, []);

  const addModule = useCallback(() => {
    setEditedModules(prev => [...prev, { module_title: 'New Module', subtopics: [] }]);
  }, []);

  // Save syllabus edits (before starting course)
  const saveSyllabusEdits = useCallback(async () => {
    if (!courseId || !plan) return false;

    try {
      setSyllabusModules(editedModules);
      const updatedPlan = buildCourseFromSyllabus(editedModules, plan.topic, courseId);
      setPlan(updatedPlan);
      setIsEditMode(false);
      return true;
    } catch (err) {
      console.error('Save error:', err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      return false;
    }
  }, [courseId, editedModules, plan, buildCourseFromSyllabus]);

  // Toggle module needed/not needed
  const toggleModule = useCallback((topicName: string) => {
    if (!plan?.modules) return;

    const updatedModules = plan.modules.map(m => {
      if (m.topic === topicName) {
        return { ...m, tag: m.tag === 'needed' ? 'not needed' : 'needed' } as CourseModule;
      }
      return m;
    });

    const activeModules = updatedModules.filter(m => m.tag === 'needed');
    const schedule = activeModules.map((mod, idx) => ({
      day: idx + 1,
      focus_topic: mod.topic,
      summary: `${mod.subtopics.length} Subtopics`,
    }));

    setPlan(prev => prev ? {
      ...prev,
      modules: updatedModules,
      schedule,
      total_days: schedule.length,
    } : null);
  }, [plan]);

  // Navigation
  const goToDay = useCallback((dayNumber: number, cardIndex: number = 0) => {
    if (dayContents[dayNumber]) {
      const moduleTitle = plan?.schedule.find(s => s.day === dayNumber)?.focus_topic;
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: cardIndex, moduleTitle });
    }
  }, [dayContents, plan]);

  const goToOverview = useCallback(() => {
    setState({ step: 'overview' });
  }, []);

  const nextCard = useCallback(() => {
    if (state.step !== 'flashcards') return;
    const content = dayContents[state.currentDay];
    if (!content) return;

    if (state.currentCard < content.flashcards.length - 1) {
      setState({ ...state, currentCard: state.currentCard + 1 });
    } else {
      // Completed all flashcards for this module
      setCompletedDays(prev => prev.includes(state.currentDay) ? prev : [...prev, state.currentDay]);
      setState({ step: 'day-complete', currentDay: state.currentDay });
    }
  }, [state, dayContents]);

  const previousCard = useCallback(() => {
    if (state.step !== 'flashcards') return;
    if (state.currentCard > 0) {
      setState({ ...state, currentCard: state.currentCard - 1 });
    }
  }, [state]);

  const proceedToNextDay = useCallback(() => {
    if (state.step !== 'day-complete') return;
    
    const nextDay = state.currentDay + 1;
    if (plan && nextDay <= plan.total_days) {
      setState({ step: 'overview' });
    } else {
      setState({ step: 'course-complete' });
    }
  }, [state, plan]);

  const restartCourse = useCallback(() => {
    setState({ step: 'search' });
    setPlan(null);
    setSyllabusModules([]);
    setCourseId(null);
    setDayContents({});
    setCompletedDays([]);
    setCurrentTopic('');
    setError(null);
  }, []);

  // Handle "Create New" from course results
  const startNewCourseFlow = useCallback(async () => {
    if (currentTopic) {
      await generateAssessment(currentTopic);
    }
  }, [currentTopic, generateAssessment]);

  return {
    state,
    plan,
    courseId,
    dayContents,
    completedDays,
    error,
    isEditMode,
    editedModules,
    // Actions
    searchCourses,
    generateAssessment,
    evaluateAndGenerateSyllabus,
    enrollInCourse,
    startNewCourseFlow,
    generateModuleContent,
    saveSyllabusEdits,
    toggleModule,
    startEditMode,
    cancelEditMode,
    updateModuleTitle,
    updateSubtopicTitle,
    deleteSubtopic,
    addSubtopic,
    reorderSubtopic,
    deleteModule,
    addModule,
    goToDay,
    goToOverview,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
  };
}
