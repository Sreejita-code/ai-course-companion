import { useState, useCallback } from 'react';
import { 
  CoursePlan, 
  DayContent, 
  AppState, 
  Flashcard, 
  CourseModule, 
  QuizQuestion, 
  SyllabusModule, 
  Persona, 
  ModuleContentResponse,
  ExistingCourseSummary,
  AssessmentQuestion,
  UserAnswer,
  ModuleSchema
} from '@/types/course';
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
  const [isPublished, setIsPublished] = useState(false);
  const [quizCache, setQuizCache] = useState<Record<number, QuizQuestion[]>>({});
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedModules, setEditedModules] = useState<SyllabusModule[]>([]);

  // Helpers
  const parseSyllabusResponse = useCallback((rawSyllabus: any[]): SyllabusModule[] => {
    return rawSyllabus.map(module => {
      const titleKey = Object.keys(module).find(k => k.startsWith('title_'));
      const moduleTitle = titleKey ? module[titleKey] : 'Untitled Module';
      const subtopics = (module.subtopics || []).map((sub: any) => {
        const subTitleKey = Object.keys(sub).find(k => k.startsWith('title_'));
        return subTitleKey ? sub[subTitleKey] : 'Untitled Subtopic';
      });
      return { module_title: moduleTitle, subtopics: subtopics };
    });
  }, []);

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

  // --- Actions ---

  const searchTopic = useCallback(async (topic: string) => {
    setState({ step: 'loading-syllabus' });
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/learner/search?topic=${encodeURIComponent(topic)}`);
      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setState({ 
        step: 'learner-search-results', 
        topic: topic, 
        courses: data.existing_courses || [] 
      });
    } catch (err) {
      setError("Failed to search topics");
      setState({ step: 'search' });
    }
  }, []);

  // NEW: View Course by fetching full details via Search API
  const viewCourse = useCallback(async (selectedCourseId: string) => {
    setState({ step: 'loading-plan' });
    setError(null);

    try {
      // Fetch specific course details using the updated Search API
      const response = await authFetch(`${API_BASE}/learner/search?course_id=${selectedCourseId}`);
      if (!response.ok) throw new Error("Failed to fetch course details");

      const data = await response.json();
      
      if (!data.existing_courses || data.existing_courses.length === 0) {
         throw new Error("Course not found");
      }

      const targetCourse: ExistingCourseSummary = data.existing_courses[0];

      // 1. Build Syllabus Structure
      const syllabus: SyllabusModule[] = targetCourse.syllabus.map(mod => ({
        module_title: mod.title,
        subtopics: mod.subtopics.map(sub => sub.title)
      }));

      // 2. Pre-populate Flashcard Content from the response
      const preloadedContents: Record<number, DayContent> = {};
      
      targetCourse.syllabus.forEach((mod, index) => {
        const dayNum = index + 1;
        const flashcards = mod.subtopics.flatMap(sub => {
           if (sub.flashcards && sub.flashcards.length > 0) {
             return sub.flashcards.map(fc => ({
               title: fc.title,
               content: fc.content.join('\n\n'),
               flashcard_emoji: fc.emoji,
               audioScript: sub.audio_script || '' 
             }));
           }
           // Fallback if subtopic exists but no content yet
           return [{
             title: sub.title,
             content: "No content available for this topic yet.",
             flashcard_emoji: "💡",
             audioScript: sub.audio_script || ''
           }];
        });
        
        preloadedContents[dayNum] = { flashcards };
      });

      // 3. Update State
      setDayContents(preloadedContents);
      setSyllabusModules(syllabus);
      setCourseId(targetCourse.id);
      setIsPublished(true);
      
      const coursePlan = buildCourseFromSyllabus(syllabus, targetCourse.title, targetCourse.id);
      setPlan(coursePlan);
      
      setState({ step: 'overview' });
    } catch (err) {
      console.error(err);
      setError("Failed to load course. It might not be published.");
      setState({ step: 'search' });
    }
  }, [buildCourseFromSyllabus]);

  // NEW: Fetch Content (Retrieves from pre-loaded state)
  const fetchLearnerModuleContent = useCallback(async (moduleTitle: string, dayNumber: number) => {
    // Since viewCourse pre-loads all content, we just check local state
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0, moduleTitle });
    } else {
      setError("Content not available for this module.");
    }
  }, [dayContents]);

  // ... [Other Creator functions remain unchanged] ...
  const generateSyllabus = useCallback(async (topic: string, persona?: Persona) => {
    setState({ step: 'loading-syllabus' });
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/creator/generate-syllabus`, {
        method: 'POST',
        body: JSON.stringify({ topic, persona: persona || undefined }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || 'Failed to generate syllabus');
      }
      const data = await response.json();
      const parsedSyllabus = parseSyllabusResponse(data.syllabus);
      setCourseId(data.course_id);
      setIsPublished(false);
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);
      setPlan(buildCourseFromSyllabus(parsedSyllabus, data.topic, data.course_id));
      setState({ step: 'overview' });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
    }
  }, [buildCourseFromSyllabus, parseSyllabusResponse]);

  const saveCourseEdits = useCallback(async () => {
    if (!courseId || !plan) return;
    try {
      const formattedModules = editedModules.map((m, index) => {
        const moduleKey = `title_${index + 1}`;
        const formattedSubtopics = m.subtopics.map((sub, subIndex) => ({
          [`title_${subIndex + 1}`]: sub,
          description: sub 
        }));
        return { [moduleKey]: m.module_title, subtopics: formattedSubtopics };
      });
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}`, {
        method: 'PUT',
        body: JSON.stringify({ modules: formattedModules }),
      });
      if (!response.ok) throw new Error('Failed to save changes');
      const data = await response.json();
      const parsedSyllabus = data.syllabus ? parseSyllabusResponse(data.syllabus) : editedModules;
      setSyllabusModules(parsedSyllabus);
      setEditedModules(parsedSyllabus);
      setPlan(buildCourseFromSyllabus(parsedSyllabus, data.topic || plan.topic, courseId));
      setIsEditMode(false);
      return true;
    } catch (err) {
      setError('Failed to save changes');
      return false;
    }
  }, [courseId, editedModules, plan, buildCourseFromSyllabus, parseSyllabusResponse]);

  const generateModuleContent = useCallback(async (moduleTitle: string, dayNumber: number) => {
    if (!courseId) return;
    setState({ step: 'loading-content', currentDay: dayNumber });
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}/generate-module-content`, {
        method: 'POST',
        body: JSON.stringify({ topic: moduleTitle }),
      });
      if (!response.ok) throw new Error('Failed to generate content');
      const data: ModuleContentResponse = await response.json();
      const flashcards: Flashcard[] = data.results.map(sub => ({
        title: sub.subtopic_title,
        content: sub.flashcard_points.join('\n\n'),
        audioScript: sub.audio_script,
        flashcard_emoji: sub.flashcard_emoji || '💡',
      }));
      setDayContents(prev => ({ ...prev, [dayNumber]: { flashcards } }));
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
      setError('Failed to generate content');
      setState({ step: 'overview' });
    }
  }, [courseId, plan]);

  const updateFlashcardContent = useCallback(async (moduleTitle: string, subtopicTitle: string, flashcardPoints: string[], audioScript: string, flashcardEmoji?: string) => {
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
      if (!response.ok) throw new Error('Failed to update content');
      const currentDay = state.step === 'flashcards' ? state.currentDay : -1;
      if (currentDay > 0 && dayContents[currentDay]) {
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
          updatedContent[currentDay] = { flashcards: updatedFlashcards };
          return updatedContent;
        });
      }
      return true;
    } catch (err) {
      setError('Failed to update content');
      return false;
    }
  }, [courseId, state, dayContents]);

  const togglePublish = useCallback(async () => {
    if (!courseId) return;
    const newStatus = !isPublished;
    try {
      const response = await authFetch(`${API_BASE}/creator/course/${courseId}/publish`, {
        method: 'PUT',
        body: JSON.stringify({ is_published: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update publish status');
      setIsPublished(newStatus);
      setPlan(prev => prev ? { ...prev, isPublished: newStatus } : null);
      return true;
    } catch (err) {
      setError('Failed to publish course');
      return false;
    }
  }, [courseId, isPublished]);

  // --- UI Helpers ---
  const startEditMode = useCallback(() => { setEditedModules([...syllabusModules]); setIsEditMode(true); }, [syllabusModules]);
  const cancelEditMode = useCallback(() => { setEditedModules([...syllabusModules]); setIsEditMode(false); }, [syllabusModules]);
  const updateModuleTitle = useCallback((oldTitle: string, newTitle: string) => { setEditedModules(prev => prev.map(m => m.module_title === oldTitle ? { ...m, module_title: newTitle } : m)); }, []);
  const updateSubtopicTitle = useCallback((moduleTitle: string, subtopicIndex: number, newSubtopic: string) => { setEditedModules(prev => prev.map(m => m.module_title === moduleTitle ? { ...m, subtopics: m.subtopics.map((s, i) => i === subtopicIndex ? newSubtopic : s) } : m)); }, []);
  const deleteSubtopic = useCallback((moduleTitle: string, subtopicIndex: number) => { setEditedModules(prev => prev.map(m => m.module_title === moduleTitle ? { ...m, subtopics: m.subtopics.filter((_, i) => i !== subtopicIndex) } : m)); }, []);
  const addSubtopic = useCallback((moduleTitle: string) => { setEditedModules(prev => prev.map(m => m.module_title === moduleTitle ? { ...m, subtopics: [...m.subtopics, 'New Subtopic'] } : m)); }, []);
  const reorderSubtopic = useCallback((moduleTitle: string, index: number, direction: 'up' | 'down') => {
    setEditedModules(prev => prev.map(m => {
      if (m.module_title !== moduleTitle) return m;
      const newSubtopics = [...m.subtopics];
      if (direction === 'up') {
        if (index === 0) return m;
        [newSubtopics[index - 1], newSubtopics[index]] = [newSubtopics[index], newSubtopics[index - 1]];
      } else {
        if (index === newSubtopics.length - 1) return m;
        [newSubtopics[index], newSubtopics[index + 1]] = [newSubtopics[index + 1], newSubtopics[index]];
      }
      return { ...m, subtopics: newSubtopics };
    }));
  }, []);
  const deleteModule = useCallback((moduleTitle: string) => { setEditedModules(prev => prev.filter(m => m.module_title !== moduleTitle)); }, []);
  const addModule = useCallback(() => { setEditedModules(prev => [...prev, { module_title: 'New Module', subtopics: [] }]); }, []);
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
    setPlan(prev => prev ? { ...prev, modules: updatedModules, schedule, total_days: schedule.length } : null);
  }, [plan]);

  // --- Shared Navigation & Quiz ---
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
      setState({ step: 'quiz', currentDay: dayNumber, questions: data.questions });
    } catch (err) {
      setCompletedDays(prev => prev.includes(dayNumber) ? prev : [...prev, dayNumber]);
      setState({ step: 'day-complete', currentDay: dayNumber });
    }
  }, []);

  const goToDay = useCallback((dayNumber: number, cardIndex: number = 0) => {
    if (dayContents[dayNumber]) {
      const moduleTitle = plan?.schedule.find(s => s.day === dayNumber)?.focus_topic;
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: cardIndex, moduleTitle });
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents, plan]);

  const startAssessment = useCallback(async (topic: string) => {
    setState({ step: 'loading-syllabus' });
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/learner/generate-assessment`, {
        method: 'POST',
        body: JSON.stringify({ topic })
      });
      if (!response.ok) throw new Error("Failed to generate assessment");
      const data = await response.json();
      setState({ step: 'learner-assessment', topic: topic, questions: data.questions });
    } catch (err) {
      setError("Could not generate assessment");
      setState({ step: 'search' });
    }
  }, []);

  const submitAssessment = useCallback(async (topic: string, answers: UserAnswer[]) => {
    setState({ step: 'evaluating-assessment' });
    setError(null);
    try {
      const response = await authFetch(`${API_BASE}/learner/evaluate-syllabus`, {
        method: 'POST',
        body: JSON.stringify({ topic, answers })
      });
      if (!response.ok) throw new Error("Failed to evaluate");
      const data = await response.json();
      const parsedSyllabus = parseSyllabusResponse(data.syllabus);
      setCourseId(data.course_id);
      setIsPublished(true);
      setSyllabusModules(parsedSyllabus);
      setPlan(buildCourseFromSyllabus(parsedSyllabus, data.topic, data.course_id));
      setState({ step: 'overview' });
    } catch (err) {
      setError("Failed to generate personalized plan");
      setState({ step: 'search' });
    }
  }, [buildCourseFromSyllabus, parseSyllabusResponse]);

  // --- Shared Navigation ---
  const startDay = useCallback(async (dayNumber: number, isLearner: boolean = false) => {
    const moduleTitle = plan?.schedule.find(s => s.day === dayNumber)?.focus_topic;
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0, moduleTitle });
    } else if (moduleTitle) {
      if (isLearner) {
        await fetchLearnerModuleContent(moduleTitle, dayNumber);
      } else {
        await generateModuleContent(moduleTitle, dayNumber);
      }
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents, plan, generateModuleContent, fetchLearnerModuleContent]);

  const nextCard = useCallback(() => {
    if (state.step !== 'flashcards') return;
    const content = dayContents[state.currentDay];
    if (!content) return;
    if (state.currentCard < (content?.flashcards.length || 0) - 1) {
      setState({ ...state, currentCard: state.currentCard + 1 });
    } else {
      setState({ step: 'day-complete', currentDay: state.currentDay });
    }
  }, [state, dayContents]);

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
    setCourseId(null);
    setDayContents({});
    setCompletedDays([]);
    setError(null);
  }, []);
  const finishQuiz = useCallback(() => {}, []);

  return {
    state,
    plan,
    courseId,
    dayContents,
    completedDays,
    error,
    isEditMode,
    editedModules,
    isPublished,
    
    generateSyllabus,
    saveCourseEdits,
    generateModuleContent,
    updateFlashcardContent,
    togglePublish,
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

    searchTopic,
    startAssessment,
    submitAssessment,
    viewCourse,
    fetchLearnerModuleContent,

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