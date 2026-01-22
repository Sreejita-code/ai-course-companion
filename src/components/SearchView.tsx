import { useState } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Sparkles } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface SearchViewProps {
  onSubmit: (topic: string, expertise: string) => void;
  isLoading?: boolean;
}

const expertiseOptions = [
  { value: 'Beginner', label: 'Beginner', description: 'New to the topic' },
  { value: 'Intermediate', label: 'Intermediate', description: 'Some experience' },
  { value: 'Advanced', label: 'Advanced', description: 'Deep dive' },
];

export function SearchView({ onSubmit, isLoading = false }: SearchViewProps) {
  const [topic, setTopic] = useState('');
  const [expertise, setExpertise] = useState<string>('Beginner');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim() && expertise) {
      onSubmit(topic.trim(), expertise);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="text-center max-w-2xl mx-auto w-full"
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

        {/* Form */}
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.6 }}
          onSubmit={handleSubmit}
          className="w-full max-w-xl mx-auto space-y-6"
        >
          {/* Topic Input */}
          <div className="relative group">
            <label className="block text-left text-sm font-medium text-muted-foreground mb-2">
              What do you want to learn?
            </label>
            <div className="absolute -inset-1 bg-gradient-to-r from-primary/30 via-gold/30 to-primary/30 rounded-xl blur-lg opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-card rounded-xl book-shadow border border-border overflow-hidden">
              <input
                type="text"
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                placeholder="e.g., Java, Machine Learning, Web Development..."
                className="w-full px-6 py-4 bg-transparent text-lg font-body placeholder:text-muted-foreground focus:outline-none"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Expertise Dropdown */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.5 }}
          >
            <label className="block text-left text-sm font-medium text-muted-foreground mb-2">
              Your expertise level
            </label>
            <Select value={expertise} onValueChange={setExpertise} disabled={isLoading}>
              <SelectTrigger className="w-full h-14 px-6 bg-card border-border rounded-xl text-lg font-body book-shadow focus:ring-primary/30">
                <SelectValue placeholder="Select your level" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-xl">
                {expertiseOptions.map((option) => (
                  <SelectItem
                    key={option.value}
                    value={option.value}
                    className="py-3 px-4 cursor-pointer hover:bg-accent focus:bg-accent rounded-lg"
                  >
                    <div className="flex flex-col items-start">
                      <span className="font-semibold">{option.label}</span>
                      <span className="text-sm text-muted-foreground">{option.description}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </motion.div>

          {/* Generate Button */}
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.5 }}
            type="submit"
            disabled={!topic.trim() || isLoading}
            whileHover={{ scale: isLoading ? 1 : 1.02 }}
            whileTap={{ scale: isLoading ? 1 : 0.98 }}
            className={`
              mt-4 w-full py-4 gold-gradient text-primary-foreground font-semibold text-lg rounded-xl 
              flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {isLoading ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                  className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full"
                />
                <span>Generating...</span>
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                <span>Generate Course</span>
              </>
            )}
          </motion.button>
        </motion.form>

        {/* Quick Examples */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-10 flex flex-wrap justify-center gap-3"
        >
          <span className="text-sm text-muted-foreground">Try:</span>
          {['Python', 'React', 'Machine Learning', 'Data Science'].map((example, i) => (
            <motion.button
              key={example}
              type="button"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.9 + i * 0.1 }}
              onClick={() => setTopic(example)}
              disabled={isLoading}
              className="px-3 py-1.5 text-sm bg-secondary hover:bg-accent text-secondary-foreground rounded-full transition-colors font-body disabled:opacity-50"
            >
              {example}
            </motion.button>
          ))}
        </motion.div>
      </motion.div>
    </div>
  );
}
