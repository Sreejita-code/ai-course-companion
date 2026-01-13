import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';

interface SearchViewProps {
  onSubmit: (prompt: string) => void;
}

export function SearchView({ onSubmit }: SearchViewProps) {
  const [query, setQuery] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSubmit(query.trim());
    }
  };

  const examples = ['Learn AI in 5 days', 'JavaScript basics', 'Photography fundamentals'];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl mx-auto"
      >
        {/* Logo/Icon */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-8 inline-flex items-center justify-center w-20 h-20 rounded-full bg-primary/10 border border-primary/20"
        >
          <BookOpen className="w-10 h-10 text-primary" />
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="font-display text-5xl md:text-6xl font-bold mb-4 text-foreground"
        >
          Learn<span className="text-gold-gradient">Book</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.6 }}
          className="text-lg md:text-xl text-muted-foreground mb-12 font-body"
        >
          Transform any topic into an interactive learning journey
        </motion.p>

        {/* Search Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xl mx-auto"
        >
          <div className="relative group">
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-gold/30 to-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative flex items-center bg-card rounded-xl book-shadow border border-border overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="flex-1 px-6 py-5 bg-transparent text-lg font-body placeholder:text-muted-foreground focus:outline-none"
              />
              <motion.button
                type="submit"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="m-2 px-6 py-3 gold-gradient text-primary-foreground font-semibold rounded-lg flex items-center gap-2 shadow-lg hover:shadow-xl transition-shadow"
              >
                <Sparkles className="w-5 h-5" />
                <span className="hidden sm:inline">Generate</span>
              </motion.button>
            </div>
          </div>
        </motion.form>

        {/* Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground">Try:</span>
          {examples.map((example, i) => (
            <motion.button
              key={example}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.8 + i * 0.1 }}
              onClick={() => setQuery(example)}
              type="button"
              className="px-4 py-2 text-sm bg-secondary hover:bg-accent text-secondary-foreground rounded-full transition-colors font-body border border-border"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>

        {/* Demo Mode Hint */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
          className="mt-8 text-xs text-muted-foreground/70"
        >
          Requires backend at localhost:8000. Use demo mode for testing →{' '}
          <button
            type="button"
            onClick={() => onSubmit('__DEMO__')}
            className="underline hover:text-primary transition-colors"
          >
            Try Demo
          </button>
        </motion.p>
      </motion.div>
    </div>
  );
}
