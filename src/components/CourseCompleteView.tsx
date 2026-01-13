import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Sparkles, RotateCcw } from 'lucide-react';

interface CourseCompleteViewProps {
  topic: string;
  totalDays: number;
  onRestart: () => void;
}

interface Confetti {
  id: number;
  x: number;
  delay: number;
  color: string;
}

export function CourseCompleteView({ topic, totalDays, onRestart }: CourseCompleteViewProps) {
  const [confetti, setConfetti] = useState<Confetti[]>([]);

  useEffect(() => {
    const colors = ['#F59E0B', '#EAB308', '#D97706', '#FBBF24', '#FCD34D'];
    const particles: Confetti[] = [];
    
    for (let i = 0; i < 50; i++) {
      particles.push({
        id: i,
        x: Math.random() * 100,
        delay: Math.random() * 2,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    
    setConfetti(particles);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-8 overflow-hidden relative">
      {/* Confetti */}
      {confetti.map((particle) => (
        <motion.div
          key={particle.id}
          initial={{ y: -20, x: `${particle.x}vw`, opacity: 1 }}
          animate={{ y: '100vh', opacity: 0 }}
          transition={{
            duration: 3,
            delay: particle.delay,
            ease: 'easeIn',
          }}
          className="absolute top-0 w-3 h-3 rounded-sm"
          style={{
            backgroundColor: particle.color,
            left: 0,
          }}
        />
      ))}

      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-lg text-center relative z-10"
      >
        {/* Trophy Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, type: 'spring', stiffness: 150 }}
          className="mb-8 inline-flex items-center justify-center w-32 h-32 rounded-full gold-gradient shadow-2xl relative"
        >
          <Trophy className="w-16 h-16 text-primary-foreground" />
          
          {/* Sparkles around trophy */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            className="absolute inset-0"
          >
            {[0, 60, 120, 180, 240, 300].map((angle) => (
              <motion.div
                key={angle}
                animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2, repeat: Infinity, delay: angle / 360 }}
                className="absolute"
                style={{
                  top: '50%',
                  left: '50%',
                  transform: `rotate(${angle}deg) translateY(-50px)`,
                }}
              >
                <Sparkles className="w-4 h-4 text-gold" />
              </motion.div>
            ))}
          </motion.div>
        </motion.div>

        {/* Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="font-display text-4xl md:text-5xl font-bold mb-4"
        >
          <span className="text-gold-gradient">Congratulations!</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="font-display text-2xl md:text-3xl font-semibold text-foreground mb-4"
        >
          Course Completed!
        </motion.h2>

        {/* Message */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="text-lg text-muted-foreground mb-8 font-body"
        >
          You've successfully completed the{' '}
          <span className="font-semibold text-foreground">{topic}</span> course in{' '}
          <span className="font-semibold text-primary">{totalDays} days</span>!
        </motion.p>

        {/* Stats Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="bg-card rounded-2xl book-shadow border border-border p-6 mb-8"
        >
          <div className="flex items-center justify-center gap-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-primary font-display">{totalDays}</div>
              <div className="text-sm text-muted-foreground">Days Completed</div>
            </div>
            <div className="w-px h-12 bg-border" />
            <div className="text-center">
              <div className="text-3xl font-bold text-gold font-display">100%</div>
              <div className="text-sm text-muted-foreground">Progress</div>
            </div>
          </div>
        </motion.div>

        {/* Thank You */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-muted-foreground mb-8 font-body"
        >
          Thank you for learning with LearnBook! 📚
        </motion.p>

        {/* Restart Button */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onRestart}
          className="px-8 py-4 bg-secondary hover:bg-accent text-secondary-foreground font-semibold text-lg rounded-xl flex items-center justify-center gap-3 mx-auto transition-colors"
        >
          <RotateCcw className="w-5 h-5" />
          <span>Start New Course</span>
        </motion.button>
      </motion.div>
    </div>
  );
}
