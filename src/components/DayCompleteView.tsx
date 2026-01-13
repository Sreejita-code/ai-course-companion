import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, Trophy } from 'lucide-react';

interface DayCompleteViewProps {
  dayNumber: number;
  totalDays: number;
  onProceed: () => void;
}

export function DayCompleteView({ dayNumber, totalDays, onProceed }: DayCompleteViewProps) {
  const isLastDay = dayNumber === totalDays;

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-lg text-center"
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
          Day {dayNumber} Complete!
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
              {dayNumber} / {totalDays} days
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
              <span>Proceed to Day {dayNumber + 1}</span>
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
    </div>
  );
}
