import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, BookOpen, ArrowLeft } from 'lucide-react';
import { DaySchedule } from '@/types/course';

interface TopNavigationProps {
  schedule: DaySchedule[];
  currentDay?: number;
  completedDays: number[];
  onDayClick: (day: number) => void;
  onBack: () => void;
  onHome: () => void;
  showOverview?: boolean;
  onOverviewClick?: () => void;
}

export function TopNavigation({ 
  schedule, 
  currentDay, 
  completedDays,
  onDayClick,
  onBack,
  onHome,
  showOverview = true,
  onOverviewClick
}: TopNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScrollability = () => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  };

  useEffect(() => {
    checkScrollability();
    window.addEventListener('resize', checkScrollability);
    return () => window.removeEventListener('resize', checkScrollability);
  }, [schedule]);

  useEffect(() => {
    // Auto-scroll to current day
    if (currentDay === undefined) return;
    const container = scrollContainerRef.current;
    if (container) {
      const dayButton = container.querySelector(`[data-day="${currentDay}"]`);
      if (dayButton) {
        dayButton.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentDay]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 200;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border"
    >
      <div className="max-w-6xl mx-auto px-4 py-3">
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Home Arrow */}
          <motion.button
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={onHome}
            className="p-2 rounded-full bg-card border border-border text-foreground hover:bg-accent hover:border-primary/50 transition-all"
            title="Back to Search"
          >
            <ArrowLeft className="w-4 h-4" />
          </motion.button>

          {/* Logo */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onBack}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-accent transition-colors"
          >
            <BookOpen className="w-5 h-5 text-primary" />
            <span className="font-display font-semibold text-foreground hidden sm:inline">
              Learn<span className="text-gold-gradient">Book</span>
            </span>
          </motion.button>

          {/* Overview Button */}
          {showOverview && onOverviewClick && (
            <>
              <div className="h-6 w-px bg-border" />
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={onOverviewClick}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-accent transition-colors"
              >
                Overview
              </motion.button>
            </>
          )}

          {/* Separator */}
          <div className="h-6 w-px bg-border" />

          {/* Timeline Container */}
          <div className="flex-1 flex items-center gap-2">
            {/* Left Scroll Arrow */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('left')}
              className={`p-2 rounded-full transition-all ${
                canScrollLeft 
                  ? 'bg-card border border-border text-foreground hover:bg-accent' 
                  : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
              disabled={!canScrollLeft}
            >
              <ChevronLeft className="w-4 h-4" />
            </motion.button>

            {/* Scrollable Days */}
            <div
              ref={scrollContainerRef}
              onScroll={checkScrollability}
              className="flex-1 overflow-x-auto scrollbar-hide flex items-center gap-2 py-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {schedule.map((day) => {
                const isActive = currentDay !== undefined && day.day === currentDay;
                const isCompleted = completedDays.includes(day.day);
                
                return (
                  <motion.button
                    key={day.day}
                    data-day={day.day}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => onDayClick(day.day)}
                    className={`
                      relative flex-shrink-0 px-4 py-2.5 rounded-xl transition-all duration-300
                      ${isActive 
                        ? 'gold-gradient text-primary-foreground shadow-lg' 
                        : isCompleted
                          ? 'bg-primary/20 text-primary border border-primary/30'
                          : 'bg-card border border-border text-foreground hover:border-primary/50'
                      }
                    `}
                  >
                    <div className="text-center min-w-[60px]">
                      <div className={`text-xs font-medium ${isActive ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                        Day
                      </div>
                      <div className="font-bold text-lg">{day.day}</div>
                    </div>
                    
                    {/* Completed Checkmark */}
                    {isCompleted && !isActive && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center"
                      >
                        <svg className="w-3 h-3 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                      </motion.div>
                    )}
                  </motion.button>
                );
              })}
            </div>

            {/* Right Scroll Arrow */}
            <motion.button
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => scroll('right')}
              className={`p-2 rounded-full transition-all ${
                canScrollRight 
                  ? 'bg-card border border-border text-foreground hover:bg-accent' 
                  : 'text-muted-foreground/30 cursor-not-allowed'
              }`}
              disabled={!canScrollRight}
            >
              <ChevronRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
