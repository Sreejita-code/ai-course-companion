import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, ArrowRight, Trophy, ThumbsUp } from 'lucide-react';

interface DayCompleteViewProps {
  dayNumber: number;
  totalDays: number;
  onProceed: () => void;
}

export function DayCompleteView({ dayNumber, totalDays, onProceed }: DayCompleteViewProps) {
  const [showAnimation, setShowAnimation] = useState(true);
  const isLastDay = dayNumber === totalDays;

  useEffect(() => {
    // Show thumbs up animation for 2.5 seconds, then reveal progress
    const timer = setTimeout(() => {
      setShowAnimation(false);
    }, 2500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="h-full w-full flex items-center justify-center relative">
      <AnimatePresence mode="wait">
        {showAnimation ? (
          // THUMBS UP ANIMATION VIEW
          // CHANGED: used 'fixed inset-0' to center explicitly in the viewport (middle of screen)
          <motion.div
            key="thumbs-up"
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 1.1, filter: "blur(10px)" }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-stone-100/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ rotate: -20, scale: 0.8 }}
              animate={{ 
                rotate: [0, -10, 10, -5, 5, 0], // Shake/Wobble effect
                scale: 1.2
              }}
              transition={{ 
                delay: 0.2,
                duration: 1.5, 
                ease: "easeInOut" 
              }}
              className="w-48 h-48 rounded-full gold-gradient flex items-center justify-center shadow-2xl mb-8"
            >
              <ThumbsUp className="w-24 h-24 text-primary-foreground fill-current" />
            </motion.div>
            
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-display text-5xl font-bold text-foreground"
            >
              Great Job!
            </motion.h2>
          </motion.div>
        ) : (
          // ACTUAL PROGRESS REPORT VIEW
          <motion.div
            key="content"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, ease: 'easeOut' }}
            className="w-full max-w-lg text-center px-4"
          >
            {/* Success Icon */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
              className="mb-8 inline-flex items-center justify-center w-24 h-24 rounded-full gold-gradient shadow-lg"
            >
              <CheckCircle className="w-12 h-12 text-primary-foreground" />
            </motion.div>

            {/* Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="font-display text-4xl md:text-5xl font-bold text-foreground mb-4"
            >
              Topic {dayNumber} Complete!
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground mb-8 font-body"
            >
              {isLastDay
                ? "You've completed all the days!"
                : `Great progress! You're ${Math.round((dayNumber / totalDays) * 100)}% through the course.`}
            </motion.p>

            {/* Progress Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="bg-card rounded-2xl book-shadow border border-border p-6 mb-8"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="text-muted-foreground font-body">Progress</span>
                <span className="font-semibold text-primary">
                  {dayNumber} / {totalDays} topics
                </span>
              </div>
              <div className="h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full gold-gradient"
                  initial={{ width: 0 }}
                  animate={{ width: `${(dayNumber / totalDays) * 100}%` }}
                  transition={{ delay: 0.6, duration: 0.8, ease: 'easeOut' }}
                />
              </div>
            </motion.div>

            {/* Action Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onProceed}
              className="w-full py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
            >
              {isLastDay ? (
                <>
                  <Trophy className="w-5 h-5" />
                  <span>Complete Course</span>
                </>
              ) : (
                <>
                  <span>Proceed to Topic {dayNumber + 1}</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </motion.button>

            {/* Decorative Elements */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              className="mt-8 flex justify-center gap-2"
            >
              {[...Array(totalDays)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.9 + i * 0.1 }}
                  className={`w-3 h-3 rounded-full ${
                    i + 1 <= dayNumber ? 'gold-gradient' : 'bg-muted'
                  }`}
                />
              ))}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}