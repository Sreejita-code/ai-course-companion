import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState } from '@/types/course';

const API_BASE = 'http://127.0.0.1:8000';

// Mock syllabus data for when API is not available
const MOCK_SYLLABUS = {
  topic: "Java",
  expertise: "Beginner",
  syllabus: [
    "Introduction to Java Programming",
    "Setting Up the Development Environment",
    "Basic Syntax and Structure of Java",
    "Data Types and Variables",
    "Control Flow Statements"
  ]
};

export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [completedDays, setCompletedDays] = useState<number[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generatePlan = useCallback(async (topic: string, expertise: string) => {
    setState({ step: 'loading-plan' });
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/generate-syllabus`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topic, expertise }),
      });
      
      if (!response.ok) throw new Error('Failed to generate syllabus');
      
      const data = await response.json();
      
      // Create a course plan from the syllabus response
      const coursePlan: CoursePlan = {
        topic: data.topic || topic,
        expertise: data.expertise || expertise,
        syllabus: data.syllabus || [],
        total_days: data.syllabus?.length || 5,
        schedule: (data.syllabus || []).map((item: string, index: number) => ({
          day: index + 1,
          focus_topic: item,
          summary: `Learn about ${item}`
        }))
      };
      
      setPlan(coursePlan);
      setState({ step: 'syllabus' });
    } catch (err) {
      // Use mock data if API fails
      console.log('API failed, using mock data');
      const coursePlan: CoursePlan = {
        topic: topic || MOCK_SYLLABUS.topic,
        expertise: expertise || MOCK_SYLLABUS.expertise,
        syllabus: MOCK_SYLLABUS.syllabus,
        total_days: MOCK_SYLLABUS.syllabus.length,
        schedule: MOCK_SYLLABUS.syllabus.map((item, index) => ({
          day: index + 1,
          focus_topic: item,
          summary: `Learn about ${item}`
        }))
      };
      setPlan(coursePlan);
      setState({ step: 'syllabus' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  const goToDay = useCallback((dayNumber: number) => {
    // If content is already loaded, go to flashcards, otherwise show cover
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
    } else {
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents]);

  const startDay = useCallback(async (dayNumber: number) => {
    setState({ step: 'loading-content', currentDay: dayNumber });
    setError(null);
    
    // Check if we already have content for this day
    if (dayContents[dayNumber]) {
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/generate-day-content`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ day_number: dayNumber }),
      });
      
      if (!response.ok) throw new Error('Failed to generate day content');
      
      const data: DayContent = await response.json();
      setDayContents(prev => ({ ...prev, [dayNumber]: data }));
      setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'day-cover', currentDay: dayNumber });
    }
  }, [dayContents]);

  const nextCard = useCallback(() => {
    if (state.step !== 'flashcards') return;
    
    const content = dayContents[state.currentDay];
    if (!content) return;
    
    if (state.currentCard < content.flashcards.length - 1) {
      setState({ ...state, currentCard: state.currentCard + 1 });
    } else {
      // Mark day as completed
      setCompletedDays(prev => 
        prev.includes(state.currentDay) ? prev : [...prev, state.currentDay]
      );
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
    if (state.step !== 'day-complete' || !plan) return;
    
    if (state.currentDay < plan.total_days) {
      setState({ step: 'day-cover', currentDay: state.currentDay + 1 });
    } else {
      setState({ step: 'course-complete' });
    }
  }, [state, plan]);

  const goToOverview = useCallback(() => {
    setState({ step: 'overview' });
  }, []);

  const goToSyllabus = useCallback(() => {
    setState({ step: 'syllabus' });
  }, []);

  const restartCourse = useCallback(() => {
    setState({ step: 'search' });
    setPlan(null);
    setDayContents({});
    setCompletedDays([]);
    setError(null);
  }, []);

  return {
    state,
    plan,
    dayContents,
    completedDays,
    error,
    isLoading,
    generatePlan,
    goToDay,
    goToOverview,
    goToSyllabus,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
  };
}
