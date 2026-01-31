import { useLearnerCourse } from '@/hooks/useLearnerCourse';
import { SearchView } from '@/components/SearchView';
import { LoadingView } from '@/components/LoadingView';
import { CourseSearchResults } from '@/components/CourseSearchResults';
import { AssessmentQuizView } from '@/components/AssessmentQuizView';
import { LearnerOverviewView } from '@/components/LearnerOverviewView';
import { LearnerFlashcardView } from '@/components/LearnerFlashcardView';
import { DayCompleteView } from '@/components/DayCompleteView';
import { CourseCompleteView } from '@/components/CourseCompleteView';
import { TopNavigation } from '@/components/TopNavigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { AssessmentAnswer } from '@/types/learner';

const LearnerIndex = () => {
  const { logout, user } = useAuth();

  const {
    state,
    plan,
    courseId,
    dayContents,
    completedDays,
    error,
    isEditMode,
    editedModules,
    searchCourses,
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
  } = useLearnerCourse();

  const handleSearch = async (topic: string) => {
    await searchCourses(topic);
  };

  const handleStartModule = async (dayNumber: number, moduleTitle: string) => {
    await generateModuleContent(moduleTitle, dayNumber);
  };

  const handleAssessmentComplete = async (answers: AssessmentAnswer[]) => {
    if (state.step === 'assessment-quiz') {
      await evaluateAndGenerateSyllabus(state.topic, answers);
    }
  };

  const showNavigation = plan && 
    state.step !== 'search' && 
    state.step !== 'searching-courses' &&
    state.step !== 'course-results' &&
    state.step !== 'loading-assessment' &&
    state.step !== 'assessment-quiz' &&
    state.step !== 'evaluating' &&
    state.step !== 'course-complete';

  const renderContent = () => {
    switch (state.step) {
      case 'search':
        return (
          <SearchView 
            onSubmit={handleSearch} 
            isLearnerMode={true}
          />
        );

      case 'searching-courses':
        return <LoadingView message="Searching for courses..." />;

      case 'course-results':
        return (
          <CourseSearchResults
            topic={state.topic}
            existingCourses={state.existingCourses}
            onSelectCourse={enrollInCourse}
            onCreateNew={startNewCourseFlow}
          />
        );

      case 'loading-assessment':
        return <LoadingView message="Preparing your assessment..." />;

      case 'assessment-quiz':
        return (
          <AssessmentQuizView
            topic={state.topic}
            questions={state.questions}
            onComplete={handleAssessmentComplete}
          />
        );

      case 'evaluating':
        return <LoadingView message="Analyzing your responses and creating personalized syllabus..." />;

      case 'overview':
        if (!plan) return null;
        return (
          <LearnerOverviewView 
            topic={plan.topic}
            modules={plan.modules}
            totalDuration={plan.total_duration}
            courseId={courseId || undefined}
            isEditMode={isEditMode}
            editedModules={editedModules}
            onDayClick={goToDay}
            onToggleModule={toggleModule}
            onStartModule={handleStartModule}
            onStartEditMode={startEditMode}
            onCancelEditMode={cancelEditMode}
            onSaveEdits={saveSyllabusEdits}
            onUpdateModuleTitle={updateModuleTitle}
            onUpdateSubtopicTitle={updateSubtopicTitle}
            onDeleteSubtopic={deleteSubtopic}
            onAddSubtopic={addSubtopic}
            onReorderSubtopic={reorderSubtopic}
            onDeleteModule={deleteModule}
            onAddModule={addModule}
            onBack={restartCourse}
          />
        );

      case 'loading-content':
        return <LoadingView message="Generating your learning content..." />;

      case 'flashcards':
        const content = dayContents[state.currentDay];
        if (!content) return null;
        
        const currentScheduleItem = plan?.schedule.find(d => d.day === state.currentDay);
        const currentTopicName = currentScheduleItem?.focus_topic || "Current Topic";

        return (
          <LearnerFlashcardView 
            flashcards={content.flashcards}
            currentIndex={state.currentCard}
            dayNumber={state.currentDay}
            topic={currentTopicName}
            moduleTitle={state.moduleTitle}
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
        return (
          <SearchView 
            onSubmit={handleSearch}
            isLearnerMode={true}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Logout button */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">
            Learner
          </span>
        </Button>
      </div>

      {showNavigation && plan && (
        <TopNavigation 
          schedule={plan.schedule} 
          currentDay={
            state.step === 'flashcards' || 
            state.step === 'loading-content' || 
            state.step === 'day-complete'
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
            state.step === 'day-complete'
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

export default LearnerIndex;
