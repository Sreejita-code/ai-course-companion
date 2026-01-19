import { motion } from 'framer-motion';
import { BookOpen, ChevronRight, Sparkles, Calendar } from 'lucide-react';
import { DaySchedule } from '@/types/course';

interface OverviewViewProps {
  topic: string;
  schedule: DaySchedule[];
  completedDays: number[];
  onDayClick: (dayNumber: number) => void;
}

export function OverviewView({ topic, schedule, completedDays, onDayClick }: OverviewViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center py-12 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-12 max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20"
        >
          <Calendar className="w-8 h-8 text-primary" />
        </motion.div>
        
        <h1 className="font-display text-4xl md:text-5xl font-bold mb-4 text-foreground">
          Your <span className="text-gold-gradient">{topic}</span> Journey
        </h1>
        <p className="text-lg text-muted-foreground font-body">
          {schedule.length} days of interactive learning ahead. Choose a day to begin.
        </p>
      </motion.div>

      {/* Day Cards - Horizontal Scroll */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3, duration: 0.6 }}
        className="w-full max-w-6xl"
      >
        <div className="overflow-x-auto scrollbar-hide pb-4">
          <div className="flex gap-6 px-4 min-w-max">
            {schedule.map((day, index) => {
              const isCompleted = completedDays.includes(day.day);
              
              return (
                <motion.div
                  key={day.day}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 + index * 0.1, duration: 0.5 }}
                  whileHover={{ y: -8, transition: { duration: 0.2 } }}
                  className="flex-shrink-0 w-72"
                >
                  <div
                    className={`
                      relative h-full bg-card rounded-2xl border overflow-hidden
                      book-shadow hover:shadow-xl transition-shadow duration-300
                      ${isCompleted ? 'border-primary/50' : 'border-border'}
                    `}
                  >
                    {/* Completed Badge */}
                    {isCompleted && (
                      <div className="absolute top-4 right-4 z-10">
                        <div className="w-8 h-8 rounded-full gold-gradient flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-primary-foreground" />
                        </div>
                      </div>
                    )}

                    {/* Card Header */}
                    <div className="p-6 pb-4">
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`
                          w-12 h-12 rounded-xl flex items-center justify-center font-display font-bold text-lg
                          ${isCompleted 
                            ? 'gold-gradient text-primary-foreground' 
                            : 'bg-primary/10 text-primary border border-primary/20'
                          }
                        `}>
                          {day.day}
                        </div>
                        <div>
                          <p className="text-sm text-muted-foreground font-body">Day {day.day}</p>
                          <h3 className="font-display font-semibold text-foreground line-clamp-1">
                            {day.focus_topic}
                          </h3>
                        </div>
                      </div>

                      {/* Summary */}
                      <p className="text-sm text-muted-foreground font-body line-clamp-3 mb-6 min-h-[3.75rem]">
                        {day.summary}
                      </p>
                    </div>

                    {/* Card Footer */}
                    <div className="px-6 pb-6">
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onDayClick(day.day)}
                        className={`
                          w-full py-3 px-4 rounded-xl font-semibold text-sm
                          flex items-center justify-center gap-2 transition-all
                          ${isCompleted
                            ? 'bg-secondary text-secondary-foreground hover:bg-accent'
                            : 'gold-gradient text-primary-foreground shadow-md hover:shadow-lg'
                          }
                        `}
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>{isCompleted ? 'Review Flashcards' : 'View Flashcards'}</span>
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    </div>

                    {/* Decorative Corner */}
                    <div className="absolute top-0 left-0 w-16 h-16 overflow-hidden">
                      <div className="absolute -top-8 -left-8 w-16 h-16 bg-primary/5 rounded-full" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </div>
      </motion.div>

      {/* Quick Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8, duration: 0.5 }}
        className="mt-12 text-center"
      >
        <p className="text-sm text-muted-foreground font-body">
          💡 <span className="font-medium">Tip:</span> Complete days in order for the best learning experience
        </p>
      </motion.div>
    </div>
  );
}
