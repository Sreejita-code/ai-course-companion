import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronRight, Clock, PlayCircle, Trash2, Plus, CheckCircle, Pencil, Save, X, Loader2 } from 'lucide-react';
import { CourseModule, SyllabusModule } from '@/types/course';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopNavigation } from './TopNavigation';
import { useToast } from '@/components/ui/use-toast';

interface OverviewViewProps {
  topic: string;
  modules?: CourseModule[];
  totalDuration?: number;
  courseId?: string;
  isEditMode?: boolean;
  editedModules?: SyllabusModule[];
  onDayClick: (dayNumber: number, cardIndex?: number) => void;
  onToggleModule?: (topicName: string) => void;
  onStartModule?: (dayNumber: number, moduleTitle: string) => Promise<void>;
  onStartEditMode?: () => void;
  onCancelEditMode?: () => void;
  onSaveEdits?: () => Promise<boolean | undefined>;
  onUpdateModuleTitle?: (oldTitle: string, newTitle: string) => void;
  onUpdateSubtopicTitle?: (moduleTitle: string, oldSubtopic: string, newSubtopic: string) => void;
}

export function OverviewView({ 
  topic, 
  modules = [], 
  totalDuration = 0, 
  courseId,
  isEditMode = false,
  editedModules = [],
  onDayClick, 
  onToggleModule,
  onStartModule,
  onStartEditMode,
  onCancelEditMode,
  onSaveEdits,
  onUpdateModuleTitle,
  onUpdateSubtopicTitle,
}: OverviewViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [showRemoved, setShowRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState<string | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<{ module: string; subtopic: string } | null>(null);

  const toggleExpand = (topicName: string) => {
    setExpandedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicName)) newSet.delete(topicName);
      else newSet.add(topicName);
      return newSet;
    });
  };

  const handleToggleModule = (e: React.MouseEvent, topicName: string) => {
    e.stopPropagation();
    if (onToggleModule) onToggleModule(topicName);
  };

  const handleStartModule = async (e: React.MouseEvent, dayNumber: number, moduleTitle: string) => {
    e.stopPropagation();
    if (!onStartModule) return;
    
    setLoadingModule(moduleTitle);
    try {
      await onStartModule(dayNumber, moduleTitle);
    } finally {
      setLoadingModule(null);
    }
  };

  const handleSaveEdits = async () => {
    if (!onSaveEdits) return;
    
    setIsSaving(true);
    try {
      const success = await onSaveEdits();
      if (success) {
        toast({ title: "Saved", description: "Your changes have been saved." });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to save changes.", variant: "destructive" });
    } finally {
      setIsSaving(false);
    }
  };

  // Logic to track the absolute index for Modules (Days)
  let currentGlobalDay = 1;

  const activeModules = modules.filter(m => m.tag === 'needed');
  const removedModules = modules.filter(m => m.tag === 'not needed');
  const displayedModules = showRemoved ? removedModules : activeModules;

  // Duration Logic
  const calculateModuleDuration = (m: CourseModule) => 
    m.subtopics.reduce((acc, sub) => acc + sub.duration_minutes, 0);

  const currentTotalDuration = activeModules.reduce((acc, m) => acc + calculateModuleDuration(m), 0);
  const maxTotalDuration = modules.reduce((acc, m) => acc + calculateModuleDuration(m), 0);
  
  // Progress Calculation (Avoid division by zero)
  const progressPercentage = maxTotalDuration > 0 ? (currentTotalDuration / maxTotalDuration) * 100 : 0;

  // Circular Progress Constants
  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  // Get edited module data for display
  const getEditedModule = (moduleTitle: string) => {
    return editedModules.find(m => m.module_title === moduleTitle);
  };

  return (
    <div className="fixed inset-0 bg-stone-50 overflow-hidden flex flex-col">
      <TopNavigation 
        schedule={[]} 
        currentDay={1}
        completedDays={[]}
        onDayClick={onDayClick}
        onBack={() => navigate('/')}
        courseTopic={topic}
        showOverview={false}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full relative">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-3xl font-bold text-stone-900 mb-2">
              {showRemoved ? "Removed Topics" : "Your Course Plan"}
            </h1>
            <p className="text-muted-foreground">
              {showRemoved 
                ? "Restore topics you previously removed." 
                : `${activeModules.length} modules • ${formatDuration(currentTotalDuration)} total duration`
              }
            </p>
          </div>

          <div className="flex items-center gap-4">
            {/* Circular Progress Bar (Visible in Active View) */}
            {!showRemoved && !isEditMode && (
              <div className="flex items-center gap-3 bg-white p-2 rounded-2xl border shadow-sm">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  {/* Background Circle */}
                  <svg className="w-full h-full transform -rotate-90">
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      className="text-stone-100"
                    />
                    {/* Progress Circle */}
                    <circle
                      cx="32"
                      cy="32"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="5"
                      fill="transparent"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      className="text-primary transition-all duration-500 ease-out"
                    />
                  </svg>
                  {/* Center Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-semibold text-stone-500 leading-none mb-0.5">Total</span>
                    <span className="text-xs font-bold text-stone-800 leading-none">
                      {formatDuration(currentTotalDuration)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              {/* Edit Mode Controls */}
              {isEditMode ? (
                <>
                  <Button 
                    variant="outline"
                    onClick={onCancelEditMode}
                    disabled={isSaving}
                    className="gap-2"
                  >
                    <X className="w-4 h-4" />
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleSaveEdits}
                    disabled={isSaving}
                    className="gap-2 gold-gradient text-primary-foreground"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </Button>
                </>
              ) : (
                <>
                  {!showRemoved && onStartEditMode && (
                    <Button 
                      variant="outline"
                      onClick={onStartEditMode}
                      className="gap-2"
                    >
                      <Pencil className="w-4 h-4" />
                      Edit Mode
                    </Button>
                  )}
                  
                  {!showRemoved && removedModules.length > 0 && (
                    <Button 
                      variant="outline"
                      onClick={() => setShowRemoved(true)}
                      className="gap-2 text-stone-600"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Removed ({removedModules.length})</span>
                      <span className="sm:hidden">({removedModules.length})</span>
                    </Button>
                  )}
                  {showRemoved && (
                    <Button 
                      variant="default"
                      onClick={() => setShowRemoved(false)}
                      className="gap-2 bg-stone-900 text-white hover:bg-stone-800"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Back to Plan
                    </Button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-4 pb-20">
          <AnimatePresence mode="popLayout">
            {displayedModules.length === 0 && (
              <motion.div 
                initial={{ opacity: 0 }} 
                animate={{ opacity: 1 }} 
                className="text-center py-12 text-stone-400"
              >
                <p>{showRemoved ? "No removed topics." : "No topics needed? Add some back from the Removed list."}</p>
              </motion.div>
            )}

            {displayedModules.map((module) => {
              const isNotNeeded = module.tag === 'not needed';
              const isExpanded = expandedTopics.has(module.topic);
              const moduleDuration = module.subtopics.reduce((acc, sub) => acc + sub.duration_minutes, 0);
              const isLoading = loadingModule === module.topic;
              
              // Capture the Day Number for this Module
              const moduleDayNumber = currentGlobalDay;
              if (!isNotNeeded) {
                currentGlobalDay++; // Increment day counter for next needed module
              }

              // Get edited data for this module
              const editedData = getEditedModule(module.topic);

              // --- TRACKING CARD INDICES ---
              let currentCardOffset = 0;

              return (
                <motion.div
                  key={module.topic}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`
                     rounded-xl border transition-all duration-300 overflow-hidden
                     ${isNotNeeded 
                       ? 'bg-stone-100/50 border-stone-200' 
                       : 'bg-white border-stone-200 shadow-sm hover:shadow-md'
                     }
                  `}
                >
                  <div 
                     className="flex items-center justify-between p-5 cursor-pointer"
                     onClick={() => !isNotNeeded && !isEditMode && toggleExpand(module.topic)}
                  >
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      <div className={`
                         w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0
                         ${isNotNeeded ? 'bg-stone-200 text-stone-400' : (isExpanded ? 'bg-primary/10 text-primary' : 'bg-stone-100 text-stone-400')}
                      `}>
                         {isNotNeeded ? <Trash2 className="w-4 h-4" /> : (isExpanded ? <ChevronDown className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        {isEditMode && editingModuleTitle === module.topic ? (
                          <Input
                            defaultValue={editedData?.module_title || module.topic}
                            className="font-display font-bold text-lg h-8"
                            autoFocus
                            onBlur={(e) => {
                              if (onUpdateModuleTitle && e.target.value !== module.topic) {
                                onUpdateModuleTitle(module.topic, e.target.value);
                              }
                              setEditingModuleTitle(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                (e.target as HTMLInputElement).blur();
                              }
                              if (e.key === 'Escape') {
                                setEditingModuleTitle(null);
                              }
                            }}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <h3 
                            className={`font-display font-bold text-lg truncate ${isNotNeeded ? 'text-stone-500 line-through decoration-stone-300' : 'text-stone-800'} ${isEditMode ? 'cursor-text hover:bg-stone-100 px-2 py-1 rounded -ml-2' : ''}`}
                            onClick={(e) => {
                              if (isEditMode) {
                                e.stopPropagation();
                                setEditingModuleTitle(module.topic);
                              }
                            }}
                          >
                            {editedData?.module_title || module.topic}
                          </h3>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {moduleDuration} min
                          </span>
                          <span>•</span>
                          <span>{module.subtopics.length} lessons</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {!isEditMode && (
                        <>
                          <Button
                            size="sm"
                            variant="ghost"
                            className={`
                                gap-2 rounded-full 
                                ${isNotNeeded ? 'text-green-600 hover:bg-green-50 hover:text-green-700' : 'text-stone-400 hover:text-red-500 hover:bg-red-50'}
                            `}
                            onClick={(e) => handleToggleModule(e, module.topic)}
                          >
                            {isNotNeeded ? <Plus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
                          </Button>

                          {!isNotNeeded && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              disabled={isLoading}
                              className="gap-2 rounded-full border-primary/20 hover:bg-primary/5 hover:text-primary"
                              onClick={(e) => handleStartModule(e, moduleDayNumber, module.topic)}
                            >
                              {isLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <PlayCircle className="w-4 h-4" />
                              )}
                              Start
                            </Button>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {(isExpanded || isEditMode) && !isNotNeeded && (
                      <motion.div
                         initial={{ height: 0, opacity: 0 }}
                         animate={{ height: 'auto', opacity: 1 }}
                         exit={{ height: 0, opacity: 0 }}
                         className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0 pl-16 space-y-2">
                          {module.subtopics.map((sub, idx) => {
                            // 1. Capture the start index for THIS subtopic
                            const startCardIndex = currentCardOffset;
                            
                            // 2. We now only have ONE card per subtopic
                            const subtopicCardCount = 1; 

                            // 3. Update offset for the NEXT subtopic loop
                            currentCardOffset += subtopicCardCount;

                            const isEditingThis = editingSubtopic?.module === module.topic && editingSubtopic?.subtopic === sub.subtopic_name;

                            return (
                              <div 
                                key={idx} 
                                className="flex items-center justify-between p-3 rounded-lg bg-stone-50 border border-stone-100 hover:bg-stone-100/80 transition-colors"
                              >
                                <div className="flex-1 min-w-0">
                                  {isEditMode && isEditingThis ? (
                                    <Input
                                      defaultValue={sub.subtopic_name}
                                      className="font-medium text-sm h-7"
                                      autoFocus
                                      onBlur={(e) => {
                                        if (onUpdateSubtopicTitle && e.target.value !== sub.subtopic_name) {
                                          onUpdateSubtopicTitle(module.topic, sub.subtopic_name, e.target.value);
                                        }
                                        setEditingSubtopic(null);
                                      }}
                                      onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                          (e.target as HTMLInputElement).blur();
                                        }
                                        if (e.key === 'Escape') {
                                          setEditingSubtopic(null);
                                        }
                                      }}
                                    />
                                  ) : (
                                    <>
                                      <p 
                                        className={`font-medium text-sm text-stone-700 truncate ${isEditMode ? 'cursor-text hover:bg-white px-2 py-1 rounded -ml-2' : ''}`}
                                        onClick={() => {
                                          if (isEditMode) {
                                            setEditingSubtopic({ module: module.topic, subtopic: sub.subtopic_name });
                                          }
                                        }}
                                      >
                                        {sub.subtopic_name}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-0.5">
                                        {sub.duration_minutes} min • {subtopicCardCount} card
                                      </p>
                                    </>
                                  )}
                                </div>
                                
                                {!isEditMode && (
                                  <Button 
                                    size="icon" 
                                    variant="ghost" 
                                    className="h-8 w-8 text-stone-400 hover:text-primary flex-shrink-0"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      // Jump to specific card index
                                      onDayClick(moduleDayNumber, startCardIndex);
                                    }}
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </Button>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
