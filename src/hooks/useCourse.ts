import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState } from '@/types/course';

const API_BASE = 'http://127.0.0.1:8000';

export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [error, setError] = useState<string | null>(null);

  const generatePlan = useCallback(async (prompt: string) => {
    setState({ step: 'loading-plan' });
    setError(null);
    
    try {
      const response = await fetch(`${API_BASE}/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      
      if (!response.ok) throw new Error('Failed to generate plan');
      
      const data: CoursePlan = await response.json();
      setPlan(data);
      setState({ step: 'day-cover', currentDay: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
    }
  }, []);

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

  const restartCourse = useCallback(() => {
    setState({ step: 'search' });
    setPlan(null);
    setDayContents({});
    setError(null);
  }, []);

  return {
    state,
    plan,
    dayContents,
    error,
    generatePlan,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
  };
}
