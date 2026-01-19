import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Calendar, Check } from 'lucide-react';
import { DaySchedule } from '@/types/course';

interface OverviewViewProps {
  topic: string;
  schedule: DaySchedule[];
  completedDays: number[];
  onDayClick: (dayNumber: number) => void;
}

export function OverviewView({ topic, schedule, completedDays, onDayClick }: OverviewViewProps) {
  // Calculate grid columns based on total days
  const getGridCols = (totalDays: number) => {
    if (totalDays <= 7) return 'grid-cols-7';
    if (totalDays <= 14) return 'grid-cols-7';
    if (totalDays <= 21) return 'grid-cols-7';
    return 'grid-cols-7 sm:grid-cols-10';
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center py-8 px-4">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-8 max-w-2xl"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-4 inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20"
        >
          <Calendar className="w-7 h-7 text-primary" />
        </motion.div>
        
        <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 text-foreground">
          Your <span className="text-gold-gradient">{topic}</span> Journey
        </h1>
        <p className="text-base text-muted-foreground font-body">
          {schedule.length} days of learning • Click any day to begin
        </p>
      </motion.div>

      {/* Calendar Grid */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="w-full max-w-4xl"
      >
        <div className="bg-card rounded-2xl border border-border p-4 md:p-6 book-shadow">
          {/* Week Headers */}
          <div className="grid grid-cols-7 gap-2 mb-3">
            {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-muted-foreground py-1">
                {day}
              </div>
            ))}
          </div>

          {/* Day Cells */}
          <div className="grid grid-cols-7 gap-2">
            {schedule.map((day, index) => {
              const isCompleted = completedDays.includes(day.day);
              
              return (
                <motion.button
                  key={day.day}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.02, duration: 0.3 }}
                  whileHover={{ scale: 1.08, zIndex: 10 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => onDayClick(day.day)}
                  className={`
                    relative aspect-square rounded-xl p-2 flex flex-col items-center justify-center
                    transition-all duration-200 group cursor-pointer
                    ${isCompleted 
                      ? 'gold-gradient text-primary-foreground shadow-md' 
                      : 'bg-secondary/50 hover:bg-primary/10 border border-border hover:border-primary/50'
                    }
                  `}
                  title={`Day ${day.day}: ${day.focus_topic}`}
                >
                  {/* Day Number */}
                  <span className={`
                    font-display font-bold text-lg md:text-xl
                    ${isCompleted ? 'text-primary-foreground' : 'text-foreground'}
                  `}>
                    {day.day}
                  </span>

                  {/* Completed Check */}
                  {isCompleted && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-background border-2 border-primary flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-primary" />
                    </motion.div>
                  )}

                  {/* Hover Tooltip */}
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-popover border border-border rounded-lg shadow-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-20 min-w-48 max-w-64">
                    <p className="font-display font-semibold text-sm text-foreground mb-1 line-clamp-1">
                      {day.focus_topic}
                    </p>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {day.summary}
                    </p>
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 mt-6 pt-4 border-t border-border">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-secondary/50 border border-border" />
              <span className="text-xs text-muted-foreground">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded gold-gradient" />
              <span className="text-xs text-muted-foreground">Completed</span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Progress Summary */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6, duration: 0.5 }}
        className="mt-6 flex items-center gap-3"
      >
        <Sparkles className="w-4 h-4 text-primary" />
        <p className="text-sm text-muted-foreground font-body">
          <span className="font-semibold text-foreground">{completedDays.length}</span> of {schedule.length} days completed
        </p>
      </motion.div>
    </div>
  );
}
