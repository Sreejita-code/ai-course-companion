import { motion } from 'framer-motion';
import { BookOpen } from 'lucide-react';

interface LoadingViewProps {
  message: string;
}

export function LoadingView({ message }: LoadingViewProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        {/* Animated Book */}
        <motion.div
          animate={{
            rotateY: [0, 10, 0, -10, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="relative inline-block mb-8"
        >
          <div className="w-32 h-40 bg-book-spine rounded-l-md rounded-r-lg book-shadow relative overflow-hidden">
            {/* Book Cover */}
            <div className="absolute inset-1 inset-l-2 bg-card rounded-r-md page-texture flex items-center justify-center">
              <BookOpen className="w-12 h-12 text-primary" />
            </div>
            
            {/* Gold Trim */}
            <div className="absolute right-0 top-0 bottom-0 w-1 gold-gradient" />
            
            {/* Page Lines */}
            <motion.div
              animate={{ x: [0, 2, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute right-1 top-2 bottom-2 w-2 flex flex-col gap-0.5"
            >
              {[...Array(8)].map((_, i) => (
                <div key={i} className="flex-1 bg-muted/30 rounded-full" />
              ))}
            </motion.div>
          </div>
        </motion.div>

        {/* Loading Text */}
        <motion.h2
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="font-display text-2xl font-semibold text-foreground mb-4"
        >
          {message}
        </motion.h2>

        {/* Progress Dots */}
        <div className="flex justify-center gap-2">
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.3, 1, 0.3],
              }}
              transition={{
                duration: 1.2,
                repeat: Infinity,
                delay: i * 0.2,
              }}
              className="w-3 h-3 rounded-full gold-gradient"
            />
          ))}
        </div>

        {/* Shimmer Bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-8 w-64 h-2 bg-muted rounded-full overflow-hidden mx-auto"
        >
          <motion.div
            className="h-full w-1/2 gold-gradient rounded-full"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.div>
      </motion.div>
    </div>
  );
}
