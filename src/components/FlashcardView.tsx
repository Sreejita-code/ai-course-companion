import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft, Check, Mic, Square, Sparkles, Loader2, Link2, ExternalLink, FileText, Pencil } from 'lucide-react'; 
import { Flashcard } from '@/types/course';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast"; 
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

interface FlashcardViewProps {
  flashcards: Flashcard[];
  currentIndex: number;
  dayNumber: number;
  topic?: string;
  moduleTitle?: string;
  courseId?: string;
  onNext: () => void;
  onPrevious: () => void;
  onCardUpdate?: (index: number, newContent: string, newAudioScript?: string) => void;
}

type AnimationPhase = 'blank' | 'title-center' | 'title-moving' | 'content-reveal' | 'complete';

// -- Keyword Popover Component --
const KeywordPopover = ({ word, context }: { word: string, context: string }) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);

  const handleOpenChange = async (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && !explanation && !loading) {
      setLoading(true);
      try {
        // Ensure this matches your backend port (8001)
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
        setExplanation("Could not load explanation. Ensure backend is running on port 8001.");
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <span 
          className="font-bold text-[#d97706] cursor-pointer hover:bg-orange-100 rounded px-0.5 transition-colors border-b-2 border-orange-200 border-dashed"
          title="Click for explanation"
        >
          {word}
        </span>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-4 bg-white/95 backdrop-blur-md border-orange-200 shadow-xl z-50">
        <div className="space-y-2">
            <h4 className="font-display font-semibold text-orange-900 flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-orange-500" />
                {word}
            </h4>
            {loading ? (
                <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-400" />
                </div>
            ) : (
                <p className="text-sm text-stone-700 leading-relaxed">
                    {explanation}
                </p>
            )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

// -- Typewriter Component --
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
                  <span key={w} className={isBold ? "font-bold text-indigo-600" : ""}>
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

export function FlashcardView({
  flashcards,
  currentIndex,
  dayNumber,
  topic = "General",
  moduleTitle,
  courseId,
  onNext,
  onPrevious,
  onCardUpdate
}: FlashcardViewProps) {
  const [phase, setPhase] = useState<AnimationPhase>('blank');
  const [isPageTurning, setIsPageTurning] = useState(false);
  const { toast } = useToast();
  
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

  // Reference State
  const [referenceOpen, setReferenceOpen] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState("");
  const [editAudioScript, setEditAudioScript] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const card = flashcards[currentIndex];
  const isLast = currentIndex === flashcards.length - 1;

  useEffect(() => {
    setPhase('blank');
    stopAudio();
    setSimplifyOpen(false); 
    setReferenceOpen(false);
    setIsEditing(false); 
    
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
          // --- UPDATED CODE START ---
          response = await fetch('http://127.0.0.1:8000/generate-audio', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              text: targetCard.audioScript,
              language: language // <--- NOW SENDING LANGUAGE
            }),
          });
          // --- UPDATED CODE END ---
      } else {
          // Fallback logic remains same
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
      console.error(`Audio generation failed for card ${index} (${language}):`, error);
      return null;
    }
  };

  const prefetchAudio = async (index: number, language: string) => {
      const cacheKey = `${index}-${language}`;
      if (audioCache.current[cacheKey]) return; 
      console.log(`Prefetching audio for card ${index} in ${language}...`);
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
      // Updated Port to 8001
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

  const handleDownloadPdf = async () => {
    setIsDownloading(true);
    try {
        // Updated Port to 8001
        const response = await fetch('http://127.0.0.1:8000/generate-pdf', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                title: card.title, 
                content: card.content 
            }),
        });

        if (!response.ok) throw new Error("PDF generation failed");

        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${card.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        
        toast({ title: "Downloaded", description: "Your PDF is ready." });

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not download PDF.", variant: "destructive" });
    } finally {
        setIsDownloading(false);
    }
  };

  const startEditing = () => {
    let textVal = card.content;
    if (Array.isArray(textVal)) textVal = textVal.join('\n');
    setEditContent(textVal);
    setEditAudioScript(card.audioScript || '');
    setIsEditing(true);
    if (isPlaying) stopAudio();
  };

  const saveEdit = async () => {
    setIsSaving(true);
    try {
        if (onCardUpdate) {
            onCardUpdate(currentIndex, editContent, editAudioScript);
        }
        
        setIsEditing(false);
        toast({ title: "Saved", description: "Flashcard updated successfully." });

    } catch (error) {
        console.error(error);
        toast({ title: "Error", description: "Could not save changes.", variant: "destructive" });
    } finally {
        setIsSaving(false);
    }
  };

  // --- CONTENT RENDERING LOGIC ---
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
    if (isEditing) {
        return (
            <div className="h-full flex flex-col gap-4 overflow-y-auto">
                <div className="flex-1 space-y-3">
                    <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">
                            Content Points
                        </label>
                        <Textarea 
                            value={editContent}
                            onChange={(e) => setEditContent(e.target.value)}
                            className="min-h-[120px] text-base leading-relaxed p-3 resize-none border-dashed border-2 border-indigo-200 focus:border-indigo-400"
                            placeholder="Edit your flashcard content..."
                        />
                    </div>
                    <div>
                        <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-1 block">
                            Audio Script (Hidden from card)
                        </label>
                        <Textarea 
                            value={editAudioScript}
                            onChange={(e) => setEditAudioScript(e.target.value)}
                            className="min-h-[80px] text-sm leading-relaxed p-3 resize-none border-dashed border-2 border-orange-200 focus:border-orange-400 bg-orange-50/30"
                            placeholder="Script for audio narration..."
                        />
                    </div>
                </div>
                <div className="flex justify-end gap-2 pt-2 border-t">
                    <Button variant="ghost" size="sm" onClick={() => setIsEditing(false)} disabled={isSaving}>
                        Cancel
                    </Button>
                    <Button size="sm" onClick={saveEdit} disabled={isSaving} className="bg-green-600 hover:bg-green-700 text-white">
                        {isSaving && <Loader2 className="w-3 h-3 mr-2 animate-spin" />}
                        Save
                    </Button>
                </div>
            </div>
        );
    }

    let textToRender = card.content;
    
    if (Array.isArray(textToRender)) {
        textToRender = (textToRender as string[]).join('\n');
    } else if (typeof textToRender === 'string') {
        const trimmed = textToRender.trim();
        if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
             try {
                let inner = trimmed.slice(1, -1);
                inner = inner.replace(/['"]\s*,\s*['"]/g, '\n');
                inner = inner.replace(/^['"]/, '').replace(/['"]$/, '');
                textToRender = inner;
             } catch (e) { /* ignore */ }
        }
    }

    // --- Fixed Sizing to match Screenshot for ALL cards ---
    const charCount = textToRender.length;
    
    // Fixed font size and consistent comfortable spacing
    const containerSpace = "space-y-4"; 
    const lineHeight = "leading-relaxed";
    const fontSize = "text-base md:text-lg"; // Consistent large font
    const fontColor = "text-foreground/90";
    
    // Switch vertical alignment based on length, but keep font size consistent
    const justifyContent = charCount > 250 ? "justify-start" : "justify-center";

    const lines = textToRender.split('\n').filter(line => line.trim().length > 0);
    
    return (
      <div className={`flex flex-col h-full ${justifyContent} pb-24`}>
        <div className={containerSpace}>
            {lines.map((line, lineIndex) => {
            // Updated Split Logic
            const parts = line.split(/(\*\*.*?\*\*)/g);
            
            return (
                <div 
                key={lineIndex} 
                className={`${fontSize} ${fontColor} ${lineHeight} font-body flex flex-wrap items-baseline`}
                >
                {parts.map((part, partIndex) => {
                    // Check if part is a bolded keyword
                    if (part.startsWith('**') && part.endsWith('**')) {
                        const cleanWord = part.slice(2, -2); // Remove **
                        return (
                            <div key={partIndex} className="inline-block mr-1.5">
                                <KeywordPopover word={cleanWord} context={textToRender} />
                            </div>
                        );
                    }
                    
                    // Normal Text
                    const words = part.split(' ').filter(Boolean);
                    if (words.length === 0) return null;

                    return words.map((word, wordIndex) => (
                        <span
                            key={`${partIndex}-${wordIndex}`}
                            className="inline-block mr-1.5 text-inherit" 
                        >
                            {word}
                        </span>
                    ));
                })}
                </div>
            );
            })}
            
            {/* Inline Reference Section REMOVED as per request */}
        </div>
      </div>
    );
  };

  return (
    // Reduced padding on main container
    <div className="flex-1 flex flex-col items-center justify-center px-4 py-2 h-full min-h-[500px]">
      
      {/* Topic Header - Reduced margin (REPLACED DAY HEADER) */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-4 max-w-2xl px-4" 
      >
        <h2 className="font-display text-2xl md:text-3xl font-semibold text-foreground leading-tight">
          {topic}
        </h2>
        <p className="text-muted-foreground text-sm mt-1">
          Concept {currentIndex + 1} of {flashcards.length}
        </p>
      </motion.div>

      {/* Book Container */}
      <div className="w-full max-w-3xl perspective-1000">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIndex}
            className="relative"
            initial={false}
          >
            {/* Page Turn Effect */}
            <motion.div
              animate={isPageTurning ? {
                rotateY: -180,
                x: -50,
              } : {
                rotateY: 0,
                x: 0,
              }}
              transition={{ duration: 0.6, ease: [0.645, 0.045, 0.355, 1] }}
              style={{ 
                transformOrigin: 'left center',
                transformStyle: 'preserve-3d',
              }}
              className="relative"
            >
              {/* Book Page - COMPACT FIXED HEIGHT */}
              <div 
                className="h-[400px] md:h-[450px] bg-card rounded-2xl book-shadow border border-border overflow-hidden page-texture"
                style={{ backfaceVisibility: 'hidden' }}
              >
                {/* Gold Spine Edge */}
                <div className="absolute left-0 top-0 bottom-0 w-2 gold-gradient rounded-l-2xl" />
                
                {/* Gold Corner Accents */}
                <div className="absolute top-4 right-4 w-10 h-10 border-t-2 border-r-2 border-primary/30 rounded-tr-lg" />
                <div className="absolute bottom-4 left-6 w-10 h-10 border-b-2 border-l-2 border-primary/30 rounded-bl-lg" />

                {/* Content Container - Reduced padding */}
                <div className="relative p-6 md:p-10 pl-8 md:pl-14 h-full flex flex-col">
                  
                  {/* Title - Animated Position */}
                  <AnimatePresence mode="wait">
                    {(phase === 'title-center' || phase === 'blank') && (
                      <motion.div
                        key="title-center"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: phase === 'blank' ? 0 : 1, scale: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="absolute inset-0 flex items-center justify-center z-10"
                      >
                        <h3 className="font-display text-2xl md:text-3xl font-bold text-center text-foreground px-8 leading-tight">
                          {card.title}
                        </h3>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* Title in Final Position */}
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{
                      opacity: phase === 'title-moving' || phase === 'content-reveal' || phase === 'complete' ? 1 : 0,
                      y: phase === 'title-moving' || phase === 'content-reveal' || phase === 'complete' ? 0 : 20,
                    }}
                    transition={{ duration: 0.4 }}
                    className="shrink-0 flex flex-col mb-2"
                  >
                      <div className="flex items-center justify-between">
                         <span className="text-[10px] md:text-xs font-semibold text-primary uppercase tracking-wider">
                         Concept {currentIndex + 1}
                         </span>
                         {!isEditing && (
                            <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={startEditing}
                                className="h-5 w-5 p-0 text-stone-400 hover:text-primary hover:bg-transparent"
                                title="Edit Content"
                            >
                                <Pencil className="w-3 h-3" />
                            </Button>
                         )}
                    </div>
                    <h3 className="font-display text-xl md:text-2xl font-bold text-foreground pb-2 border-b border-border">
                        {card.title}
                    </h3>
                  </motion.div>

                  {/* Content Area - NO SCROLL */}
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{
                      opacity: phase === 'content-reveal' || phase === 'complete' ? 1 : 0,
                      y: phase === 'content-reveal' || phase === 'complete' ? 0 : 30,
                    }}
                    transition={{ duration: 0.4, ease: 'easeOut' }}
                    className="flex-1 overflow-hidden relative z-0"
                  >
                      {renderContent()}
                  </motion.div>
                  
                  {/* Controls Container - Increased spacing */}
                  <motion.div 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: phase === 'content-reveal' || phase === 'complete' ? 1 : 0 }}
                      className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 flex items-center gap-3 w-max"
                  >
                    {!isEditing && (
                        <>
                        {/* Download PDF - Increased Size */}
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={handleDownloadPdf}
                            disabled={isDownloading}
                            className="rounded-full w-12 h-12 border-2 border-orange-200 text-orange-600 hover:bg-orange-50 bg-white shadow-sm hover:shadow-md transition-all"
                            title="Download PDF"
                        >
                            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin"/> : <FileText className="w-5 h-5" />}
                        </Button>

                        {/* Reference - Increased Size */}
                        <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setReferenceOpen(true)}
                        className={`rounded-full w-12 h-12 border-2 bg-white shadow-sm hover:shadow-md transition-all ${
                            card.reference 
                            ? "border-blue-100 text-blue-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50" 
                            : "border-stone-200 text-stone-400 hover:text-stone-600 hover:border-stone-300 hover:bg-stone-50"
                        }`}
                        title={card.reference ? "View Reference" : "No Reference"}
                        >
                        <Link2 className="w-5 h-5" />
                        </Button>

                        {/* Simplify - Increased Size */}
                        <Button
                        variant="secondary"
                        onClick={handleSimplify}
                        disabled={isLoadingSimplify}
                        className="bg-white/90 backdrop-blur shadow-sm hover:shadow-md border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 transition-all rounded-full h-12 px-5 flex items-center gap-2"
                        >
                        <Sparkles className="w-5 h-5 fill-indigo-200" />
                        <span className="text-sm font-semibold">Simplify</span>
                        </Button>

                        {/* Mic / Audio - Increased Size */}
                        {isPlaying || isLoadingAudio ? (
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={toggleStop}
                            className={`rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-12 h-12 border-2 ${
                            isLoadingAudio 
                                ? 'bg-red-400 text-white border-red-400 opacity-80 cursor-wait' 
                                : 'bg-red-600 text-white border-red-700 shadow-red-500/50 scale-105' 
                            }`}
                            title="Stop Audio"
                        >
                            {isLoadingAudio ? (
                            <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                            <Square className="w-3 h-3 fill-current" />
                            )}
                        </Button>
                        ) : (
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="rounded-full shadow-sm hover:shadow-md transition-all duration-300 w-12 h-12 border-2 bg-white border-stone-200 text-stone-500 hover:text-red-500 hover:border-red-200 hover:bg-red-50"
                                title="Play Audio Explanation"
                            >
                                <Mic className="w-5 h-5" />
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="top" className="w-40">
                            <DropdownMenuItem onClick={() => handleLanguageSelect('English')}>
                                🇺🇸 English
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleLanguageSelect('Hindi')}>
                                🇮🇳 Hindi
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        )}
                        </>
                    )}
                  </motion.div>

                  {/* Previous Page Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === 'content-reveal' || phase === 'complete' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-4 left-9 z-20"
                  >
                    {!isEditing && (
                        <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handlePrevious}
                        disabled={currentIndex === 0}
                        className={`
                            p-2 rounded-full shadow-lg transition-all border border-border
                            ${currentIndex > 0
                            ? 'gold-gradient bg-card text-white hover:shadow-xl cursor-pointer hover:bg-accent' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                            }
                        `}
                        title="Previous Page"
                        >
                        <ChevronLeft className="w-5 h-5" />
                        </motion.button>
                    )}
                  </motion.div>

                  {/* Next Page Button */}
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: phase === 'complete' ? 1 : 0 }}
                    transition={{ duration: 0.3 }}
                    className="absolute bottom-4 right-6 z-20"
                  >
                    {!isEditing && (
                        <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleNext}
                        disabled={phase !== 'complete' && !isPlaying} 
                        className={`
                            p-2 rounded-full shadow-lg transition-all
                            ${phase === 'complete' 
                            ? 'gold-gradient text-primary-foreground hover:shadow-xl cursor-pointer' 
                            : 'bg-muted text-muted-foreground cursor-not-allowed'
                            }
                        `}
                        title="Next Page"
                        >
                        {isLast ? (
                            <Check className="w-5 h-5" />
                        ) : (
                            <ChevronRight className="w-5 h-5" />
                        )}
                        </motion.button>
                    )}
                  </motion.div>
                </div>
              </div>

              {/* Back of current page */}
              <div 
                className="absolute inset-0 h-[400px] md:h-[450px] bg-card rounded-2xl book-shadow page-texture"
                style={{ 
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              />
            </motion.div>

            {/* Next page preview */}
            {isPageTurning && currentIndex < flashcards.length - 1 && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="absolute inset-0 h-[400px] md:h-[450px] bg-card rounded-2xl book-shadow border border-border page-texture -z-10"
              >
                <div className="absolute left-0 top-0 bottom-0 w-2 gold-gradient rounded-l-2xl" />
                <div className="p-6 md:p-10 pl-8 md:pl-14 flex items-center justify-center h-full">
                  <h3 className="font-display text-2xl md:text-3xl font-bold text-center text-foreground/50">
                    {flashcards[currentIndex + 1]?.title}
                  </h3>
                </div>
              </motion.div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Reference Dialog (Detailed View) */}
      <Dialog open={referenceOpen} onOpenChange={setReferenceOpen}>
        <DialogContent className="sm:max-w-2xl border-2 border-blue-100 shadow-2xl bg-white/95 backdrop-blur-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl font-display text-blue-900">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Link2 className="w-5 h-5 text-blue-600" />
              </div>
              Source Reference
            </DialogTitle>
            <DialogDescription className="text-stone-600">
              The content for <span className="font-semibold text-blue-900">{card?.title}</span> was sourced from:
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-4 p-4 bg-stone-50 rounded-lg border border-stone-200">
             {card?.reference ? (
                card.reference.startsWith('http') ? (
                  <a 
                    href={card.reference} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-start gap-2 text-blue-600 hover:text-blue-700 hover:underline font-medium transition-colors break-all"
                  >
                    <ExternalLink className="w-4 h-4 mt-1 shrink-0" />
                    <span>{card.reference}</span>
                  </a>
                ) : (
                  <p className="text-stone-700 italic font-medium flex items-center gap-2">
                    <FileText className="w-4 h-4 text-stone-400" />
                    "{card.reference}"
                  </p>
                )
             ) : (
                <div className="flex flex-col items-center justify-center py-4 text-stone-400">
                  <Link2 className="w-8 h-8 mb-2 opacity-20" />
                  <p className="italic">No specific reference link provided for this card.</p>
                </div>
             )}
          </div>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setReferenceOpen(false)}
              className="text-muted-foreground hover:text-foreground hover:bg-stone-100"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Simplified Content Dialog */}
      <Dialog open={simplifyOpen} onOpenChange={setSimplifyOpen}>
        <DialogContent className="sm:max-w-lg border-2 border-indigo-100 shadow-2xl bg-white/95 backdrop-blur-md">
          <DialogHeader className="pb-4 border-b border-indigo-50">
            <DialogTitle className="flex items-center gap-2 text-2xl font-display text-indigo-900">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Sparkles className="w-6 h-6 text-indigo-600 fill-indigo-200" />
              </div>
              Simply Put...
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="max-h-[50vh] pr-4 mt-2">
            {isLoadingSimplify ? (
              <div className="flex flex-col items-center justify-center py-12 text-muted-foreground space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 bg-indigo-200 rounded-full animate-ping opacity-25" />
                  <Loader2 className="w-12 h-12 animate-spin text-indigo-500 relative z-10" />
                </div>
                <p className="text-sm font-medium animate-pulse text-indigo-400">Generating simple examples...</p>
              </div>
            ) : (
              <div className="py-2">
                {simplifiedCache[currentIndex] ? (
                  <TypewriterText text={simplifiedCache[currentIndex]} />
                ) : (
                  <p className="text-center text-muted-foreground">Unable to simplify content.</p>
                )}
              </div>
            )}
          </ScrollArea>

          <div className="mt-6 flex justify-end">
            <Button 
              variant="ghost" 
              onClick={() => setSimplifyOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Progress Bar - Reduced margin */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="w-full max-w-3xl mt-4" 
      >
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gold-gradient"
            initial={{ width: 0 }}
            animate={{ width: `${((currentIndex + 1) / flashcards.length) * 100}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        </div>
        <div className="flex justify-between mt-1.5 text-[10px] md:text-xs text-muted-foreground">
          <span>Progress</span>
          <span>{Math.round(((currentIndex + 1) / flashcards.length) * 100)}%</span>
        </div>
      </motion.div>
    </div>
  );
}