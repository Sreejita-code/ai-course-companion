import { useState, useCallback } from 'react';
import { CoursePlan, DayContent, AppState } from '@/types/course';

const API_BASE = 'http://127.0.0.1:8000';

// Demo data for testing without backend
const DEMO_PLAN: CoursePlan = {
  topic: 'Introduction to AI',
  total_days: 3,
  schedule: [
    {
      day: 1,
      focus_topic: 'What is Artificial Intelligence?',
      summary: 'Explore the fundamentals of AI, its history, and how it differs from traditional programming.',
    },
    {
      day: 2,
      focus_topic: 'Machine Learning Basics',
      summary: 'Understand supervised and unsupervised learning, and how machines learn from data.',
    },
    {
      day: 3,
      focus_topic: 'Neural Networks & Deep Learning',
      summary: 'Dive into how neural networks work and their applications in modern AI systems.',
    },
  ],
};

const DEMO_CONTENT: Record<number, DayContent> = {
  1: {
    flashcards: [
      {
        title: 'What is AI?',
        content: 'AI is the simulation of human intelligence by machines, enabling them to learn, reason, and solve problems.',
      },
      {
        title: 'Brief History of AI',
        content: 'AI was founded as a field in 1956 at Dartmouth. Key milestones include Deep Blue (1997) and AlphaGo (2016).',
      },
      {
        title: 'AI vs Traditional Programming',
        content: 'Traditional programming uses explicit rules. AI learns patterns from data to make decisions.',
      },
      {
        title: 'Types of AI',
        content: 'Narrow AI (specific tasks) vs General AI (human-like reasoning). We currently only have Narrow AI.',
      },
    ],
  },
  2: {
    flashcards: [
      {
        title: 'What is Machine Learning?',
        content: 'ML is a subset of AI where systems learn and improve from experience without being explicitly programmed.',
      },
      {
        title: 'Supervised Learning',
        content: 'Learning from labeled data. The model learns to map inputs to known outputs (like classifying emails as spam).',
      },
      {
        title: 'Unsupervised Learning',
        content: 'Finding patterns in unlabeled data. Used for clustering, like grouping customers by behavior.',
      },
      {
        title: 'Training & Testing',
        content: 'Data is split into training (to learn) and testing (to evaluate) sets to avoid overfitting.',
      },
    ],
  },
  3: {
    flashcards: [
      {
        title: 'What is a Neural Network?',
        content: 'Inspired by the brain, neural networks are layers of interconnected nodes that process information.',
      },
      {
        title: 'Layers in Neural Networks',
        content: 'Input layer (receives data), hidden layers (process data), and output layer (produces results).',
      },
      {
        title: 'Deep Learning',
        content: 'Neural networks with many hidden layers. Powers image recognition, language models, and more.',
      },
      {
        title: 'Applications',
        content: 'Self-driving cars, voice assistants, medical diagnosis, creative AI like image generation.',
      },
    ],
  },
};

export function useCourse() {
  const [state, setState] = useState<AppState>({ step: 'search' });
  const [plan, setPlan] = useState<CoursePlan | null>(null);
  const [dayContents, setDayContents] = useState<Record<number, DayContent>>({});
  const [error, setError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);

  const generatePlan = useCallback(async (prompt: string) => {
    setState({ step: 'loading-plan' });
    setError(null);

    // Demo mode
    if (prompt === '__DEMO__') {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      setPlan(DEMO_PLAN);
      setDayContents({});
      setIsDemoMode(true);
      setState({ step: 'day-cover', currentDay: 1 });
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/generate-plan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) throw new Error('Failed to generate plan');

      const data: CoursePlan = await response.json();
      setPlan(data);
      setIsDemoMode(false);
      setState({ step: 'day-cover', currentDay: 1 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      setState({ step: 'search' });
    }
  }, []);

  const startDay = useCallback(
    async (dayNumber: number) => {
      setState({ step: 'loading-content', currentDay: dayNumber });
      setError(null);

      // Check if we already have content for this day
      if (dayContents[dayNumber]) {
        setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
        return;
      }

      // Demo mode
      if (isDemoMode) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const content = DEMO_CONTENT[dayNumber];
        if (content) {
          setDayContents((prev) => ({ ...prev, [dayNumber]: content }));
          setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
        } else {
          setError('Demo content not available for this day');
          setState({ step: 'day-cover', currentDay: dayNumber });
        }
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
        setDayContents((prev) => ({ ...prev, [dayNumber]: data }));
        setState({ step: 'flashcards', currentDay: dayNumber, currentCard: 0 });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        setState({ step: 'day-cover', currentDay: dayNumber });
      }
    },
    [dayContents, isDemoMode]
  );

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
    setIsDemoMode(false);
  }, []);

  const setFlashcardsState = useCallback((day: number, card: number) => {
    setState({ step: 'flashcards', currentDay: day, currentCard: card });
  }, []);

  const setDayCompleteState = useCallback((day: number) => {
    setState({ step: 'day-complete', currentDay: day });
  }, []);

  return {
    state,
    plan,
    dayContents,
    error,
    isDemoMode,
    generatePlan,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
    setFlashcardsState,
    setDayCompleteState,
  };
}
