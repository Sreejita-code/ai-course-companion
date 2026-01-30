import { useState, useMemo, useEffect } from 'react';
import { AnimatePresence } from 'framer-motion';
import { DaySchedule, Flashcard } from '@/types/course';
import { BookPage } from '@/components/BookPage';
import { DayCoverView } from '@/components/DayCoverView';
import { FlashcardView } from '@/components/FlashcardView';
import { DayCompleteView } from '@/components/DayCompleteView';
import { TopNavigation } from '@/components/TopNavigation';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, X, BookOpen } from 'lucide-react';

// Helper to generate colors
function generateTheme(topic: string) {
  let hash = 0;
  for (let i = 0; i < topic.length; i++) hash = topic.charCodeAt(i) + ((hash << 5) - hash);
  const h = Math.abs(hash % 360);
  return {
    '--primary': `${h} 70% 35%`,
    '--primary-foreground': '0 0% 100%',
    '--secondary': `${h} 15% 96%`,
  } as React.CSSProperties;
}

interface CourseBookViewProps {
  dayNumber: number;
  totalDays: number;
  dayInfo: DaySchedule;
  flashcards: Flashcard[];
  topic: string;
  onComplete: () => void;
  onExit: () => void;
  schedule?: DaySchedule[]; 
  completedDays?: number[];
  onDaySelect?: (day: number) => void;
}

export function CourseBookView({
  dayNumber,
  totalDays,
  dayInfo,
  flashcards: initialFlashcards, // Rename prop to initialFlashcards
  topic,
  onComplete,
  onExit,
  schedule = [], 
  completedDays = [], 
  onDaySelect = () => {},
}: CourseBookViewProps) {
  // Page Management
  const [pageIndex, setPageIndex] = useState(0);
  const [direction, setDirection] = useState(0); // -1 = Prev, 1 = Next
  
  // Local state for flashcards to support editing
  const [localFlashcards, setLocalFlashcards] = useState<Flashcard[]>(initialFlashcards);

  // Sync prop changes if they occur externally (e.g. day change)
  useEffect(() => {
    setLocalFlashcards(initialFlashcards);
  }, [initialFlashcards]);

  const themeStyles = useMemo(() => generateTheme(topic), [topic]);
  const totalBookPages = 1 + localFlashcards.length + 1; // Cover + Cards + Complete

  // SCROLL LOCK: Aggressively remove scrollbars from the window
  useEffect(() => {
    // Create a style element to force overflow hidden with !important
    const style = document.createElement('style');
    style.innerHTML = `
      html, body {
        overflow: hidden !important;
        height: 100% !important;
        width: 100% !important;
        position: fixed !important; /* Prevents mobile bounce */
        margin: 0 !important;
      }
    `;
    document.head.appendChild(style);

    // Cleanup
    return () => {
      document.head.removeChild(style);
    };
  }, []);

  // Navigation Handlers
  const paginate = (newDirection: number) => {
    const newIndex = pageIndex + newDirection;
    if (newIndex >= 0 && newIndex < totalBookPages) {
      setDirection(newDirection);
      setPageIndex(newIndex);
    }
  };

  // Handler for updating a specific card
  const handleCardUpdate = (index: number, newContent: string) => {
    const updatedCards = [...localFlashcards];
    updatedCards[index] = { ...updatedCards[index], content: newContent };
    setLocalFlashcards(updatedCards);
  };

  const renderContent = () => {
    // 1. Cover
    if (pageIndex === 0) {
      return (
        <DayCoverView
          dayNumber={dayNumber}
          totalDays={totalDays}
          dayInfo={dayInfo}
          onStart={() => paginate(1)}
        />
      );
    }
    // 2. Complete
    if (pageIndex === totalBookPages - 1) {
      return (
        <DayCompleteView
          dayNumber={dayNumber}
          totalDays={totalDays}
          onProceed={onComplete}
        />
      );
    }
    // 3. Flashcards
    return (
      <FlashcardView
        flashcards={localFlashcards}
        currentIndex={pageIndex - 1}
        dayNumber={dayNumber}
        topic={topic}
        onNext={() => paginate(1)}
        onPrevious={() => paginate(-1)}
        onCardUpdate={handleCardUpdate}
      />
    );
  };

  return (
    // MAIN CONTAINER: Fixed to inset-0 with w-full to avoid overflow
    <div 
      className="fixed inset-0 w-full h-full overflow-hidden bg-stone-100 flex flex-col items-center justify-center"
      style={themeStyles}
    >
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-stone-50 via-stone-100 to-stone-200" />

      {/* Top Navigation Bar */}
      {schedule.length > 0 && (
         <div className="absolute top-0 left-0 right-0 z-50">
            <TopNavigation 
              schedule={schedule}
              currentDay={dayNumber}
              completedDays={completedDays}
              onDayClick={onDaySelect}
              onBack={onExit}
              courseTopic={topic}
            />
         </div>
      )}

      {/* Floating Header (Only if schedule is empty/TopNav not used) */}
      {schedule.length === 0 && (
        <div className="fixed top-6 left-0 right-0 z-50 px-6 flex justify-between items-center max-w-5xl mx-auto w-full pointer-events-none">
          <div className="flex items-center gap-2 bg-white/80 backdrop-blur shadow-sm px-4 py-2 rounded-full border border-stone-200/50 pointer-events-auto">
            <BookOpen className="w-4 h-4 text-primary" />
            <span className="text-sm font-semibold text-stone-700">
              {topic} <span className="text-stone-300">|</span> Day {dayNumber}
            </span>
          </div>
          
          <Button 
            variant="secondary" 
            size="icon" 
            onClick={onExit}
            className="rounded-full shadow-sm hover:bg-white pointer-events-auto"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* BOOK CONTAINER */}
      {/* UPDATED DIMENSIONS: Wider (max-w-6xl) and shorter Aspect Ratio (2/1) */}
      <div className="relative w-full max-w-6xl aspect-[3/4] md:aspect-[2/1] max-h-[85vh] perspective-[2000px] mt-16">
        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <BookPage 
            key={pageIndex} 
            zIndex={totalBookPages - pageIndex} 
            direction={direction}
          >
            {renderContent()}
          </BookPage>
        </AnimatePresence>
      </div>

      {/* Bottom Progress */}
      <div className="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur shadow-sm px-6 py-2 rounded-full border border-stone-200/50 flex items-center gap-4 pointer-events-auto">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => paginate(-1)}
            disabled={pageIndex === 0}
            className="h-8 w-8 rounded-full hover:bg-stone-100"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          
          <div className="text-xs font-medium text-stone-500 tabular-nums">
            Page {pageIndex + 1} of {totalBookPages}
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={() => paginate(1)}
            disabled={pageIndex === totalBookPages - 1}
            className="h-8 w-8 rounded-full hover:bg-stone-100"
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}