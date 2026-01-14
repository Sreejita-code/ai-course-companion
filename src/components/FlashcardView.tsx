import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, Check } from 'lucide-react';
import { Flashcard } from '@/types/course';

interface FlashcardViewProps {
  flashcards: Flashcard[];
  currentIndex: number;
  dayNumber: number;
  onNext: () => void;
  onPrevious: () => void;
}

type AnimationPhase = 'blank' | 'title-center' | 'title-moving' | 'content-reveal' | 'complete';

export function FlashcardView({
  flashcards,
  currentIndex,
  dayNumber,
  onNext,
}: FlashcardViewProps) {
  const [phase, setPhase] = useState<AnimationPhase>('blank');
  const [isPageTurning, setIsPageTurning] = useState(false);
  const card = flashcards[currentIndex];
  const isLast = currentIndex === flashcards.length - 1;

  // Reset animation phases when card changes
  useEffect(() => {
    setPhase('blank');
    
    const timer1 = setTimeout(() => setPhase('title-center'), 100);
    const timer2 = setTimeout(() => setPhase('title-moving'), 900);
    const timer3 = setTimeout(() => setPhase('content-reveal'), 1400);
    const timer4 = setTimeout(() => setPhase('complete'), 2000);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
    };
  }, [currentIndex]);

  const handleNext = () => {
    if (phase !== 'complete') return;
    
    setIsPageTurning(true);
    setTimeout(() => {
      setIsPageTurning(false);
      onNext();
    }, 600);
  };

  return (
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
      {/* Day Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <h2 className="font-display text-xl font-semibold text-foreground">
          Day {dayNumber}
        </h2>
        <p className="text-muted-foreground text-sm">
          Card {currentIndex + 1} of {flashcards.length}
        </p>
      </motion.div>

      {/* Book Container */}
      <div className="w-full max-w-2xl perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="relative"
            initial={false}
          >
            {/* Page Turn Effect - Current Page */}
            <motion.div
              animate={isPageTurning ? {
                rotateY: -180,
                x: -50,
              } : {
                rotateY: 0,
                x: 0,
              }}
              transition={{ duration: 0.6, ease: [0.645, 0.045, 0.355, 1] }}
              style={{ 
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
              }}
              className="relative"
            >
              {/* Book Page */}
              <div 
                className="min-h-[400px] md:min-h-[480px] bg-card rounded-2xl book-shadow border border-border overflow-hidden page-texture"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Gold Spine Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-2 gold-gradient rounded-l-2xl" />
                
                {/* Gold Corner Accents */}
                <div className="absolute top-4 right-4 w-12 h-12 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
                <div className="absolute bottom-4 left-6 w-12 h-12 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />
                
                {/* Content Container */}
                <div className="relative p-8 md:p-12 pl-10 md:pl-16 min-h-[400px] md:min-h-[480px] flex flex-col">
                  {/* Title - Animated Position */}
                  <AnimatePresence mode="wait">
                    {(phase === 'title-center' || phase === 'blank') && (
                      <motion.div
                        key="title-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: phase === 'blank' ? 0 : 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.5 }}
                        className="absolute inset-0 flex items-center justify-center"
                      >
                        <h3 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground px-8">
                          {card.title}
                        </h3>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Title in Final Position */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: phase === 'title-moving' || phase === 'content-reveal' || phase === 'complete' ? 1 : 0,
                      y: phase === 'title-moving' || phase === 'content-reveal' || phase === 'complete' ? 0 : 20,
                    }}
                    transition={{ duration: 0.5 }}
                    className="mb-2"
                  >
                    <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                      Concept {currentIndex + 1}
                    </span>
                  </motion.div>
                  
                  <motion.h3
                    initial={{ opacity: 0 }}
                    animate={{
                      opacity: phase === 'title-moving' || phase === 'content-reveal' || phase === 'complete' ? 1 : 0,
                    }}
                    transition={{ duration: 0.4 }}
                    className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 pb-4 border-b border-border"
                  >
                    {card.title}
                  </motion.h3>

                  {/* Content */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: phase === 'content-reveal' || phase === 'complete' ? 1 : 0,
                      y: phase === 'content-reveal' || phase === 'complete' ? 0 : 30,
                    }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                    className="flex-1"
                  >
                    <p className="text-lg md:text-xl text-foreground leading-relaxed font-body">
                      {card.content}
                    </p>
                  </motion.div>

                  {/* Next Page Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === 'complete' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-6 right-6"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={handleNext}
                      disabled={phase !== 'complete'}
                      className={`
                        flex items-center gap-2 px-5 py-3 rounded-xl font-semibold transition-all
                        ${phase === 'complete' 
                          ? 'gold-gradient text-primary-foreground shadow-lg hover:shadow-xl cursor-pointer' 
                          : 'bg-muted text-muted-foreground cursor-not-allowed'
                        }
                      `}
                    >
                      {isLast ? (
                        <>
                          <Check className="w-5 h-5" />
                          <span>Complete Day</span>
                        </>
                      ) : (
                        <ChevronRight className="w-6 h-6" />
                      )}
                    </motion.button>
                  </motion.div>

                  {/* Page Number */}
                  <div className="absolute bottom-6 left-10 text-sm text-muted-foreground font-body">
                    {currentIndex + 1}
                  </div>
                </div>
              </div>

              {/* Back of current page (visible during flip) */}
              <div 
                className="absolute inset-0 min-h-[400px] md:min-h-[480px] bg-card rounded-2xl book-shadow page-texture"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              />
            </motion.div>

            {/* Next page preview (underneath, visible during flip) */}
            {isPageTurning && currentIndex < flashcards.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 min-h-[400px] md:min-h-[480px] bg-card rounded-2xl book-shadow border border-border page-texture -z-10"
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 gold-gradient rounded-l-2xl" />
                <div className="p-8 md:p-12 pl-10 md:pl-16 flex items-center justify-center min-h-[400px] md:min-h-[480px]">
                  <h3 className="font-display text-3xl md:text-4xl font-bold text-center text-foreground/50">
                    {flashcards[currentIndex + 1]?.title}
                  </h3>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Progress Bar */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-2xl mt-8"
      >
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
        </div>
      </motion.div>
    </div>
  );
}
