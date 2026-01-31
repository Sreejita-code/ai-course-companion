import { useRef, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { 
  ChevronLeft, 
  ChevronRight, 
  BookOpen, 
  ArrowLeft, 
  RotateCcw, 
  FileText, 
  LayoutGrid,
  Loader2,
  CheckCircle2
} from 'lucide-react';
import { DaySchedule } from '@/types/course';
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";

interface TopNavigationProps {
  schedule: DaySchedule[];
  currentDay: number;
  completedDays: number[];
  onDayClick: (day: number) => void;
  onBack: () => void;
  courseTopic?: string;
  showOverview?: boolean;
  onOverviewClick?: () => void;
}

export function TopNavigation({ 
  schedule, 
  currentDay, 
  completedDays,
  onDayClick,
  onBack,
  showOverview = true,
  onOverviewClick,
}: TopNavigationProps) {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  
  // --- Summary Dialog State ---
  const [summaryOpen, setSummaryOpen] = useState(false);
  const [summaryContent, setSummaryContent] = useState<string[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [activeSummaryTopic, setActiveSummaryTopic] = useState<string>("");

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      const activeItem = container.querySelector(`[data-topic="${currentDay}"]`);
      if (activeItem) {
        activeItem.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
      }
    }
  }, [currentDay]);

  const scroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (container) {
      const scrollAmount = 300;
      container.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleViewSummary = async (item: DaySchedule) => {
    setSummaryOpen(true);
    setActiveSummaryTopic(item.focus_topic);
    
    // Reset content and start loading
    setSummaryContent([]);
    setLoadingSummary(true);

    try {
      const response = await fetch('http://127.0.0.1:8001/generate-day-summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
              topic: item.focus_topic, 
              day_number: item.day 
          }),
      });

      if (response.ok) {
          const data = await response.json();
          setSummaryContent(data.summary_points || []);
      } else {
          setSummaryContent(["Unable to load summary at this time."]);
      }
    } catch (error) {
      console.error(error);
      setSummaryContent(["Error connecting to server."]);
    } finally {
      setLoadingSummary(false);
    }
  };

  const TopicButton = ({ item, isActive, isCompleted }: { item: DaySchedule, isActive: boolean, isCompleted: boolean }) => (
    <TooltipProvider>
      <Tooltip delayDuration={300}>
        <TooltipTrigger asChild>
          <motion.button
            data-topic={item.day}
            onClick={() => onDayClick(item.day)}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`
              relative flex-shrink-0 flex flex-col items-start justify-center px-4 py-2
              w-40 h-14 rounded-lg border transition-all snap-center text-left
              ${isActive 
                ? 'bg-amber-500 border-amber-500 text-white shadow-md' 
                : isCompleted
                  ? 'bg-green-50 border-green-200 text-green-900'
                  : 'bg-white border-stone-200 text-stone-600 hover:border-amber-300 hover:bg-stone-50'
              }
            `}
          >
            <div className="flex items-center gap-2 w-full">
              <span className={`text-[10px] font-bold uppercase tracking-wider ${isActive ? 'text-amber-100' : 'text-stone-400'}`}>
                {isActive ? 'Current Topic' : `Topic ${item.day}`}
              </span>
              {isCompleted && !isActive && (
                <div className="w-2 h-2 bg-green-500 rounded-full ml-auto" />
              )}
            </div>
            
            <span className="text-sm font-semibold leading-tight w-full truncate">
              {item.focus_topic}
            </span>
          </motion.button>
        </TooltipTrigger>
        <TooltipContent side="bottom" className="max-w-xs bg-stone-900 text-stone-50">
          <p className="font-semibold">{item.focus_topic}</p>
          <p className="text-xs text-stone-400">{item.summary}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );

  return (
    <>
      <div className="bg-white/80 backdrop-blur-md border-b border-stone-200/60 shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4 h-16">
          
          {/* Left: Back & Logo */}
          <div className="flex items-center gap-2">
            <button 
              onClick={onBack}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors group"
            >
              <ArrowLeft className="w-5 h-5 text-stone-500 group-hover:text-stone-900" />
            </button>
            <div className="flex items-center gap-2 border-r border-stone-200 pr-4 h-8 select-none">
              <BookOpen className="w-5 h-5 text-amber-500" />
              <span className="font-display font-bold text-stone-800 hidden sm:inline">LearnBook</span>
            </div>
          </div>

          {/* Middle: Overview */}
          {showOverview && onOverviewClick && (
            <div className="hidden md:flex items-center mr-2 border-r border-stone-200 pr-4 h-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={onOverviewClick}
                className="text-stone-600 hover:text-amber-600 hover:bg-amber-50 h-8 font-medium"
              >
                <LayoutGrid className="w-4 h-4 mr-2" />
                Overview
              </Button>
            </div>
          )}

          {/* Right: Topic Scroller */}
          <div className="flex-1 flex items-center gap-2 min-w-0">
            <button onClick={() => scroll('left')} className="p-1 text-stone-400 hover:text-stone-900">
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div 
              ref={scrollContainerRef}
              className="flex-1 overflow-x-auto flex items-center gap-3 py-1 scrollbar-hide snap-x px-1"
              style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
              {schedule.map((item) => {
                const isActive = item.day === currentDay;
                const isCompleted = completedDays.includes(item.day);
                
                if (isCompleted && !isActive) {
                  return (
                    <HoverCard key={item.day} openDelay={0} closeDelay={200}>
                      <HoverCardTrigger asChild>
                          <div>
                          <TopicButton item={item} isActive={isActive} isCompleted={isCompleted} />
                          </div>
                      </HoverCardTrigger>
                      <HoverCardContent className="w-52 p-3 bg-white/95 backdrop-blur-sm border-stone-200 shadow-lg" sideOffset={5}>
                        <div className="flex flex-col gap-2">
                          <p className="text-xs font-semibold text-green-700 text-center flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3 h-3" />
                            Completed
                          </p>
                          <div className="grid gap-1.5">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start h-8 text-xs font-medium hover:bg-amber-50 hover:text-amber-700 border-stone-200"
                              onClick={() => onDayClick(item.day)}
                            >
                              <RotateCcw className="w-3.5 h-3.5 mr-2 text-stone-500" />
                              Start Again
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="w-full justify-start h-8 text-xs font-medium hover:bg-blue-50 hover:text-blue-700 border-stone-200"
                              onClick={() => handleViewSummary(item)}
                            >
                              <FileText className="w-3.5 h-3.5 mr-2 text-stone-500" />
                              Summary
                            </Button>
                          </div>
                        </div>
                      </HoverCardContent>
                    </HoverCard>
                  );
                }
                return (
                  <TopicButton key={item.day} item={item} isActive={isActive} isCompleted={isCompleted} />
                );
              })}
            </div>

            <button onClick={() => scroll('right')} className="p-1 text-stone-400 hover:text-stone-900">
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Summary Popup */}
      <Dialog open={summaryOpen} onOpenChange={setSummaryOpen}>
        <DialogContent className="sm:max-w-lg border-t-4 border-t-amber-500 shadow-2xl bg-white">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display text-stone-900">
              <div className="p-2 bg-amber-100 rounded-lg">
                <FileText className="w-5 h-5 text-amber-600" />
              </div>
              {activeSummaryTopic}
            </DialogTitle>
            <DialogDescription>
              Key takeaways from this topic.
            </DialogDescription>
          </DialogHeader>

          <ScrollArea className="max-h-[60vh] mt-4">
            {loadingSummary ? (
              <div className="flex flex-col items-center justify-center py-12 space-y-4">
                 <Loader2 className="w-8 h-8 animate-spin text-amber-500" />
                 <p className="text-sm text-muted-foreground animate-pulse">Generating summary...</p>
              </div>
            ) : (
              <ul className="space-y-3 px-1">
                {summaryContent.map((point, i) => (
                  <li key={i} className="flex gap-3 text-sm text-stone-700 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
                    <span className="flex-shrink-0 w-5 h-5 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center text-xs font-bold mt-0.5">
                      {i + 1}
                    </span>
                    {point}
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
}