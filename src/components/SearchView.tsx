import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Loader2, XCircle, Settings } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { PersonaDialog, PersonaData } from './PersonaDialog';

interface SearchViewProps {
  onSubmit: (topic: string, persona?: PersonaData) => Promise<void>;
}

export function SearchView({ onSubmit }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [persona, setPersona] = useState<PersonaData>({});
  const [personaDialogOpen, setPersonaDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showErrorDialog, setShowErrorDialog] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const hasPersona = Object.values(persona).some(v => v && v.trim());

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!query.trim()) {
      setErrorMessage("Please enter a valid topic to start your learning journey.");
      setShowErrorDialog(true);
      return;
    }

    setIsSubmitting(true);

    try {
      await onSubmit(query.trim(), hasPersona ? persona : undefined);
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
                placeholder="What do you want to teach?"
                className="w-full px-6 py-5 bg-transparent text-lg font-body placeholder:text-muted-foreground focus:outline-none disabled:opacity-50"
              />
            </div>
          </div>

          {/* Persona Customization */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            className="mt-6 flex flex-col items-center gap-4"
          >
            <Button
              type="button"
              variant={hasPersona ? "default" : "outline"}
              onClick={() => setPersonaDialogOpen(true)}
              disabled={isSubmitting}
              className={`
                gap-2 rounded-xl transition-all
                ${hasPersona 
                  ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/20' 
                  : 'hover:border-primary/50'
                }
              `}
            >
              <Settings className="w-4 h-4" />
              {hasPersona ? 'Persona Configured' : 'Customize Persona'}
              {hasPersona && (
                <span className="ml-1 px-2 py-0.5 bg-primary/20 rounded-full text-xs">
                  Active
                </span>
              )}
            </Button>

            {hasPersona && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-wrap justify-center gap-2 text-xs"
              >
                {persona.target_audience && (
                  <span className="px-3 py-1 bg-card border border-border rounded-full text-muted-foreground">
                    👥 {persona.target_audience}
                  </span>
                )}
                {persona.tone && (
                  <span className="px-3 py-1 bg-card border border-border rounded-full text-muted-foreground capitalize">
                    💬 {persona.tone}
                  </span>
                )}
                {persona.learning_goal && (
                  <span className="px-3 py-1 bg-card border border-border rounded-full text-muted-foreground">
                    🎯 Goal set
                  </span>
                )}
              </motion.div>
            )}
          </motion.div>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            type="submit"
            disabled={isSubmitting}
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
                <span>Generating Syllabus...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Course</span>
              </>
            )}
          </motion.button>
        </motion.form>
      </motion.div>

      {/* Persona Dialog */}
      <PersonaDialog
        open={personaDialogOpen}
        onOpenChange={setPersonaDialogOpen}
        persona={persona}
        onSave={setPersona}
      />

      {/* Error Dialog */}
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
