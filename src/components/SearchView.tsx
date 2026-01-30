import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Sprout, Mountain, ShieldCheck, Loader2, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface SearchViewProps {
  onSubmit: (topic: string, expertise: string) => Promise<void>;
}

const expertiseOptions = [
  { label: 'Beginner', subtitle: 'New to this', icon: Sprout, level: 'Beginner' },
  { label: 'Intermediate', subtitle: 'Some exp.', icon: ShieldCheck, level: 'Intermediate' },
  { label: 'Expert', subtitle: 'Deep dive', icon: Mountain, level: 'Expert' },
];

export function SearchView({ onSubmit }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [selectedExpertise, setSelectedExpertise] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setErrorMessage("Please enter a valid topic to start your learning journey.");
      setShowErrorDialog(true);
      return;
    }

    if (!selectedExpertise) {
      setErrorMessage("Please select an expertise level.");
      setShowErrorDialog(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(query.trim(), selectedExpertise);
    } catch (error: any) {
      console.error("Submission error:", error);
      let msg = "We couldn't process that request. Please try a different topic.";
      if (error.response?.data?.detail) {
        msg = error.response.data.detail;
      } else if (error.message) {
        msg = error.message;
      }
      setErrorMessage(msg);
      setShowErrorDialog(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl mx-auto w-full"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20"
        >
          <BookOpen className="w-10 h-10 text-primary" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-display text-4xl md:text-6xl font-bold mb-4 text-foreground"
        >
          Learn<span className="text-gold-gradient">Book</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg text-muted-foreground mb-10 font-body"
        >
          Transform any topic into an interactive learning journey
        </motion.p>

        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-gold/30 to-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-card rounded-xl book-shadow border border-border overflow-hidden">
              <input
                type="text"
                value={query}
                disabled={isSubmitting}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full px-6 py-5 bg-transparent text-lg font-body placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          <div className="mt-8 space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.7, duration: 0.5 }}
              className="flex flex-col md:flex-row items-center justify-center gap-6"
            >
              <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium uppercase tracking-wider w-32 md:justify-end shrink-0">
                <Sparkles className="w-3 h-3" />
                <span>Expertise Level</span>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-3">
                {expertiseOptions.map((option) => {
                  const Icon = option.icon;
                  const isSelected = selectedExpertise === option.level;
                  return (
                    <motion.button
                      key={option.level}
                      type="button"
                      disabled={isSubmitting}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setSelectedExpertise(option.level)}
                      className={`
                        px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300 min-w-[120px]
                        ${isSelected
                          ? 'gold-gradient text-primary-foreground shadow-lg'
                          : 'bg-card border border-border hover:border-primary/50 text-foreground'
                        }
                        ${isSubmitting ? 'opacity-50 cursor-not-allowed' : ''}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      <div className="text-left">
                        <div className="font-semibold text-sm">{option.label}</div>
                        <div className={`text-xs ${isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                          {option.subtitle}
                        </div>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            type="submit"
            disabled={isSubmitting}
            whileHover={{ scale: isSubmitting ? 1 : 1.02 }}
            whileTap={{ scale: isSubmitting ? 1 : 0.98 }}
            className={`
                mt-10 w-full max-w-sm mx-auto py-4 font-semibold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg transition-all
                ${isSubmitting
                ? 'bg-muted text-muted-foreground cursor-wait'
                : 'gold-gradient text-primary-foreground hover:shadow-xl'
              }
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Analyzing Request...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Syllabus</span>
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>

      <AlertDialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <AlertDialogContent className="border-2 border-red-100 bg-white/95 backdrop-blur-xl shadow-2xl max-w-md rounded-2xl">
          <AlertDialogHeader className="items-center text-center">
            <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 ring-8 ring-red-50/50">
              <XCircle className="w-10 h-10 text-red-500" />
            </div>
            <AlertDialogTitle className="text-2xl font-display font-bold text-red-950">
              Request Declined
            </AlertDialogTitle>
            <AlertDialogDescription className="text-base text-stone-600 pt-2 font-medium leading-relaxed px-4">
              {errorMessage}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="sm:justify-center mt-8 pb-2">
            <AlertDialogAction
              onClick={() => setShowErrorDialog(false)}
              className="bg-red-600 hover:bg-red-700 text-white rounded-xl px-10 py-6 text-base font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Okay, I'll try again
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}