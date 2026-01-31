import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ChevronDown, 
  ChevronRight, 
  Clock, 
  PlayCircle, 
  Trash2, 
  Plus, 
  CheckCircle, 
  Pencil, 
  Save, 
  X, 
  Loader2, 
  ArrowUp, 
  ArrowDown 
} from 'lucide-react';
import { CourseModule, SyllabusModule } from '@/types/course';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TopNavigation } from './TopNavigation';
import { useToast } from '@/components/ui/use-toast';

interface LearnerOverviewViewProps {
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
  onUpdateSubtopicTitle?: (moduleTitle: string, subtopicIndex: number, newSubtopic: string) => void;
  onDeleteSubtopic?: (moduleTitle: string, subtopicIndex: number) => void;
  onAddSubtopic?: (moduleTitle: string) => void;
  onReorderSubtopic?: (moduleTitle: string, index: number, direction: 'up' | 'down') => void;
  onDeleteModule?: (moduleTitle: string) => void;
  onAddModule?: () => void;
  onBack?: () => void;
}

export function LearnerOverviewView({
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
  onDeleteSubtopic,
  onAddSubtopic,
  onReorderSubtopic,
  onDeleteModule,
  onAddModule,
  onBack,
}: LearnerOverviewViewProps) {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [showRemoved, setShowRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loadingModule, setLoadingModule] = useState<string | null>(null);
  const [editingModuleTitle, setEditingModuleTitle] = useState<string | null>(null);
  const [editingSubtopic, setEditingSubtopic] = useState<{ module: string; subtopicIndex: number } | null>(null);

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

  let currentGlobalDay = 1;

  const activeModules = modules.filter(m => m.tag === 'needed');
  const removedModules = modules.filter(m => m.tag === 'not needed');
  const displayedModules = showRemoved ? removedModules : activeModules;

  const calculateModuleDuration = (m: CourseModule) =>
    m.subtopics.reduce((acc, sub) => acc + sub.duration_minutes, 0);

  const currentTotalDuration = activeModules.reduce((acc, m) => acc + calculateModuleDuration(m), 0);
  const maxTotalDuration = modules.reduce((acc, m) => acc + calculateModuleDuration(m), 0);

  const progressPercentage = maxTotalDuration > 0 ? (currentTotalDuration / maxTotalDuration) * 100 : 0;

  const radius = 28;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progressPercentage / 100) * circumference;

  const formatDuration = (mins: number) => {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const getEditedModule = (moduleTitle: string) => {
    return editedModules.find(m => m.module_title === moduleTitle);
  };

  return (
    <div className="fixed inset-0 bg-background overflow-hidden flex flex-col">
      <TopNavigation
        schedule={[]}
        currentDay={1}
        completedDays={[]}
        onDayClick={onDayClick}
        onBack={onBack || (() => navigate('/'))}
        courseTopic={topic}
        showOverview={false}
      />

      <div className="flex-1 overflow-y-auto p-6 md:p-10 max-w-5xl mx-auto w-full relative">
        <div className="mb-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <h1 className="font-display text-3xl font-bold text-foreground">
                {showRemoved ? "Removed Topics" : "Your Learning Path"}
              </h1>
            </div>
            
            <p className="text-muted-foreground">
              {showRemoved
                ? "Restore topics you previously removed."
                : `${activeModules.length} modules • ${formatDuration(currentTotalDuration)} total duration`
              }
            </p>
          </div>

          <div className="flex items-center gap-4">
            {!showRemoved && !isEditMode && (
              <div className="flex items-center gap-3 bg-card p-2 rounded-2xl border shadow-sm">
                <div className="relative w-16 h-16 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" className="text-muted" />
                    <circle cx="32" cy="32" r={radius} stroke="currentColor" strokeWidth="5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="text-primary transition-all duration-500 ease-out" />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-[10px] font-semibold text-muted-foreground leading-none mb-0.5">Total</span>
                    <span className="text-xs font-bold text-foreground leading-none">{formatDuration(currentTotalDuration)}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="flex gap-2">
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
                      Customize
                    </Button>
                  )}

                  {!showRemoved && removedModules.length > 0 && (
                    <Button
                      variant="outline"
                      onClick={() => setShowRemoved(true)}
                      className="gap-2 text-muted-foreground"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Removed ({removedModules.length})</span>
                    </Button>
                  )}
                  {showRemoved && (
                    <Button
                      variant="default"
                      onClick={() => setShowRemoved(false)}
                      className="gap-2"
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
                className="text-center py-12 text-muted-foreground"
              >
                <p>{showRemoved ? "No removed topics." : "No topics selected."}</p>
              </motion.div>
            )}

            {displayedModules.map((module) => {
              const isNotNeeded = module.tag === 'not needed';
              const isExpanded = expandedTopics.has(module.topic);
              const moduleDuration = module.subtopics.reduce((acc, sub) => acc + sub.duration_minutes, 0);
              const isLoading = loadingModule === module.topic;

              const moduleDayNumber = currentGlobalDay;
              if (!isNotNeeded) {
                currentGlobalDay++;
              }

              const editedData = getEditedModule(module.topic);
              const currentSubtopics = (isEditMode && editedData)
                ? editedData.subtopics.map(s => {
                    const orig = module.subtopics.find(os => os.subtopic_name === s);
                    return { subtopic_name: s, duration_minutes: orig?.duration_minutes || 0 };
                  })
                : module.subtopics;

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
                      ? 'bg-muted/50 border-border'
                      : 'bg-card border-border shadow-sm hover:shadow-md'
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
                        ${isNotNeeded ? 'bg-muted text-muted-foreground' : (isExpanded ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground')}
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
                            className={`font-display font-bold text-lg truncate ${isNotNeeded ? 'text-muted-foreground line-through' : 'text-foreground'} ${isEditMode ? 'cursor-text hover:bg-muted px-2 py-1 rounded -ml-2' : ''}`}
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
                          <span>{currentSubtopics.length} lessons</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                      {isEditMode ? (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="gap-2 rounded-full text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (onDeleteModule) {
                              onDeleteModule(module.topic);
                            }
                          }}
                          title="Delete Module"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      ) : (
                        <>
                          {isNotNeeded ? (
                            <Button
                              size="sm"
                              variant="outline"
                              className="gap-2 rounded-full"
                              onClick={(e) => handleToggleModule(e, module.topic)}
                            >
                              <Plus className="w-4 h-4" />
                              Restore
                            </Button>
                          ) : (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                variant="ghost"
                                className="gap-1 text-muted-foreground hover:text-destructive"
                                onClick={(e) => handleToggleModule(e, module.topic)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="sm"
                                className="gap-2 rounded-full gold-gradient text-primary-foreground"
                                onClick={(e) => handleStartModule(e, moduleDayNumber, module.topic)}
                                disabled={isLoading}
                              >
                                {isLoading ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <PlayCircle className="w-4 h-4" />
                                )}
                                Start
                              </Button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                  {/* Expanded subtopics */}
                  <AnimatePresence>
                    {isExpanded && !isNotNeeded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-5 pb-5 pt-0">
                          <div className="border-l-2 border-primary/20 ml-4 pl-6 space-y-3">
                            {currentSubtopics.map((sub, idx) => {
                              const cardIndex = currentCardOffset;
                              currentCardOffset++;

                              const isEditingSub = editingSubtopic?.module === module.topic && editingSubtopic?.subtopicIndex === idx;

                              return (
                                <motion.div
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: idx * 0.05 }}
                                  className={`
                                    flex items-center justify-between p-3 rounded-lg transition-colors
                                    ${isEditMode ? 'bg-muted/50' : 'hover:bg-muted/50 cursor-pointer'}
                                  `}
                                  onClick={() => !isEditMode && onDayClick(moduleDayNumber, cardIndex)}
                                >
                                  {isEditMode && isEditingSub ? (
                                    <Input
                                      defaultValue={sub.subtopic_name}
                                      className="flex-1 h-7 text-sm"
                                      autoFocus
                                      onBlur={(e) => {
                                        if (onUpdateSubtopicTitle) {
                                          onUpdateSubtopicTitle(module.topic, idx, e.target.value);
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
                                      onClick={(e) => e.stopPropagation()}
                                    />
                                  ) : (
                                    <span
                                      className={`text-sm text-foreground/80 flex-1 ${isEditMode ? 'cursor-text hover:bg-background px-2 py-1 rounded' : ''}`}
                                      onClick={(e) => {
                                        if (isEditMode) {
                                          e.stopPropagation();
                                          setEditingSubtopic({ module: module.topic, subtopicIndex: idx });
                                        }
                                      }}
                                    >
                                      {sub.subtopic_name}
                                    </span>
                                  )}
                                  
                                  {isEditMode ? (
                                    <div className="flex items-center gap-1 ml-2">
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onReorderSubtopic) onReorderSubtopic(module.topic, idx, 'up');
                                        }}
                                        disabled={idx === 0}
                                      >
                                        <ArrowUp className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onReorderSubtopic) onReorderSubtopic(module.topic, idx, 'down');
                                        }}
                                        disabled={idx === currentSubtopics.length - 1}
                                      >
                                        <ArrowDown className="w-3 h-3" />
                                      </Button>
                                      <Button
                                        size="icon"
                                        variant="ghost"
                                        className="h-6 w-6 text-destructive"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          if (onDeleteSubtopic) onDeleteSubtopic(module.topic, idx);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">
                                      {sub.duration_minutes}m
                                    </span>
                                  )}
                                </motion.div>
                              );
                            })}

                            {isEditMode && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="w-full gap-2 text-muted-foreground"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  if (onAddSubtopic) onAddSubtopic(module.topic);
                                }}
                              >
                                <Plus className="w-4 h-4" />
                                Add Subtopic
                              </Button>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </AnimatePresence>

          {/* Add Module button in edit mode */}
          {isEditMode && !showRemoved && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex justify-center pt-4"
            >
              <Button
                variant="outline"
                className="gap-2"
                onClick={onAddModule}
              >
                <Plus className="w-4 h-4" />
                Add Module
              </Button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
