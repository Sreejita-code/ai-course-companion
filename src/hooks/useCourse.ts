import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState, Flashcard, CourseModule, QuizQuestion, SyllabusModule, Persona, ModuleContentResponse } from '@/types/course';
import { authFetch } from '@/lib/auth';

const API_BASE = 'http://127.0.0.1:8001';

export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [syllabusModules, setSyllabusModules] = useState<SyllabusModule[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  // Quiz Cache
  const [quizCache, setQuizCache] = useState<Record<number, QuizQuestion[]>>({});

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedModules, setEditedModules] = useState<SyllabusModule[]>([]);

  // Build course state from syllabus modules (before content generation)
  const buildCourseFromSyllabus = useCallback((modules: SyllabusModule[], topicName: string, id: string) => {
    const courseModules: CourseModule[] = modules.map(m => ({
      topic: m.module_title,
      tag: 'needed' as const,
      subtopics: m.subtopics.map(sub => ({
        subtopic_name: sub,
        flashcard_content: [],
        audio_script: '',
        duration_minutes: 5, // Default estimate
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
      total_duration: schedule.length * 15, // Estimate
      course_id: id,
    };
  }, []);

  // 1. Generate Syllabus (POST /creator/generate-syllabus)
  const generateSyllabus = useCallback(async (topic: string, persona?: Persona) => {
    setState({ step: 'loading-syllabus' });
    setError(null);
    
    try {
      const response = await authFetch(`${API_BASE}/creator/generate-syllabus`, {
        method: 'POST',
        body: JSON.stringify({ 
          topic, 
          persona: persona || undefined 
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate syllabus');
      }

      const data = await response.json();
      // Response: { course_id, topic, syllabus: [{ module_title, subtopics }], message }
      
      setCourseId(data.course_id);
      setSyllabusModules(data.syllabus);
      setEditedModules(data.syllabus);
      
      const coursePlan = buildCourseFromSyllabus(data.syllabus, data.topic, data.course_id);
      setPlan(coursePlan);
      
      setState({ step: 'overview' });
    } catch (err) {
      console.error("Generation Error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
      throw err;
    }
  }, [buildCourseFromSyllabus]);

  // 2. Update Course (PUT /creator/course/{course_id})
  const saveCourseEdits = useCallback(async () => {
    if (!courseId || !plan) return;

    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          modules: editedModules.map(m => ({
            module_title: m.module_title,
            subtopics: m.subtopics,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save changes');
      }

      const data = await response.json();
      setSyllabusModules(data.syllabus || editedModules);
      
      const updatedPlan = buildCourseFromSyllabus(editedModules, plan.topic, courseId);
      setPlan(updatedPlan);
      setIsEditMode(false);
      
      return true;
    } catch (err) {
      console.error("Save Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      return false;
    }
  }, [courseId, editedModules, plan, buildCourseFromSyllabus]);

  // 3. Generate Module Content (POST /creator/course/{course_id}/generate-module-content)
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
      
      // Convert response to flashcards
      const flashcards: Flashcard[] = data.results.map(sub => ({
        title: sub.subtopic_title,
        content: sub.flashcard_points.join('\n\n'),
        audioScript: sub.audio_script,
        flashcard_emoji: sub.flashcard_emoji,
      }));

      // Update day contents
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
      console.error("Content Generation Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to generate content');
      setState({ step: 'overview' });
    }
  }, [courseId, plan]);

  // 4. Update Content (PUT /creator/course/{course_id}/update-content)
  const updateFlashcardContent = useCallback(async (
    moduleTitle: string,
    subtopicTitle: string,
    flashcardPoints: string[],
    audioScript: string,
    flashcardEmoji?: string
  ) => {
    if (!courseId) return false;

    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}/update-content`, {
        method: 'PUT',
        body: JSON.stringify({
          module_title: moduleTitle,
          subtopic_title: subtopicTitle,
          flashcard_points: flashcardPoints,
          flashcard_emoji: flashcardEmoji || '',
          audio_script: audioScript,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update content');
      }

      return true;
    } catch (err) {
      console.error("Update Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to update content');
      return false;
    }
  }, [courseId]);

  // Edit mode functions
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

  const updateSubtopicTitle = useCallback((moduleTitle: string, oldSubtopic: string, newSubtopic: string) => {
    setEditedModules(prev => prev.map(m => 
      m.module_title === moduleTitle 
        ? { ...m, subtopics: m.subtopics.map(s => s === oldSubtopic ? newSubtopic : s) }
        : m
    ));
  }, []);

  // Toggle Module (for removing/adding modules)
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

  // Quiz Logic
  const prefetchQuiz = useCallback(async (dayNumber: number) => {
    if (quizCache[dayNumber]) return;
    try {
      const response = await authFetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        body: JSON.stringify({ day_number: dayNumber }),
      });
      if (response.ok) {
        const data = await response.json();
        setQuizCache(prev => ({ ...prev, [dayNumber]: data.questions }));
      }
    } catch (err) {
      console.warn("Background quiz generation failed", err);
    }
  }, [quizCache]);

  const generateQuiz = useCallback(async (dayNumber: number) => {
    setState({ step: 'loading-quiz', currentDay: dayNumber });
    try {
      const response = await authFetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        body: JSON.stringify({ day_number: dayNumber }),
      });
      if (!response.ok) throw new Error('Failed to generate quiz');
      const data = await response.json();
      setState({ 
        step: 'quiz', 
        currentDay: dayNumber, 
        questions: data.questions 
      });
    } catch (err) {
      setCompletedDays(prev => prev.includes(dayNumber) ? prev : [...prev, dayNumber]);
      setState({ step: 'day-complete', currentDay: dayNumber });
    }
  }, []);

  // Navigation
  const goToDay = useCallback((dayNumber: number, cardIndex: number = 0) => {
    if (dayContents[dayNumber]) {
      const moduleTitle = plan?.schedule.find(s => s.day === dayNumber)?.focus_topic;
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: cardIndex, moduleTitle });
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents, plan]);

  const startDay = useCallback(async (dayNumber: number) => {
    prefetchQuiz(dayNumber);
    
    const moduleTitle = plan?.schedule.find(s => s.day === dayNumber)?.focus_topic;
    
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0, moduleTitle });
      return;
    }
    
    // Generate content for this module
    if (moduleTitle) {
      await generateModuleContent(moduleTitle, dayNumber);
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents, plan, prefetchQuiz, generateModuleContent]);

  const nextCard = useCallback(() => {
    if (state.step !== 'flashcards') return;
    const content = dayContents[state.currentDay];
    if (!content) return;
    
    if (state.currentCard < content.flashcards.length - 1) {
      setState({ ...state, currentCard: state.currentCard + 1 });
    } else {
      const cachedQuiz = quizCache[state.currentDay];
      if (cachedQuiz) {
        setState({ step: 'quiz', currentDay: state.currentDay, questions: cachedQuiz });
      } else {
        generateQuiz(state.currentDay);
      }
    }
  }, [state, dayContents, quizCache, generateQuiz]);

  const finishQuiz = useCallback(() => {
    if (state.step === 'quiz') {
      const dayNum = state.currentDay;
      setCompletedDays(prev => prev.includes(dayNum) ? prev : [...prev, dayNum]);
      setState({ step: 'day-complete', currentDay: dayNum });
    }
  }, [state]);

  const previousCard = useCallback(() => {
    if (state.step === 'flashcards' && state.currentCard > 0) {
      setState({ ...state, currentCard: state.currentCard - 1 });
    }
  }, [state]);

  const proceedToNextDay = useCallback(() => {
    if (state.step === 'day-complete' && plan) {
      if (state.currentDay < plan.total_days) {
        setState({ step: 'day-cover', currentDay: state.currentDay + 1 });
      } else {
        setState({ step: 'course-complete' });
      }
    }
  }, [state, plan]);

  const goToOverview = useCallback(() => setState({ step: 'overview' }), []);
  
  const restartCourse = useCallback(() => {
    setState({ step: 'search' });
    setPlan(null);
    setSyllabusModules([]);
    setCourseId(null);
    setDayContents({});
    setCompletedDays([]);
    setQuizCache({});
    setError(null);
    setIsEditMode(false);
    setEditedModules([]);
  }, []);

  return {
    state,
    plan,
    courseId,
    syllabusModules,
    dayContents,
    completedDays,
    error,
    isEditMode,
    editedModules,
    // Actions
    generateSyllabus,
    saveCourseEdits,
    generateModuleContent,
    updateFlashcardContent,
    toggleModule,
    startEditMode,
    cancelEditMode,
    updateModuleTitle,
    updateSubtopicTitle,
    goToDay,
    goToOverview,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
    finishQuiz,
  };
}
