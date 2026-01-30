import { motion, Variants } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface BookPageProps {
  children: ReactNode;
  zIndex: number;
  direction: number;
  className?: string;
}

const pageVariants: Variants = {
  enter: (direction: number) => ({
    rotateY: direction > 0 ? 90 : -90,
    opacity: 0,
  }),
  center: {
    rotateY: 0,
    opacity: 1,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: (direction: number) => ({
    rotateY: direction > 0 ? -90 : 90,
    opacity: 0,
    transition: {
      duration: 0.6,
      ease: [0.16, 1, 0.3, 1],
    },
  }),
};

export function BookPage({ children, zIndex, direction, className }: BookPageProps) {
  return (
    <motion.div
      custom={direction}
      variants={pageVariants}
      initial="enter"
      animate="center"
      exit="exit"
      style={{
        transformOrigin: 'left center',
        transformStyle: 'preserve-3d',
        zIndex,
        position: 'absolute',
        width: '100%',
        height: '100%',
        top: 0,
        left: 0,
        backfaceVisibility: 'hidden',
      }}
      className={cn(
        "bg-[#fdfbf7] text-foreground overflow-hidden", // No scrollbars allowed
        "rounded-r-2xl rounded-l-md",
        "shadow-[0_4px_20px_rgba(0,0,0,0.1),inset_20px_0_30px_-10px_rgba(0,0,0,0.05)]",
        "border border-r-2 border-b-2 border-stone-200/50",
        className
      )}
    >
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-multiply bg-[url('https://grainy-gradients.vercel.app/noise.svg')]" />
      <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-black/5 z-20" />
      <div className="absolute left-[2px] top-0 bottom-0 w-[1px] bg-white/40 z-20" />

      {/* Content Container - Static, no scroll */}
      <div className="relative w-full h-full p-8 md:p-12 overflow-hidden flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}