import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, GraduationCap, BookOpen, Sparkles } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

interface SyllabusViewProps {
  topic: string;
  expertise: string;
  syllabus: string[];
  onContinue: () => void;
}

export function SyllabusView({ topic, expertise, syllabus, onContinue }: SyllabusViewProps) {
  const [remainingItems, setRemainingItems] = useState<string[]>(syllabus);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());

  const handleCheck = (item: string) => {
    setCheckedItems(prev => new Set(prev).add(item));
    
    // Remove item after animation completes
    setTimeout(() => {
      setRemainingItems(prev => prev.filter(i => i !== item));
    }, 400);
  };

  const allCompleted = remainingItems.length === 0;
  const progress = ((syllabus.length - remainingItems.length) / syllabus.length) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Header */}
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="pt-12 pb-8 px-6"
      >
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6"
          >
            <GraduationCap className="w-8 h-8 text-primary" />
          </motion.div>
          
          <motion.h1
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-3xl md:text-4xl font-display font-bold text-foreground mb-3"
          >
            {topic}
          </motion.h1>
          
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/50 text-accent-foreground"
          >
            <BookOpen className="w-4 h-4" />
            <span className="text-sm font-medium">{expertise} Level</span>
          </motion.div>

          {/* Progress Bar */}
          <motion.div
            initial={{ opacity: 0, scaleX: 0 }}
            animate={{ opacity: 1, scaleX: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 max-w-md mx-auto"
          >
            <div className="flex justify-between text-sm text-muted-foreground mb-2">
              <span>Progress</span>
              <span>{Math.round(progress)}% Complete</span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </motion.div>
        </div>
      </motion.header>

      {/* Main Content */}
      <main className="flex-1 px-6 pb-24">
        <div className="max-w-2xl mx-auto">
          <AnimatePresence mode="popLayout">
            {allCompleted ? (
              <motion.div
                key="completed"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className="text-center py-16"
              >
                <motion.div
                  animate={{ 
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.1, 1]
                  }}
                  transition={{ 
                    duration: 0.6,
                    repeat: Infinity,
                    repeatDelay: 2
                  }}
                  className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/20 mb-6"
                >
                  <Sparkles className="w-10 h-10 text-primary" />
                </motion.div>
                <h2 className="text-2xl font-display font-bold text-foreground mb-3">
                  Syllabus Complete!
                </h2>
                <p className="text-muted-foreground mb-8">
                  You've reviewed all topics. Ready to start learning?
                </p>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onContinue}
                  className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground rounded-xl font-semibold shadow-lg hover:shadow-xl transition-shadow"
                >
                  Start Learning
                  <ChevronRight className="w-5 h-5" />
                </motion.button>
              </motion.div>
            ) : (
              <motion.ul layout className="space-y-3">
                {remainingItems.map((item, index) => {
                  const isChecked = checkedItems.has(item);
                  
                  return (
                    <motion.li
                      key={item}
                      layout
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ 
                        opacity: isChecked ? 0 : 1, 
                        scale: isChecked ? 0.95 : 1,
                        x: 0
                      }}
                      exit={{ opacity: 0, scale: 0.95, x: 20 }}
                      transition={{ 
                        duration: 0.3,
                        delay: isChecked ? 0 : index * 0.05,
                        layout: { duration: 0.3 }
                      }}
                    >
                      <motion.div
                        whileHover={{ scale: 1.01, x: 4 }}
                        className={`
                          group flex items-center gap-4 p-4 rounded-xl
                          bg-card border border-border/50
                          hover:border-primary/30 hover:shadow-md
                          transition-all duration-200 cursor-pointer
                          ${isChecked ? 'pointer-events-none' : ''}
                        `}
                        onClick={() => !isChecked && handleCheck(item)}
                      >
                        {/* Custom Checkbox */}
                        <div className="relative flex-shrink-0">
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handleCheck(item)}
                            className="w-6 h-6 rounded-lg border-2 border-primary/30 data-[state=checked]:bg-primary data-[state=checked]:border-primary transition-all"
                          />
                        </div>

                        {/* Topic Number */}
                        <span className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-semibold text-primary">
                          {index + 1}
                        </span>

                        {/* Topic Text */}
                        <span className="flex-1 text-foreground font-medium group-hover:text-primary transition-colors">
                          {item}
                        </span>

                        {/* Hover Arrow */}
                        <ChevronRight className="w-5 h-5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </motion.div>
                    </motion.li>
                  );
                })}
              </motion.ul>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Floating Continue Button */}
      {!allCompleted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="fixed bottom-8 right-8"
        >
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={onContinue}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-full font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Continue
            <ChevronRight className="w-5 h-5" />
          </motion.button>
        </motion.div>
      )}
    </div>
  );
}
