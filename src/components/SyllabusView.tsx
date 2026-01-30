import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, GraduationCap, BookOpen, ArrowLeft, Trash2, CheckCircle, Plus, Undo2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { TopicItem } from '@/types/course';

interface SyllabusViewProps {
  topic: string;
  expertise: string;
  syllabus: string[];
  onContinue: (selectedItems: TopicItem[]) => void;
  onBack: () => void;
}

export function SyllabusView({ topic, expertise, syllabus, onContinue, onBack }: SyllabusViewProps) {
  // Visible items = The ones the user KEEPS (Needed)
  const [visibleItems, setVisibleItems] = useState<string[]>(syllabus);
  
  // History = The ones the user REMOVED (Not Needed)
  const [history, setHistory] = useState<string[]>([]);
  
  // Toggle for the "Removed Topics" view
  const [showRemoved, setShowRemoved] = useState(false);

  // Progress shows how many items have been reviewed/removed vs total
  const totalItems = syllabus.length;
  const removedCount = history.length;
  const progress = (removedCount / totalItems) * 100;

  // Moves item from Visible -> History (Not Needed)
  const handleRemove = (item: string) => {
    setHistory(prev => [...prev, item]);
    setVisibleItems(prev => prev.filter(i => i !== item));
  };

  // Moves item from History -> Visible (Needed)
  const handleRestore = (item: string) => {
    setHistory(prev => prev.filter(i => i !== item));
    
    // Restore to visible list (sorted by original index to maintain syllabus order)
    setVisibleItems(prev => {
      const newItems = [...prev, item];
      return newItems.sort((a, b) => syllabus.indexOf(a) - syllabus.indexOf(b));
    });
  };

  const handleNext = () => {
    // Generate the final list with tags
    const neededTopics: TopicItem[] = visibleItems.map(t => ({
      topic: t,
      tag: 'needed'
    }));

    const notNeededTopics: TopicItem[] = history.map(t => ({
      topic: t,
      tag: 'not needed'
    }));

    onContinue([...neededTopics, ...notNeededTopics]);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col relative">
      
      {/* Back Button */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        className="absolute top-6 left-6 z-20"
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={showRemoved ? () => setShowRemoved(false) : onBack}
          className="rounded-full hover:bg-background/80 hover:shadow-sm"
        >
          <ArrowLeft className="w-6 h-6 text-muted-foreground" />
        </Button>
      </motion.div>

      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="pt-12 pb-8 px-6"
      >
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <GraduationCap className="w-8 h-8 text-primary" />
          </div>
          
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3">
            {showRemoved ? "Removed Topics" : topic}
          </h1>
          
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground">
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">{expertise} Level</span>
          </div>

          <p className="mt-4 text-muted-foreground">
            {showRemoved 
              ? "These topics are currently excluded (Not Needed). Click to add them back."
              : "Check off topics you don't need. They will be marked as 'Not Needed'."
            }
          </p>

          {!showRemoved && (
            <div className="mt-6 max-w-md mx-auto">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Filtered {removedCount} topics</span>
                <span>{Math.round(progress)}% Excluded</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.5 }}
                />
              </div>
            </div>
          )}
        </div>
      </motion.header>

      {/* Main Content List */}
      <main className="flex-1 px-6 pb-32">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {(showRemoved ? history : visibleItems).length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center py-12 text-muted-foreground"
              >
                <p className="text-lg font-medium">
                  {showRemoved ? "No topics have been removed." : "All topics removed!"}
                </p>
                <p>
                  {showRemoved ? "Go back to filter your plan." : "Check 'Removed Topics' to restore them."}
                </p>
              </motion.div>
            ) : (
              <motion.ul className="space-y-3">
                {(showRemoved ? history : visibleItems).map((item) => (
                  <motion.li
                    key={item}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 50, scale: 0.9 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  >
                    <motion.div
                      whileHover={{ scale: 1.01, x: 4 }}
                      className={`
                        group flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer
                        ${showRemoved 
                           ? "bg-slate-50 border-slate-200 opacity-60 hover:opacity-100" // "Blur" effect
                           : "bg-card border-border/50 hover:border-primary/30 hover:shadow-md"
                        }
                      `}
                      onClick={() => showRemoved ? handleRestore(item) : handleRemove(item)}
                    >
                      <div className="relative flex-shrink-0">
                        {showRemoved ? (
                           // In removed view: Clicking "Plus" adds it back
                           <div className="w-6 h-6 rounded-lg border-2 border-green-300 flex items-center justify-center bg-green-100">
                             <Plus className="w-4 h-4 text-green-700" />
                           </div>
                        ) : (
                           // In main view: Clicking Checkbox "Removes" it
                           <Checkbox checked={false} className="w-6 h-6 rounded-lg border-2 border-primary/30 pointer-events-none" />
                        )}
                      </div>
                      
                      <span className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-semibold
                        ${showRemoved 
                           ? "bg-slate-200 text-slate-500" 
                           : "bg-primary/10 text-primary"
                        }
                      `}>
                        {syllabus.indexOf(item) + 1}
                      </span>

                      <span className={`flex-1 font-medium transition-colors
                        ${showRemoved ? "text-slate-500 line-through decoration-slate-300" : "text-foreground group-hover:text-primary"}
                      `}>
                        {item}
                      </span>
                      
                      {/* Explicit "Add Back" text for clarity in Removed View */}
                      {showRemoved && (
                         <span className="text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">
                             Add Back
                         </span>
                      )}
                    </motion.div>
                  </motion.li>
                ))}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Footer Actions */}
      <div className="fixed bottom-8 w-full px-8 pointer-events-none">
        <div className="max-w-4xl mx-auto flex justify-between items-center pointer-events-auto">
          
          {showRemoved ? (
             // Done Button (Back to Main View)
             <Button 
                variant="default" 
                size="lg" 
                onClick={() => setShowRemoved(false)} 
                className="rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground gap-2 px-8 w-full md:w-auto ml-auto"
             >
                <CheckCircle className="w-5 h-5" />
                Done Reviewing
             </Button>
          ) : (
            // Main View Actions
            <>
              {/* See Removed Topics Button */}
              <motion.div animate={{ opacity: history.length > 0 ? 1 : 0, y: history.length > 0 ? 0 : 20 }}>
                <Button 
                    variant="outline" 
                    size="lg" 
                    onClick={() => setShowRemoved(true)} 
                    disabled={history.length === 0}
                    className="rounded-full shadow-md bg-background/80 backdrop-blur-sm gap-2 border-slate-200 text-slate-600 hover:bg-slate-100"
                >
                    <Undo2 className="w-4 h-4" />
                    Review Removed ({history.length})
                </Button>
              </motion.div>

              {/* Generate Plan Button */}
              <Button 
                size="lg" 
                onClick={handleNext}
                disabled={visibleItems.length === 0}
                className="rounded-full shadow-lg hover:shadow-xl bg-primary text-primary-foreground gap-2 px-8"
              >
                Generate Plan
                <ChevronRight className="w-5 h-5" />
              </Button>
            </>
          )}
          
        </div>
      </div>
    </div>
  );
}