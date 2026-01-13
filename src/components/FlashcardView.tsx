import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';
import { Flashcard } from '@/types/course';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  currentIndex: number;
  dayNumber: number;
  onNext: () => void;
  onPrevious: () => void;
}

export function FlashcardView({
  flashcards,
  currentIndex,
  dayNumber,
  onNext,
  onPrevious,
}: FlashcardViewProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const card = flashcards[currentIndex];
  const isFirst = currentIndex === 0;
  const isLast = currentIndex === flashcards.length - 1;

  const handleNext = () => {
    setIsFlipped(false);
    setTimeout(onNext, 150);
  };

  const handlePrevious = () => {
    setIsFlipped(false);
    setTimeout(onPrevious, 150);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
          Day {dayNumber}
        </h2>
        <p className="text-muted-foreground">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </motion.div>

      {/* Flashcard */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg perspective-1000 mb-8"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            onClick={() => setIsFlipped(!isFlipped)}
            className="cursor-pointer"
          >
            <motion.div
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, ease: 'easeInOut' }}
              className="relative preserve-3d"
              style={{ transformStyle: 'preserve-3d' }}
            >
              {/* Front of Card */}
              <div
                className="w-full min-h-[320px] md:min-h-[400px] bg-card rounded-2xl book-shadow border border-border p-8 md:p-10 flex flex-col items-center justify-center backface-hidden page-texture"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Gold Corner Accents */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-primary/30 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-primary/30 rounded-br-2xl" />

                <span className="text-sm font-semibold text-primary uppercase tracking-wider mb-4">
                  Concept
                </span>
                <h3 className="font-display text-2xl md:text-3xl font-bold text-center text-foreground">
                  {card.title}
                </h3>

                <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">Click to flip</span>
                </div>
              </div>

              {/* Back of Card */}
              <div
                className="absolute inset-0 w-full min-h-[320px] md:min-h-[400px] bg-card rounded-2xl book-shadow border border-border p-8 md:p-10 flex flex-col items-center justify-center rotate-y-180 backface-hidden"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                  background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--book-page)) 100%)'
                }}
              >
                {/* Gold Corner Accents */}
                <div className="absolute top-0 left-0 w-16 h-16 border-l-2 border-t-2 border-gold/40 rounded-tl-2xl" />
                <div className="absolute bottom-0 right-0 w-16 h-16 border-r-2 border-b-2 border-gold/40 rounded-br-2xl" />

                <span className="text-sm font-semibold text-gold uppercase tracking-wider mb-4">
                  Explanation
                </span>
                <p className="text-lg md:text-xl text-center text-foreground leading-relaxed font-body">
                  {card.content}
                </p>

                <div className="mt-8 flex items-center gap-2 text-muted-foreground">
                  <RotateCcw className="w-4 h-4" />
                  <span className="text-sm">Click to flip back</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Navigation */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="flex items-center gap-4"
      >
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={handlePrevious}
          disabled={isFirst}
          className={`p-4 rounded-full border ${
            isFirst
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
          <span>{isLast ? 'Complete' : 'Next'}</span>
          <ChevronRight className="w-5 h-5" />
        </motion.button>
      </motion.div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.4 }}
        className="w-full max-w-lg mt-8"
      >
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
      </motion.div>
    </div>
  );
}
