import { useState } from 'react';
import { motion } from 'framer-motion';
import { AssessmentQuestion, UserAnswer } from '@/types/course';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';

interface AssessmentViewProps {
  topic: string;
  questions: AssessmentQuestion[];
  onSubmit: (answers: UserAnswer[]) => void;
}

export function AssessmentView({ topic, questions, onSubmit }: AssessmentViewProps) {
  const [answers, setAnswers] = useState<UserAnswer[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSelect = (questionId: number, option: string) => {
    const question = questions.find(q => q.id === questionId);
    if (!question) return;

    setAnswers(prev => {
      const filtered = prev.filter(a => a.question_id !== questionId);
      return [...filtered, {
        question_id: questionId,
        question_text: question.question_text,
        selected_option: option
      }];
    });
  };

  const handleSubmit = () => {
    setIsSubmitting(true);
    onSubmit(answers);
  };

  const isComplete = answers.length === questions.length;

  return (
    <div className="min-h-screen bg-stone-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-display font-bold text-stone-900">Knowledge Check: {topic}</h1>
          <p className="text-stone-500">Answer these few questions so we can tailor the course to your level.</p>
        </div>

        <div className="space-y-6">
          {questions.map((q, idx) => (
            <motion.div
              key={q.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
            >
              <h3 className="text-lg font-medium text-stone-900 mb-4">
                <span className="text-stone-400 mr-2">{idx + 1}.</span>
                {q.question_text}
              </h3>
              <RadioGroup 
                onValueChange={(val) => handleSelect(q.id, val)} 
                className="space-y-3"
              >
                {q.options.map((option, optIdx) => (
                  <div key={optIdx} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-stone-50 border border-transparent hover:border-stone-200 transition-all">
                    <RadioGroupItem value={option} id={`q${q.id}-opt${optIdx}`} />
                    <Label htmlFor={`q${q.id}-opt${optIdx}`} className="flex-1 cursor-pointer font-normal text-stone-700">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            </motion.div>
          ))}
        </div>

        <div className="flex justify-end pt-6">
          <Button 
            size="lg" 
            onClick={handleSubmit} 
            disabled={!isComplete || isSubmitting}
            className="w-full sm:w-auto bg-stone-900 text-white hover:bg-stone-800"
          >
            {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Generate My Plan
          </Button>
        </div>
      </div>
    </div>
  );
}