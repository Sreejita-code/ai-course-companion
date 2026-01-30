import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState, Syllabus, TopicItem, DaySchedule, Flashcard, CourseModule, QuizQuestion } from '@/types/course';
 
const API_BASE = 'http://127.0.0.1:8001'; 
 
export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [syllabus, setSyllabus] = useState<Syllabus | null>(null);
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [requestExpertise, setRequestExpertise] = useState<string>('Beginner');
  
  // Quiz Cache
  const [quizCache, setQuizCache] = useState<Record<number, QuizQuestion[]>>({});
 
  // --- REBUILD LOGIC: 1 Module = 1 Day ---
  const rebuildCourseState = useCallback((modules: CourseModule[], topicName: string, expertiseLevel: string) => {
    const schedule: DaySchedule[] = [];
    const preloadedContents: Record<number, DayContent> = {};
    let dayCounter = 1;
    let totalMinutes = 0;
 
    modules.forEach(module => {
      if (module.tag === 'needed') {
          const currentDayId = dayCounter++;
          const moduleFlashcards: Flashcard[] = [];
 
          // Flatten ALL subtopics into this ONE day
          module.subtopics.forEach(sub => {
              // UPDATED: Join all content points into a SINGLE string for one card
              const contentArray = Array.isArray(sub.flashcard_content) 
                  ? sub.flashcard_content 
                  : [sub.flashcard_content];
              
              const combinedContent = contentArray.join('\n\n');
 
              moduleFlashcards.push({
                  title: sub.subtopic_name,
                  content: combinedContent,
                  reference: sub.reference,
                  audioScript: sub.audio_script
              });
              
              totalMinutes += sub.duration_minutes;
          });
 
          schedule.push({
              day: currentDayId,
              focus_topic: module.topic,
              summary: `${module.subtopics.length} Subtopics`
          });
 
          preloadedContents[currentDayId] = { 
              flashcards: moduleFlashcards
          };
      }
    });
 
    return {
        plan: {
            topic: topicName,
            total_days: schedule.length,
            schedule: schedule,
            expertise: expertiseLevel,
            modules: modules,
            total_duration: totalMinutes
        },
        dayContents: preloadedContents
    };
  }, []);
 
  // 1. Unified Generate Function
  const generateFullCourse = useCallback(async (topic: string, expertise: string) => {
    setState({ step: 'loading-syllabus' });
    setError(null);
    setRequestExpertise(expertise);
    
    try {
      // A. Syllabus
      const syllResponse = await fetch(`${API_BASE}/generate-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, expertise }),
      });
      if (!syllResponse.ok) throw new Error('Failed to generate syllabus');
      const syllData: Syllabus = await syllResponse.json();
      setSyllabus(syllData);
 
      setState({ step: 'loading-plan' });
 
      // B. Auto-confirm topics
      const selectedTopics: TopicItem[] = syllData.syllabus.map(t => ({ topic: t, tag: 'needed' }));
 
      // C. Plan
      const planResponse = await fetch(`${API_BASE}/generate-custom-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          topics: selectedTopics, 
          expertise: expertise 
        }),
      });
      if (!planResponse.ok) throw new Error('Failed to generate plan');
      const planData = await planResponse.json(); 
      const rawModules: CourseModule[] = planData.plan;
 
      // D. Build State
      const builtState = rebuildCourseState(rawModules, syllData.topic, expertise);
      
      setPlan(builtState.plan);
      setDayContents(builtState.dayContents);
      setState({ step: 'overview' });
 
    } catch (err) {
      console.error("Generation Error:", err);
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
    }
  }, [rebuildCourseState]);
 
  // 2. Toggle Module
  const toggleModule = useCallback((topicName: string) => {
    if (!plan) return;
 
    const updatedModules = plan.modules?.map(m => {
        if (m.topic === topicName) {
            return { ...m, tag: m.tag === 'needed' ? 'not needed' : 'needed' } as CourseModule;
        }
        return m;
    }) || [];
 
    const builtState = rebuildCourseState(updatedModules, plan.topic, plan.expertise || 'Beginner');
    setPlan(builtState.plan);
    setDayContents(builtState.dayContents);
  }, [plan, rebuildCourseState]);
 
  // Stub functions
  const generateSyllabus = useCallback(async (topic: string, expertise: string) => { await generateFullCourse(topic, expertise); }, [generateFullCourse]);
  const generateCustomPlan = useCallback(async (selectedTopics: TopicItem[]) => {}, []);
 
  // Quiz Logic
  const prefetchQuiz = useCallback(async (dayNumber: number) => {
    if (quizCache[dayNumber]) return;
    try {
      const response = await fetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      const response = await fetch(`${API_BASE}/generate-quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
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
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: cardIndex });
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents]);
 
  const startDay = useCallback(async (dayNumber: number) => {
    prefetchQuiz(dayNumber);
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
      return;
    }
    setState({ step: 'day-cover', currentDay: dayNumber });
  }, [dayContents, prefetchQuiz]);
 
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
    setSyllabus(null);
    setDayContents({});
    setCompletedDays([]);
    setQuizCache({});
    setError(null);
  }, []);
 
  return {
    state,
    syllabus,
    plan,
    dayContents,
    completedDays,
    error,
    generateFullCourse,
    toggleModule,
    generateSyllabus,
    generateCustomPlan,
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