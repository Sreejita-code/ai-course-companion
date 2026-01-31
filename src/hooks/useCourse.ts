import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState, Flashcard, CourseModule, QuizQuestion, SyllabusModule, Persona, ModuleContentResponse } from '@/types/course';
import { authFetch } from '@/lib/auth';

const API_BASE = 'http://127.0.0.1:8000';

export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [syllabusModules, setSyllabusModules] = useState<SyllabusModule[]>([]);
  const [courseId, setCourseId] = useState<string | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPublished, setIsPublished] = useState(false); // <--- ADDED STATE

  // Quiz Cache
  const [quizCache, setQuizCache] = useState<Record<number, QuizQuestion[]>>({});

  // Edit mode state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedModules, setEditedModules] = useState<SyllabusModule[]>([]);

  // Parse backend response format with dynamic keys (title_1, title_2, etc.)
  const parseSyllabusResponse = useCallback((rawSyllabus: any[]): SyllabusModule[] => {
    return rawSyllabus.map(module => {
      // Find the title key (title_1, title_2, etc.)
      const titleKey = Object.keys(module).find(k => k.startsWith('title_'));
      const moduleTitle = titleKey ? module[titleKey] : 'Untitled Module';

      // Parse subtopics
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
      // Response: { course_id, topic, syllabus: [{ title_1, subtopics: [{ title_1, description }] }], message }

      // Parse the dynamic key format from backend
      const parsedSyllabus = parseSyllabusResponse(data.syllabus);

      setCourseId(data.course_id);
      setIsPublished(false); // <--- RESET PUBLISH STATUS
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);

      const coursePlan = buildCourseFromSyllabus(parsedSyllabus, data.topic, data.course_id);
      setPlan(coursePlan);

      setState({ step: 'overview' });
    } catch (err) {
      console.error("Generation Error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
      throw err;
    }
  }, [buildCourseFromSyllabus, parseSyllabusResponse]);

  // 2. Update Course (PUT /creator/course/{course_id})
  const saveCourseEdits = useCallback(async () => {
    if (!courseId || !plan) return;

    try {
      // Convert to backend's expected format with dynamic keys
      const formattedModules = editedModules.map((m, index) => {
        const moduleKey = `title_${index + 1}`;
        const formattedSubtopics = m.subtopics.map((sub, subIndex) => ({
          [`title_${subIndex + 1}`]: sub,
          description: sub // Backend expects description field
        }));

        return {
          [moduleKey]: m.module_title,
          subtopics: formattedSubtopics
        };
      });

      const response = await authFetch(`${API_BASE}/creator/course/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({
          modules: formattedModules,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to save changes');
      }

      const data = await response.json();

      // Parse response if it contains dynamic keys
      const parsedSyllabus = data.syllabus ? parseSyllabusResponse(data.syllabus) : editedModules;

      // Update both syllabusModules and editedModules to stay in sync
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);

      // Rebuild the plan with the updated modules
      const updatedPlan = buildCourseFromSyllabus(parsedSyllabus, data.topic || plan.topic, courseId);
      setPlan(updatedPlan);

      // Exit edit mode
      setIsEditMode(false);

      return true;
    } catch (err) {
      console.error("Save Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to save changes');
      return false;
    }
  }, [courseId, editedModules, plan, buildCourseFromSyllabus, parseSyllabusResponse]);

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
        flashcard_emoji: sub.flashcard_emoji || '💡',
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
    if (!courseId || state.step !== 'flashcards') return false;

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
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to update content');
      }

      // Update was successful, now update local state
      const currentDay = state.step === 'flashcards' ? state.currentDay : -1;

      if (currentDay > 0 && dayContents[currentDay]) {
        // Update dayContents to reflect the changes immediately
        setDayContents(prev => {
          const updatedContent = { ...prev };
          const dayFlashcards = updatedContent[currentDay]?.flashcards || [];

          const updatedFlashcards = dayFlashcards.map(card => {
            if (card.title === subtopicTitle) {
              return {
                ...card,
                content: flashcardPoints.join('\n\n'),
                audioScript: audioScript,
                flashcard_emoji: flashcardEmoji || card.flashcard_emoji
              };
            }
            return card;
          });

          updatedContent[currentDay] = {
            flashcards: updatedFlashcards
          };

          return updatedContent;
        });
      }

      // Also update the plan modules to keep data in sync
      if (plan?.modules) {
        const updatedModules = plan.modules.map(mod => {
          if (mod.topic === moduleTitle) {
            return {
              ...mod,
              subtopics: mod.subtopics.map(sub => {
                if (sub.subtopic_name === subtopicTitle) {
                  return {
                    ...sub,
                    flashcard_content: flashcardPoints,
                    flashcard_emoji: flashcardEmoji || sub.flashcard_emoji,
                    audio_script: audioScript,
                    // Recalculate duration based on audio script length
                    duration_minutes: Math.round(audioScript.split(' ').length / 150 * 100) / 100
                  };
                }
                return sub;
              })
            };
          }
          return mod;
        });

        setPlan(prev => prev ? { ...prev, modules: updatedModules } : null);
      }

      return true;
    } catch (err) {
      console.error("Update Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to update content');
      return false;
    }
  }, [courseId, state, dayContents, plan]);

  // 5. NEW: Publish Course
  const togglePublish = useCallback(async () => {
    if (!courseId) return;
    
    const newStatus = !isPublished;
    
    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: newStatus }),
      });

      if (!response.ok) {
        throw new Error('Failed to update publish status');
      }

      setIsPublished(newStatus);
      
      // Update plan to reflect status
      setPlan(prev => prev ? { ...prev, isPublished: newStatus } : null);
      
      return true;
    } catch (err) {
      console.error("Publish Error:", err);
      setError(err instanceof Error ? err.message : 'Failed to publish course');
      return false;
    }
  }, [courseId, isPublished]);

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
      if (direction === 'up') {
        if (index === 0) return m; // Can't move up
        [newSubtopics[index - 1], newSubtopics[index]] = [newSubtopics[index], newSubtopics[index - 1]];
      } else {
        if (index === newSubtopics.length - 1) return m; // Can't move down
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
    setIsPublished(false); // <--- Reset
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
    isPublished, // <--- EXPORT STATE
    // Actions
    generateSyllabus,
    saveCourseEdits,
    generateModuleContent,
    updateFlashcardContent,
    togglePublish, // <--- EXPORT FUNCTION
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
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
    finishQuiz,
  };
}