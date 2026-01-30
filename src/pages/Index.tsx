import { useCourse } from '@/hooks/useCourse';
import { SearchView } from '@/components/SearchView';
import { LoadingView } from '@/components/LoadingView';
import { DayCoverView } from '@/components/DayCoverView';
import { FlashcardView } from '@/components/FlashcardView';
import { QuizView } from '@/components/QuizView'; 
import { DayCompleteView } from '@/components/DayCompleteView';
import { CourseCompleteView } from '@/components/CourseCompleteView';
import { TopNavigation } from '@/components/TopNavigation';
import { SyllabusView } from '@/components/SyllabusView';
import { OverviewView } from '@/components/OverviewView';
import { motion, AnimatePresence } from 'framer-motion';

const Index = () => {
  const {
    state,
    plan,
    syllabus,
    dayContents,
    completedDays,
    error,
    generateFullCourse, 
    generateCustomPlan, 
    toggleModule,       
    goToDay,
    goToOverview,
    startDay, 
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
    finishQuiz,
  } = useCourse();

  const showNavigation = plan && 
    state.step !== 'search' && 
    state.step !== 'loading-syllabus' && 
    state.step !== 'syllabus' && 
    state.step !== 'loading-plan' && 
    state.step !== 'course-complete';

  const renderContent = () => {
    switch (state.step) {
      case 'search':
        // Direct call to unified generation
        return <SearchView onSubmit={generateFullCourse} />;

      case 'loading-syllabus':
        return <LoadingView message="Designing your curriculum..." />;

      case 'syllabus':
        if (!syllabus) return null;
        return (
          <SyllabusView 
            topic={syllabus.topic}
            expertise={syllabus.expertise}
            syllabus={syllabus.syllabus}
            onContinue={generateCustomPlan} 
            onBack={restartCourse}
          />
        );

      case 'overview' :
        if (!plan) return null;
        return (
          <OverviewView
            topic={plan.topic}
            modules={plan.modules}
            totalDuration={plan.total_duration} // Pass duration for progress bar
            onDayClick={goToDay}
            onToggleModule={toggleModule}       // Pass toggle function
          />
        );

      case 'loading-plan':
        return <LoadingView message="Building your personalized course..." />;

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
        return <LoadingView message={`Preparing Topic ${state.currentDay}...`} />;

      case 'flashcards':
        const content = dayContents[state.currentDay];
        if (!content) return null;
        
        const currentScheduleItem = plan?.schedule.find(d => d.day === state.currentDay);
        const currentTopicName = currentScheduleItem?.focus_topic || "Current Topic";

        return (
          <FlashcardView
            flashcards={content.flashcards}
            currentIndex={state.currentCard}
            dayNumber={state.currentDay}
            topic={currentTopicName}
            onNext={nextCard}
            onPrevious={previousCard}
          />
        );

      case 'loading-quiz':
        return <LoadingView message="Generating your knowledge check..." />;

      case 'quiz':
        if (state.step !== 'quiz' || !state.questions) return null;
        return (
          <QuizView 
            questions={state.questions} 
            onComplete={finishQuiz} 
            onSkip={finishQuiz} 
            onRestart={() => startDay(state.currentDay)} 
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
        return <SearchView onSubmit={generateFullCourse} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {showNavigation && plan && (
        <TopNavigation
          schedule={plan.schedule}
          currentDay={
            state.step === 'flashcards' || 
            state.step === 'day-cover' || 
            state.step === 'loading-content' || 
            state.step === 'day-complete' ||
            state.step === 'quiz' ||
            state.step === 'loading-quiz'
            ? state.currentDay
            : -1
          }
          completedDays={completedDays}
          onDayClick={goToDay}
          onBack={state.step === 'overview' ? restartCourse : goToOverview}
          showOverview={state.step !== 'overview'}
          onOverviewClick={goToOverview}
        />
      )}

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

      <AnimatePresence mode="wait">
        <motion.div
          key={state.step + (
            state.step === 'flashcards' || 
            state.step === 'day-cover' || 
            state.step === 'quiz' 
            ? `-${state.currentDay}` 
            : ''
          )}
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