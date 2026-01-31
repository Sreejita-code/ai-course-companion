import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, ChevronRight, Loader2, CheckCircle2, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { AssessmentQuestion, AssessmentAnswer } from '@/types/learner';

interface AssessmentQuizViewProps {
  topic: string;
  questions: AssessmentQuestion[];
  onComplete: (answers: AssessmentAnswer[]) => void;
}

export function AssessmentQuizView({
  topic,
  questions,
  onComplete,
}: AssessmentQuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<AssessmentAnswer[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex) / questions.length) * 100;
  const isLastQuestion = currentIndex === questions.length - 1;

  const handleSelectOption = (option: string) => {
    setSelectedOption(option);
  };

  const handleNext = () => {
    if (!selectedOption || !currentQuestion) return;

    const newAnswer: AssessmentAnswer = {
      question_id: currentQuestion.id,
      question_text: currentQuestion.question_text,
      selected_option: selectedOption,
    };

    const updatedAnswers = [...answers, newAnswer];
    setAnswers(updatedAnswers);

    if (isLastQuestion) {
      setIsSubmitting(true);
      onComplete(updatedAnswers);
    } else {
      setSelectedOption(null);
      setCurrentIndex(prev => prev + 1);
    }
  };

  if (!currentQuestion) return null;

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8 bg-gradient-to-b from-background to-muted/20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl mx-auto"
      >
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 border border-primary/20 mb-4">
            <Brain className="w-7 h-7 text-primary" />
          </div>
          <h1 className="font-display text-2xl font-bold text-foreground mb-2">
            Quick Assessment
          </h1>
          <p className="text-muted-foreground text-sm">
            Let's understand your current knowledge of <span className="font-semibold text-foreground">{topic}</span>
          </p>
        </div>

        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">
              Question {currentIndex + 1} of {questions.length}
            </span>
            <span className="font-semibold text-primary">
              {Math.round(progress)}% Complete
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question Card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3 }}
            className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-lg"
          >
            <h2 className="font-display text-xl font-semibold text-foreground mb-6 leading-relaxed">
              {currentQuestion.question_text}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQuestion.options.map((option, idx) => {
                const isSelected = selectedOption === option;
                return (
                  <motion.button
                    key={idx}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => handleSelectOption(option)}
                    className={`
                      w-full text-left p-4 rounded-xl border-2 transition-all flex items-center gap-3
                      ${isSelected 
                        ? 'border-primary bg-primary/5 shadow-md' 
                        : 'border-border hover:border-primary/30 hover:bg-muted/50'
                      }
                    `}
                  >
                    <div className={`
                      w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all
                      ${isSelected 
                        ? 'bg-primary text-primary-foreground' 
                        : 'border-2 border-muted-foreground/30'
                      }
                    `}>
                      {isSelected ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : (
                        <Circle className="w-3 h-3 opacity-0" />
                      )}
                    </div>
                    <span className={`
                      font-medium transition-colors
                      ${isSelected ? 'text-foreground' : 'text-muted-foreground'}
                    `}>
                      {option}
                    </span>
                  </motion.button>
                );
              })}
            </div>

            {/* Next Button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="mt-8 flex justify-end"
            >
              <Button
                size="lg"
                onClick={handleNext}
                disabled={!selectedOption || isSubmitting}
                className="gap-2 px-8 gold-gradient text-primary-foreground"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Analyzing...
                  </>
                ) : isLastQuestion ? (
                  <>
                    Complete Assessment
                    <CheckCircle2 className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Next Question
                    <ChevronRight className="w-5 h-5" />
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </AnimatePresence>

        {/* Skip hint */}
        <p className="text-center text-xs text-muted-foreground mt-6">
          Answer honestly — this helps us personalize your learning experience
        </p>
      </motion.div>
    </div>
  );
}
