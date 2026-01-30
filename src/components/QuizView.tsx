import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, XCircle, ArrowRight, Trophy, SkipForward, RotateCcw, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { QuizQuestion } from '@/types/course';
import { Progress } from '@/components/ui/progress';

interface QuizViewProps {
  questions: QuizQuestion[];
  onComplete: () => void;
  onSkip: () => void;
  onRestart: () => void; // New Prop
}

export function QuizView({ questions, onComplete, onSkip, onRestart }: QuizViewProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];
  const isCorrect = selectedOption === currentQuestion.correct_index;

  const handleOptionClick = (index: number) => {
    if (isAnswered) return;
    
    setSelectedOption(index);
    setIsAnswered(true);

    if (index === currentQuestion.correct_index) {
      setScore(prev => prev + 1);
      setTimeout(() => {
        handleNext(true);
      }, 1500);
    }
  };

  const handleNext = (auto: boolean = false) => {
    if (!auto && !isAnswered) return; 

    if (currentIndex < questions.length - 1) {
      setSelectedOption(null);
      setIsAnswered(false);
      setCurrentIndex(prev => prev + 1);
    } else {
      setShowResult(true);
    }
  };

  // --- RESULT SCREEN LOGIC ---
  if (showResult) {
    const percentage = Math.round((score / questions.length) * 100);
    const passed = percentage >= 70;

    return (
      <div className="flex-1 flex flex-col items-center justify-center p-6 text-center animate-in fade-in duration-500 min-h-[500px]">
        {/* Dynamic Icon & Color */}
        <div className={`mb-8 p-6 rounded-full border-4 ${
            passed 
            ? "bg-yellow-50 border-yellow-100" 
            : "bg-orange-50 border-orange-100"
        }`}>
          {passed ? (
              <Trophy className="w-16 h-16 text-yellow-500" />
          ) : (
              <RotateCcw className="w-16 h-16 text-orange-500" />
          )}
        </div>

        {/* Dynamic Title */}
        <h2 className="text-3xl font-display font-bold text-gray-900 mb-2">
            {passed ? "Quiz Complete!" : "Keep Practicing"}
        </h2>
        
        {/* Dynamic Message */}
        <p className="text-gray-500 mb-6 max-w-md mx-auto">
            {passed 
                ? "You've mastered the core concepts of this topic." 
                : "It looks like you missed a few key concepts. We recommend reviewing this topic to build a stronger foundation."
            }
        </p>
        
        {/* Score Card */}
        <div className="w-full max-w-xs mb-8">
            <div className="flex justify-between text-sm mb-2 font-medium">
                <span>Score</span>
                <span className={passed ? "text-green-600" : "text-orange-600"}>{percentage}%</span>
            </div>
            <Progress 
                value={percentage} 
                className={`h-3 ${passed ? "bg-gray-100" : "bg-orange-100"}`} 
                // You might need to adjust the indicator color in your global CSS or Progress component if it doesn't support class override directly, 
                // but standard shadcn/ui usually defaults to primary color.
            />
            <p className="mt-2 text-sm text-gray-400">
                {score} out of {questions.length} correct
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 w-full max-w-xs">
            {passed ? (
                // --- PASSING STATE ---
                <Button 
                    onClick={onComplete} 
                    size="lg" 
                    className="gold-gradient text-white px-8 rounded-full shadow-lg hover:shadow-xl transition-all w-full"
                >
                  Continue Learning
                </Button>
            ) : (
                // --- FAILING STATE (<70%) ---
                <>
                    <Button 
                        onClick={onRestart} 
                        size="lg" 
                        className="bg-orange-600 hover:bg-orange-700 text-white px-8 rounded-full shadow-lg transition-all w-full flex items-center justify-center gap-2"
                    >
                        <RotateCcw className="w-4 h-4" />
                        Restart Topic
                    </Button>
                    
                    <Button 
                        onClick={onComplete} 
                        variant="ghost"
                        className="text-gray-400 hover:text-gray-600 w-full"
                    >
                        Move to next topic anyway <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                </>
            )}
        </div>
      </div>
    );
  }

  // --- QUIZ QUESTION VIEW (Unchanged) ---
  return (
    <div className="flex-1 flex flex-col max-w-2xl mx-auto w-full p-4 justify-center min-h-[600px]">
      
      <div className="mb-8 flex items-center justify-between">
        <div>
            <h2 className="text-xl font-bold font-display text-gray-900">Knowledge Check</h2>
            <p className="text-sm text-gray-400">Question {currentIndex + 1} of {questions.length}</p>
        </div>
        <div className="flex items-center gap-3">
             <span className="text-sm font-semibold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                Score: {score}
             </span>
             <Button 
                variant="ghost" 
                size="sm" 
                onClick={onSkip}
                className="text-gray-400 hover:text-red-500 hover:bg-red-50"
             >
                Skip <SkipForward className="w-4 h-4 ml-1" />
             </Button>
        </div>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 md:p-8"
        >
          <h3 className="text-lg md:text-xl font-medium text-gray-800 mb-6 leading-relaxed">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3">
            {currentQuestion.options.map((option, idx) => {
              let stateStyle = "border-gray-200 hover:border-indigo-300 hover:bg-indigo-50";
              
              if (isAnswered) {
                if (idx === currentQuestion.correct_index) {
                    stateStyle = "border-green-500 bg-green-50 text-green-700 font-medium ring-1 ring-green-200";
                } else if (idx === selectedOption) {
                    stateStyle = "border-red-400 bg-red-50 text-red-700 ring-1 ring-red-200";
                } else {
                    stateStyle = "border-gray-100 opacity-40 grayscale";
                }
              } else if (selectedOption === idx) {
                 stateStyle = "border-indigo-500 bg-indigo-50";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionClick(idx)}
                  disabled={isAnswered}
                  className={`w-full text-left p-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group ${stateStyle}`}
                >
                  <span className="flex-1">{option}</span>
                  {isAnswered && idx === currentQuestion.correct_index && (
                    <CheckCircle2 className="w-5 h-5 text-green-600 animate-in zoom-in duration-300" />
                  )}
                  {isAnswered && idx === selectedOption && idx !== currentQuestion.correct_index && (
                    <XCircle className="w-5 h-5 text-red-500 animate-in zoom-in duration-300" />
                  )}
                </button>
              );
            })}
          </div>

          <div className={`mt-6 pt-6 border-t border-gray-100 transition-all duration-500 overflow-hidden ${isAnswered && !isCorrect ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0'}`}>
            <div className="flex flex-col md:flex-row items-start gap-4">
                <div className="shrink-0 mt-1">
                     <div className="p-2 bg-indigo-100 rounded-full">
                        <div className="w-4 h-4 text-indigo-600 font-bold text-xs flex items-center justify-center">i</div>
                     </div>
                </div>
                <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-900 mb-1">
                        Explanation:
                    </p>
                    <p className="text-sm text-gray-600 leading-relaxed">
                        {currentQuestion.explanation}
                    </p>
                </div>
                <Button 
                    onClick={() => handleNext(false)} 
                    className="shrink-0 bg-gray-900 text-white hover:bg-gray-800 rounded-lg px-6 w-full md:w-auto"
                >
                    {currentIndex === questions.length - 1 ? "Finish" : "Next Question"} <ArrowRight className="w-4 h-4 ml-2"/>
                </Button>
            </div>
          </div>
          
          {isAnswered && isCorrect && (
             <div className="mt-4 text-center text-sm text-green-600 font-medium animate-pulse">
                Correct! Moving to next question...
             </div>
          )}

        </motion.div>
      </AnimatePresence>
    </div>
  );
}