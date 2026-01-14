import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Clock, Zap, GraduationCap, Trophy } from 'lucide-react';

interface SearchViewProps {
  onSubmit: (prompt: string) => void;
}

const durationOptions = [
  { label: '3 Days', subtitle: 'Crash Course', icon: Zap, days: 3 },
  { label: '7 Days', subtitle: 'Standard', icon: GraduationCap, days: 7 },
  { label: '30 Days', subtitle: 'Mastery', icon: Trophy, days: 30 },
];

export function SearchView({ onSubmit }: SearchViewProps) {
  const [query, setQuery] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      // If no duration selected and no duration detected in query, default to 7 days
      const hasDuration = /\d+\s*(day|days|week|weeks|month)/i.test(query);
      let finalPrompt = query.trim();
      
      if (!hasDuration && selectedDuration) {
        finalPrompt = `${query.trim()} for ${selectedDuration} days`;
      } else if (!hasDuration && !selectedDuration) {
        finalPrompt = `${query.trim()} for 7 days`;
      }
      
      onSubmit(finalPrompt);
    }
  };

  const handleDurationClick = (days: number) => {
    setSelectedDuration(days);
  };

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
            <div className="relative bg-card rounded-xl book-shadow border border-border overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you want to learn?"
                className="w-full px-6 py-5 bg-transparent text-lg font-body placeholder:text-muted-foreground focus:outline-none"
              />
            </div>
          </div>

          {/* Duration Chips */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="mt-6 flex flex-wrap justify-center gap-3"
          >
            <div className="flex items-center gap-2 text-muted-foreground mr-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Duration:</span>
            </div>
            {durationOptions.map((option, i) => {
              const Icon = option.icon;
              const isSelected = selectedDuration === option.days;
              
              return (
                <motion.button
                  key={option.days}
                  type="button"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.7 + i * 0.1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => handleDurationClick(option.days)}
                  className={`
                    px-4 py-2.5 rounded-xl flex items-center gap-2 transition-all duration-300
                    ${isSelected 
                      ? 'gold-gradient text-primary-foreground shadow-lg' 
                      : 'bg-card border border-border hover:border-primary/50 text-foreground'
                    }
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
          </motion.div>

          {/* Generate Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.5 }}
            type="submit"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="mt-8 w-full max-w-sm mx-auto py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-shadow"
          >
            <Sparkles className="w-5 h-5" />
            <span>Generate Course</span>
          </motion.button>
        </motion.form>

        {/* Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground">Try:</span>
          {['Python programming', 'Machine Learning', 'Web Development'].map((example, i) => (
            <motion.button
              key={example}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 1.1 + i * 0.1 }}
              onClick={() => setQuery(example)}
              className="px-3 py-1.5 text-sm bg-secondary hover:bg-accent text-secondary-foreground rounded-full transition-colors font-body"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
