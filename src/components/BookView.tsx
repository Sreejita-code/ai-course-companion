import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, Sparkles } from 'lucide-react';
import { Book3D } from '@/components/Book3D';
import { CoursePlan, DayContent } from '@/types/course';

interface BookViewProps {
  plan: CoursePlan;
  dayContents: Record<number, DayContent>;
  currentDay: number;
  currentCard: number;
  isLoadingContent: boolean;
  onStartDay: (day: number) => void;
  onNextCard: () => void;
  onPreviousCard: () => void;
  onDayComplete: () => void;
}

export function BookView({
  plan,
  dayContents,
  currentDay,
  currentCard,
  isLoadingContent,
  onStartDay,
  onNextCard,
  onPreviousCard,
  onDayComplete,
}: BookViewProps) {
  const [viewingDayCover, setViewingDayCover] = useState(true);
  const [flippedCards, setFlippedCards] = useState<Set<number>>(new Set());

  const currentDayInfo = plan.schedule.find(d => d.day === currentDay);
  const currentContent = dayContents[currentDay];
  const totalCards = currentContent?.flashcards.length || 0;

  // Generate pages for the book
  const pages = useMemo(() => {
    if (!currentContent) return [];

    return currentContent.flashcards.map((card, index) => ({
      front: (
        <div className="text-center">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
            Concept {index + 1}
          </div>
          <h3 className="font-display text-lg font-bold text-stone-800 leading-tight">
            {card.title}
          </h3>
          <div className="mt-4 text-xs text-stone-500">
            Tap card to reveal
          </div>
        </div>
      ),
      back: (
        <div className="text-center">
          <div className="text-xs font-semibold text-amber-600 uppercase tracking-wider mb-2">
            Explanation
          </div>
          <p className="text-sm text-stone-700 leading-relaxed">
            {card.content}
          </p>
        </div>
      ),
    }));
  }, [currentContent]);

  // Cover content for the book
  const coverContent = (
    <div className="text-center text-white">
      <BookOpen className="w-10 h-10 mx-auto mb-3 text-amber-300" />
      <h2 className="font-display text-xl font-bold text-amber-100">
        {plan.topic}
      </h2>
      <div className="mt-2 text-sm text-amber-200/80">
        Day {currentDay} of {plan.total_days}
      </div>
    </div>
  );

  const handleFlipCard = () => {
    setFlippedCards(prev => {
      const next = new Set(prev);
      if (next.has(currentCard)) {
        next.delete(currentCard);
      } else {
        next.add(currentCard);
      }
      return next;
    });
  };

  const handleNext = () => {
    if (currentCard < totalCards - 1) {
      setFlippedCards(new Set());
      onNextCard();
    } else {
      onDayComplete();
    }
  };

  const handlePrevious = () => {
    if (currentCard > 0) {
      setFlippedCards(new Set());
      onPreviousCard();
    }
  };

  const handleStartReading = () => {
    setViewingDayCover(false);
    onStartDay(currentDay);
  };

  // Day Cover View (before starting flashcards)
  if (viewingDayCover || isLoadingContent) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-2xl"
        >
          {/* Chapter Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full border border-primary/20 mb-4"
            >
              <BookOpen className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-primary">
                Chapter {currentDay} of {plan.total_days}
              </span>
            </motion.div>
            
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              {currentDayInfo?.focus_topic}
            </motion.h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-lg mx-auto"
            >
              {currentDayInfo?.summary}
            </motion.p>
          </div>

          {/* 3D Book Preview */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className="mb-8"
          >
            <Book3D
              pages={pages.length > 0 ? pages : [{ front: <div />, back: <div /> }]}
              currentPage={0}
              coverContent={coverContent}
            />
          </motion.div>

          {/* Start Button */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="text-center"
          >
            {isLoadingContent ? (
              <div className="flex items-center justify-center gap-3 text-muted-foreground">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Sparkles className="w-5 h-5" />
                </motion.div>
                <span>Preparing chapter content...</span>
              </div>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleStartReading}
                className="px-8 py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl inline-flex items-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
              >
                <BookOpen className="w-5 h-5" />
                <span>Open Chapter {currentDay}</span>
              </motion.button>
            )}
          </motion.div>

          {/* Progress Dots */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="flex justify-center gap-2 mt-8"
          >
            {plan.schedule.map((_, i) => (
              <div
                key={i}
                className={`w-2.5 h-2.5 rounded-full transition-colors ${
                  i + 1 === currentDay
                    ? 'gold-gradient'
                    : i + 1 < currentDay
                    ? 'bg-primary/60'
                    : 'bg-muted'
                }`}
              />
            ))}
          </motion.div>
        </motion.div>
      </div>
    );
  }

  // Flashcard Reading View
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4"
      >
        <h2 className="font-display text-2xl font-semibold text-foreground">
          {currentDayInfo?.focus_topic}
        </h2>
        <p className="text-muted-foreground mt-1">
          Card {currentCard + 1} of {totalCards}
        </p>
      </motion.div>

      {/* 3D Book */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-3xl"
        onClick={handleFlipCard}
      >
        <Book3D
          pages={pages}
          currentPage={currentCard + 1}
          coverContent={coverContent}
          onPageClick={handleFlipCard}
        />
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4 mt-6"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
          disabled={currentCard === 0}
          className={`p-4 rounded-full border ${
            currentCard === 0
              ? 'border-muted text-muted-foreground cursor-not-allowed'
              : 'border-primary/30 text-primary hover:bg-primary/10'
          } transition-colors`}
        >
          <ChevronLeft className="w-6 h-6" />
        </motion.button>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleNext}
          className="px-8 py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
        >
          <span>{currentCard === totalCards - 1 ? 'Complete Chapter' : 'Turn Page'}</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-lg mt-6"
      >
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${((currentCard + 1) / totalCards) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>

      {/* Hint */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="text-sm text-muted-foreground mt-4"
      >
        Click on the book to flip pages • Drag to rotate view
      </motion.p>
    </div>
  );
}
