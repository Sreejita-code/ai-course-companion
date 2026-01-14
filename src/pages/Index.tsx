import { useCourse } from '@/hooks/useCourse';
import { SearchView } from '@/components/SearchView';
import { LoadingView } from '@/components/LoadingView';
import { DayCoverView } from '@/components/DayCoverView';
import { FlashcardView } from '@/components/FlashcardView';
import { DayCompleteView } from '@/components/DayCompleteView';
import { CourseCompleteView } from '@/components/CourseCompleteView';
import { TopNavigation } from '@/components/TopNavigation';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const {
    state,
    plan,
    dayContents,
    completedDays,
    error,
    generatePlan,
    goToDay,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
  } = useCourse();

  const showNavigation = plan && state.step !== 'search' && state.step !== 'loading-plan' && state.step !== 'course-complete';

  const renderContent = () => {
    switch (state.step) {
      case 'search':
        return <SearchView onSubmit={generatePlan} />;

      case 'loading-plan':
        return <LoadingView message="Building your syllabus..." />;

      case 'day-cover':
        if (!plan) return null;
        const dayInfo = plan.schedule.find((d) => d.day === state.currentDay);
        if (!dayInfo) return null;
        return (
          <DayCoverView
            dayNumber={state.currentDay}
            totalDays={plan.total_days}
            dayInfo={dayInfo}
            onStart={() => startDay(state.currentDay)}
          />
        );

      case 'loading-content':
        return <LoadingView message={`Preparing Day ${state.currentDay}...`} />;

      case 'flashcards':
        const content = dayContents[state.currentDay];
        if (!content) return null;
        return (
          <FlashcardView
            flashcards={content.flashcards}
            currentIndex={state.currentCard}
            dayNumber={state.currentDay}
            onNext={nextCard}
            onPrevious={previousCard}
          />
        );

      case 'day-complete':
        if (!plan) return null;
        return (
          <DayCompleteView
            dayNumber={state.currentDay}
            totalDays={plan.total_days}
            onProceed={proceedToNextDay}
          />
        );

      case 'course-complete':
        if (!plan) return null;
        return (
          <CourseCompleteView
            topic={plan.topic}
            totalDays={plan.total_days}
            onRestart={restartCourse}
          />
        );

      default:
        return <SearchView onSubmit={generatePlan} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Background Pattern */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Top Navigation */}
      {showNavigation && plan && (
        <TopNavigation
          schedule={plan.schedule}
          currentDay={state.step === 'flashcards' || state.step === 'day-cover' || state.step === 'loading-content' || state.step === 'day-complete' 
            ? state.currentDay 
            : 1}
          completedDays={completedDays}
          onDayClick={goToDay}
          onBack={restartCourse}
        />
      )}

      {/* Error Toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-6 py-3 bg-destructive text-destructive-foreground rounded-lg shadow-lg"
          >
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={state.step + (state.step === 'flashcards' || state.step === 'day-cover' ? `-${state.currentDay}` : '')}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="flex-1 flex flex-col"
        >
          {renderContent()}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default Index;
