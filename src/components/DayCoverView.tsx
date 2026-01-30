import { motion } from 'framer-motion';
import { BookOpen, ArrowRight, Calendar } from 'lucide-react';
import { DaySchedule } from '@/types/course';

interface DayCoverViewProps {
  dayNumber: number;
  totalDays: number;
  dayInfo: DaySchedule;
  onStart: () => void;
}

export function DayCoverView({ dayNumber, totalDays, dayInfo, onStart }: DayCoverViewProps) {
  // Render summary with simple bold parsing
  const renderSummary = () => {
    return dayInfo.summary.split(' ').map((word, i) => {
      const isBold = word.includes('**');
      const cleanWord = word.replace(/\*\*/g, '');
      return (
        // UPDATED COLOR: Changed text-primary to text-amber-600
        <span key={i} className={isBold ? "font-bold text-amber-600" : ""}>
          {cleanWord}{' '}
        </span>
      );
    });
  };

  return (
    <div className="h-full flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, rotateY: -10 }}
        animate={{ opacity: 1, scale: 1, rotateY: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-lg perspective-1000"
      >
        {/* Book Cover */}
        <div className="relative bg-card rounded-2xl book-shadow border border-border overflow-hidden">
          {/* Gold Accent Top */}
          <div className="h-2 gold-gradient" />
          
          {/* Content */}
          <div className="p-8 md:p-12 page-texture">
            {/* Day Badge */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex items-center justify-center gap-2 mb-8"
            >
              <Calendar className="w-5 h-5 text-primary" />
              <span className="text-sm font-semibold text-primary uppercase tracking-wider">
                Day {dayNumber} of {totalDays}
              </span>
            </motion.div>

            {/* Decorative Line */}
            <motion.div
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="w-24 h-0.5 bg-gradient-to-r from-transparent via-primary/50 to-transparent mx-auto mb-8"
            />

            {/* Topic Title */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="font-display text-3xl md:text-4xl font-bold text-center text-foreground mb-6"
            >
              {dayInfo.focus_topic}
            </motion.h1>

            {/* Summary */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="text-center text-muted-foreground leading-relaxed mb-10 font-body text-lg"
            >
              {renderSummary()}
            </motion.p>

            {/* Book Icon */}
            <motion.div
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.7, type: 'spring' }}
              className="flex justify-center mb-10"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center">
                <BookOpen className="w-8 h-8 text-primary" />
              </div>
            </motion.div>

            {/* Start Button */}
            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={onStart}
              className="w-full py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow animate-pulse-gold"
            >
              <span>Start Day {dayNumber}</span>
              <ArrowRight className="w-5 h-5" />
            </motion.button>
          </div>

          {/* Gold Accent Bottom */}
          <div className="h-2 gold-gradient" />
        </div>

        {/* Progress Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 flex justify-center gap-2"
        >
          {[...Array(totalDays)].map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-colors ${
                i + 1 === dayNumber
                  ? 'gold-gradient'
                  : i + 1 < dayNumber
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