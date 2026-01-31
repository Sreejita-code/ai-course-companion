import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Mic, Square, Sparkles, Loader2, FileText } from 'lucide-react';
import { Flashcard } from '@/types/course';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface LearnerFlashcardViewProps {
  flashcards: Flashcard[];
  currentIndex: number;
  dayNumber: number;
  topic?: string;
  moduleTitle?: string;
  onNext: () => void;
  onPrevious: () => void;
}

type AnimationPhase = 'blank' | 'title-center' | 'title-moving' | 'content-reveal' | 'complete';

// Keyword Popover Component
const KeywordPopover = ({ word, context }: { word: string, context: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !explanation && !loading) {
      setLoading(true);
      try {
        const response = await fetch('http://127.0.0.1:8000/explain-term', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ term: word, context: context }),
        });
        
        if (!response.ok) throw new Error('Failed to fetch explanation');
        
        const data = await response.json();
        setExplanation(data.explanation);
      } catch (error) {
        console.error(error);
        setExplanation("Could not load explanation.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span 
          className="font-bold text-primary cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors border-b-2 border-primary/30 border-dashed"
          title="Click for explanation"
        >
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-card/95 backdrop-blur-md border-primary/20 shadow-xl z-50">
        <div className="space-y-2">
          <h4 className="font-display font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            {word}
          </h4>
          {loading ? (
            <div className="flex items-center justify-center py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">
              {explanation}
            </p>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// Typewriter Component
const TypewriterText = ({ text }: { text: string }) => {
  const [displayedText, setDisplayedText] = useState("");
  
  useEffect(() => {
    let index = 0;
    setDisplayedText("");
    
    const intervalId = setInterval(() => {
      if (index < text.length) {
        setDisplayedText((prev) => prev + text.charAt(index));
        index++;
      } else {
        clearInterval(intervalId);
      }
    }, 10);

    return () => clearInterval(intervalId);
  }, [text]);

  const lines = displayedText.split('\n');
  
  return (
    <div className="space-y-4">
      {lines.map((line, i) => {
        if (!line.trim()) return null;
        return (
          <p key={i} className="text-lg leading-relaxed text-foreground/90 font-medium">
            {line.split(' ').map((word, w) => {
              const isBold = word.includes('**') && (word.match(/\*\*/g) || []).length >= 2;
              const displayWord = word.replace(/\*\*/g, '');
              return (
                <span key={w} className={isBold ? "font-bold text-primary" : ""}>
                  {displayWord}{' '}
                </span>
              );
            })}
          </p>
        );
      })}
    </div>
  );
};

export function LearnerFlashcardView({
  flashcards,
  currentIndex,
  dayNumber,
  topic = "General",
  moduleTitle,
  onNext,
  onPrevious,
}: LearnerFlashcardViewProps) {
  const [phase, setPhase] = useState<AnimationPhase>('blank');
  const [isPageTurning, setIsPageTurning] = useState(false);
  
  // Audio State
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  
  const audioCache = useRef<Record<string, string>>({});
  const [isAutoPlay, setIsAutoPlay] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Simplify State
  const [simplifyOpen, setSimplifyOpen] = useState(false);
  const [isLoadingSimplify, setIsLoadingSimplify] = useState(false);
  const [simplifiedCache, setSimplifiedCache] = useState<Record<number, string>>({});

  const card = flashcards[currentIndex];
  const isLast = currentIndex === flashcards.length - 1;

  useEffect(() => {
    setPhase('blank');
    stopAudio();
    setSimplifyOpen(false);
    
    const timer1 = setTimeout(() => setPhase('title-center'), 50);
    const timer2 = setTimeout(() => setPhase('title-moving'), 400);
    const timer3 = setTimeout(() => setPhase('content-reveal'), 500);
    const timer4 = setTimeout(() => setPhase('complete'), 1000);
    
    if (isAutoPlay) {
      fetchAndPlayAudio(currentIndex, selectedLanguage);
    }

    if (currentIndex < flashcards.length - 1) {
      prefetchAudio(currentIndex + 1, selectedLanguage);
    }

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      stopAudio();
    };
  }, [currentIndex, isAutoPlay]);

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const getAudioUrl = async (index: number, language: string): Promise<string | null> => {
    const cacheKey = `${index}-${language}`;

    if (audioCache.current[cacheKey]) {
      return audioCache.current[cacheKey];
    }

    try {
      const targetCard = flashcards[index];
      let response;
      
      if (targetCard.audioScript) {
        response = await fetch('http://127.0.0.1:8000/generate-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            text: targetCard.audioScript,
            language: language
          }),
        });
      } else {
        response = await fetch('http://127.0.0.1:8000/generate-detailed-audio', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            title: targetCard.title, 
            content: targetCard.content,
            language: language
          }),
        });
      }

      if (!response.ok) throw new Error('Failed to generate audio');

      const data = await response.json();
      
      const byteCharacters = atob(data.audio);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'audio/wav' });
      const url = URL.createObjectURL(blob);

      audioCache.current[cacheKey] = url;
      return url;

    } catch (error) {
      console.error(`Audio generation failed for card ${index}:`, error);
      return null;
    }
  };

  const prefetchAudio = async (index: number, language: string) => {
    const cacheKey = `${index}-${language}`;
    if (audioCache.current[cacheKey]) return;
    await getAudioUrl(index, language);
  };

  const fetchAndPlayAudio = async (index: number, language: string) => {
    setIsLoadingAudio(true);
    const url = await getAudioUrl(index, language);
    
    if (url) {
      playAudio(url);
    } else {
      setIsAutoPlay(false);
    }
    
    setIsLoadingAudio(false);
  };

  const playAudio = (url: string) => {
    if (!audioRef.current) {
      audioRef.current = new Audio(url);
    } else {
      audioRef.current.src = url;
    }

    audioRef.current.play().catch(e => console.error("Playback error:", e));
    setIsPlaying(true);
    setIsAutoPlay(true);

    audioRef.current.onended = () => {
      stopAudio();
      handleNext();
    };
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    
    if (isPlaying) {
      stopAudio();
    }
    fetchAndPlayAudio(currentIndex, lang);
  };

  const toggleStop = () => {
    setIsAutoPlay(false);
    stopAudio();
  };

  const handleSimplify = async () => {
    setSimplifyOpen(true);
    if (isPlaying) toggleStop();

    if (simplifiedCache[currentIndex]) {
      return;
    }

    try {
      setIsLoadingSimplify(true);
      const response = await fetch('http://127.0.0.1:8000/simplify-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: card.content }),
      });

      if (!response.ok) throw new Error('Failed to simplify content');

      const data = await response.json();
      let cleanText = data.simplified_text;

      if (typeof cleanText === 'string') {
        let content = cleanText.trim();
        if (content.startsWith('[') && content.endsWith(']')) {
          try {
            let inner = content.slice(1, -1);
            inner = inner.replace(/['"]\s*,\s*['"]/g, '\n');
            inner = inner.replace(/^['"]/, '').replace(/['"]$/, '');
            cleanText = inner;
          } catch(e) { /* ignore */ }
        }
      }
      
      setSimplifiedCache(prev => ({
        ...prev,
        [currentIndex]: cleanText
      }));
    } catch (error) {
      console.error('Simplification failed:', error);
    } finally {
      setIsLoadingSimplify(false);
    }
  };

  const handleNext = () => {
    stopAudio();
    setIsPageTurning(true);
    setTimeout(() => {
      setIsPageTurning(false);
      onNext();
    }, 600);
  };

  const handlePrevious = () => {
    stopAudio();
    onPrevious();
  };

  const renderContent = () => {
    let textToRender = card.content;
    
    if (Array.isArray(textToRender)) {
      textToRender = textToRender.join('\n\n');
    }

    if (phase === 'content-reveal' || phase === 'complete') {
      return <TypewriterText text={textToRender} />;
    }

    return null;
  };

  const languages = ["English", "Hindi", "Spanish", "French", "German", "Japanese", "Mandarin"];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-6 relative">
      {/* Background gradient */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-20 right-10 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-20 left-10 w-72 h-72 bg-gold/5 rounded-full blur-3xl" />
      </div>

      {/* Progress indicator */}
      <div className="w-full max-w-2xl mb-6">
        <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
          <span>{moduleTitle || topic}</span>
          <span>{currentIndex + 1} / {flashcards.length}</span>
        </div>
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-primary rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Flashcard */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, rotateY: 90 }}
          animate={{ opacity: 1, rotateY: 0 }}
          exit={{ opacity: 0, rotateY: -90 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-2xl"
        >
          <div className="bg-card border border-border rounded-2xl shadow-xl p-8 min-h-[400px] flex flex-col">
            {/* Title */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ 
                opacity: phase !== 'blank' ? 1 : 0, 
                y: phase !== 'blank' ? 0 : 20 
              }}
              className="mb-6"
            >
              <div className="flex items-center gap-3 mb-2">
                <span className="text-3xl">{card.flashcard_emoji || '📚'}</span>
                <h2 className="font-display text-2xl font-bold text-foreground">
                  {card.title}
                </h2>
              </div>
              <div className="h-1 w-20 bg-gradient-to-r from-primary to-gold rounded-full" />
            </motion.div>

            {/* Content */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'content-reveal' || phase === 'complete' ? 1 : 0 }}
              className="flex-1"
            >
              <ScrollArea className="h-[250px] pr-4">
                {renderContent()}
              </ScrollArea>
            </motion.div>

            {/* Action buttons */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: phase === 'complete' ? 1 : 0 }}
              className="flex items-center justify-between mt-6 pt-4 border-t border-border"
            >
              {/* Left side - Audio controls */}
              <div className="flex items-center gap-2">
                {isPlaying ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleStop}
                    className="gap-2"
                  >
                    <Square className="w-4 h-4" />
                    Stop
                  </Button>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" className="gap-2" disabled={isLoadingAudio}>
                        {isLoadingAudio ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                        Listen
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      {languages.map(lang => (
                        <DropdownMenuItem key={lang} onClick={() => handleLanguageSelect(lang)}>
                          {lang}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleSimplify}
                  className="gap-2 text-muted-foreground"
                >
                  <Sparkles className="w-4 h-4" />
                  Simplify
                </Button>
              </div>

              {/* Right side - Navigation */}
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                <Button
                  onClick={handleNext}
                  className="gap-2 gold-gradient text-primary-foreground"
                >
                  {isLast ? 'Complete' : 'Next'}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Simplify Dialog */}
      <Dialog open={simplifyOpen} onOpenChange={setSimplifyOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-primary" />
              Simplified Explanation
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[300px]">
            {isLoadingSimplify ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <div className="text-foreground/90 leading-relaxed whitespace-pre-wrap">
                {simplifiedCache[currentIndex] || 'Loading...'}
              </div>
            )}
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}
