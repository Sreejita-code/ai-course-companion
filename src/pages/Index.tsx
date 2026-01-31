import { useCourse } from '@/hooks/useCourse';
import { SearchView } from '@/components/SearchView';
import { LearnerSearchView } from '@/components/LearnerSearchView';
import { AssessmentView } from '@/components/AssessmentView';
import { LoadingView } from '@/components/LoadingView';
import { DayCoverView } from '@/components/DayCoverView';
import { FlashcardView } from '@/components/FlashcardView';
import { QuizView } from '@/components/QuizView';
import { DayCompleteView } from '@/components/DayCompleteView';
import { CourseCompleteView } from '@/components/CourseCompleteView';
import { TopNavigation } from '@/components/TopNavigation';
import { OverviewView } from '@/components/OverviewView';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { PersonaData } from '@/components/PersonaDialog';

const Index = () => {
  const { logout, user } = useAuth();
  // Identify if the current user is a learner
  const isLearner = user?.role === 'user'; 

  const {
    state,
    plan,
    courseId,
    dayContents,
    completedDays,
    error,
    isEditMode,
    editedModules,
    isPublished,
    
    // Creator Actions
    generateSyllabus,
    saveCourseEdits,
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
    
    // Learner Actions
    searchTopic,
    startAssessment,
    submitAssessment,
    viewCourse,
    fetchLearnerModuleContent,
    
    // Shared Actions
    generateModuleContent,
    updateFlashcardContent,
    goToDay,
    goToOverview,
    startDay,
    nextCard,
    previousCard,
    proceedToNextDay,
    restartCourse,
    finishQuiz,
  } = useCourse();

  // --- Handlers ---
  const handleGenerateCourse = async (topic: string, persona?: PersonaData) => {
    await generateSyllabus(topic, persona);
  };

  /**
   * Handles the "Start" action on a module.
   * - Learners: Fetches existing, creator-defined content (read-only).
   * - Creators: Generates new content via AI if not present (editable).
   */
  const handleStartModule = async (dayNumber: number, moduleTitle: string) => {
    if (isLearner) {
      await fetchLearnerModuleContent(moduleTitle, dayNumber);
    } else {
      await generateModuleContent(moduleTitle, dayNumber);
    }
  };

  const showNavigation = plan && 
    state.step !== 'search' && 
    state.step !== 'learner-search-results' && 
    state.step !== 'learner-assessment' &&
    state.step !== 'loading-syllabus' && 
    state.step !== 'loading-plan' && 
    state.step !== 'course-complete';

  // --- Main Render Logic ---
  const renderContent = () => {
    switch (state.step) {
      // 1. Search (Split by Role)
      case 'search':
        if (isLearner) {
          return (
            <LearnerSearchView 
              onSearch={searchTopic} 
              onTakeAssessment={startAssessment}
              onViewCourse={viewCourse}
            />
          );
        }
        return <SearchView onSubmit={handleGenerateCourse} />;

      // 2. Learner Specific Steps
      case 'learner-search-results':
        return (
          <LearnerSearchView 
            onSearch={searchTopic} 
            searchResults={state.courses}
            searchedTopic={state.topic}
            onTakeAssessment={startAssessment}
            onViewCourse={viewCourse}
          />
        );

      case 'learner-assessment':
        return (
          <AssessmentView 
            topic={state.topic!} 
            questions={state.questions!} 
            onSubmit={(answers) => submitAssessment(state.topic!, answers)}
          />
        );

      case 'evaluating-assessment':
        return <LoadingView message="Analyzing your answers and building your custom syllabus..." />;

      case 'loading-syllabus':
        return <LoadingView message={isLearner ? "Searching our library..." : "Designing your curriculum..."} />;

      // 3. Overview (Shared, but restricted for Learner)
      case 'overview':
        if (!plan) return null;
        return (
          <OverviewView 
            topic={plan.topic}
            modules={plan.modules}
            totalDuration={plan.total_duration}
            courseId={courseId || undefined}
            
            // Edit Mode: Forced false for learners
            isEditMode={!isLearner && isEditMode} 
            editedModules={!isLearner ? editedModules : undefined}
            
            // Publish: Creator only
            isPublished={isPublished}
            onTogglePublish={!isLearner ? togglePublish : undefined}
            
            // Actions
            onDayClick={goToDay}
            onStartModule={handleStartModule} // Uses branching logic
            
            // Creator Actions (Only passed if !isLearner)
            onToggleModule={!isLearner ? toggleModule : undefined}
            onStartEditMode={!isLearner ? startEditMode : undefined}
            onCancelEditMode={!isLearner ? cancelEditMode : undefined}
            onSaveEdits={!isLearner ? saveCourseEdits : undefined}
            onUpdateModuleTitle={!isLearner ? updateModuleTitle : undefined}
            onUpdateSubtopicTitle={!isLearner ? updateSubtopicTitle : undefined}
            onDeleteSubtopic={!isLearner ? deleteSubtopic : undefined}
            onAddSubtopic={!isLearner ? addSubtopic : undefined}
            onReorderSubtopic={!isLearner ? reorderSubtopic : undefined}
            onDeleteModule={!isLearner ? deleteModule : undefined}
            onAddModule={!isLearner ? addModule : undefined}
          />
        );

      case 'loading-plan':
        return <LoadingView message="Loading course content..." />;

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
        return <LoadingView message={isLearner ? "Fetching content..." : "Generating content..."} />;

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
            moduleTitle={state.moduleTitle}
            courseId={courseId || undefined}
            onNext={nextCard}
            onPrevious={previousCard}
            // Pass undefined to onCardUpdate for learners to hide the edit button
            onCardUpdate={!isLearner ? (index, newContent, newAudioScript) => {
              const flashcard = content.flashcards[index];
              if (flashcard && state.moduleTitle) {
                updateFlashcardContent(
                  state.moduleTitle, 
                  flashcard.title, 
                  newContent.split('\n\n'), 
                  newAudioScript || flashcard.audioScript || ''
                );
              }
            } : undefined}
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
        // Default fallback to correct search view
        if (isLearner) {
          return (
            <LearnerSearchView 
              onSearch={searchTopic} 
              onTakeAssessment={startAssessment}
              onViewCourse={viewCourse} 
            />
          );
        }
        return <SearchView onSubmit={handleGenerateCourse} />;
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Logout button - always visible */}
      <div className="fixed top-4 right-4 z-50">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={logout}
          className="gap-2 text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-4 h-4" />
          <span className="hidden sm:inline font-semibold">
            {user?.role === 'creator' ? 'Creator Dashboard' : 'Learner Dashboard'}
          </span>
        </Button>
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