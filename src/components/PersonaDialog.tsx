import { useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Users, Brain, Target, MessageSquare, X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export interface PersonaData {
  target_audience?: string;
  current_knowledge?: string;
  learning_goal?: string;
  tone?: string;
}

interface PersonaDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  persona: PersonaData;
  onSave: (persona: PersonaData) => void;
}

const toneOptions = [
  { value: 'professional', label: 'Professional', description: 'Formal and business-like' },
  { value: 'friendly', label: 'Friendly', description: 'Warm and approachable' },
  { value: 'academic', label: 'Academic', description: 'Scholarly and detailed' },
  { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' },
];

export function PersonaDialog({ open, onOpenChange, persona, onSave }: PersonaDialogProps) {
  const [localPersona, setLocalPersona] = useState<PersonaData>(persona);

  const handleSave = () => {
    onSave(localPersona);
    onOpenChange(false);
  };

  const handleClear = () => {
    setLocalPersona({});
  };

  const hasPersona = Object.values(localPersona).some(v => v && v.trim());

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl border-2 border-primary/20 shadow-2xl bg-white/95 backdrop-blur-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3 text-xl font-display">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles className="w-5 h-5 text-primary" />
            </div>
            Customize Learning Persona
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            Tailor the course content to your specific audience and goals. All fields are optional.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Target Audience */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Users className="w-4 h-4 text-primary" />
              Target Audience
            </Label>
            <Input
              placeholder="e.g., College students, Working professionals, Beginners"
              value={localPersona.target_audience || ''}
              onChange={(e) => setLocalPersona(prev => ({ ...prev, target_audience: e.target.value }))}
              className="h-11"
            />
          </div>

          {/* Current Knowledge */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Brain className="w-4 h-4 text-primary" />
              Current Knowledge Level
            </Label>
            <Textarea
              placeholder="e.g., Basic understanding of programming, No prior experience, Familiar with similar concepts"
              value={localPersona.current_knowledge || ''}
              onChange={(e) => setLocalPersona(prev => ({ ...prev, current_knowledge: e.target.value }))}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Learning Goal */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <Target className="w-4 h-4 text-primary" />
              Learning Goal
            </Label>
            <Textarea
              placeholder="e.g., Build real-world projects, Pass certification exam, Career transition"
              value={localPersona.learning_goal || ''}
              onChange={(e) => setLocalPersona(prev => ({ ...prev, learning_goal: e.target.value }))}
              className="min-h-[80px] resize-none"
            />
          </div>

          {/* Tone */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-semibold">
              <MessageSquare className="w-4 h-4 text-primary" />
              Content Tone
            </Label>
            <div className="grid grid-cols-2 gap-3">
              {toneOptions.map((option) => (
                <motion.button
                  key={option.value}
                  type="button"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setLocalPersona(prev => ({ ...prev, tone: option.value }))}
                  className={`
                    p-3 rounded-xl text-left transition-all border-2
                    ${localPersona.tone === option.value 
                      ? 'border-primary bg-primary/5 shadow-md' 
                      : 'border-border hover:border-primary/30 bg-card'
                    }
                  `}
                >
                  <div className="font-semibold text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between pt-4 border-t">
          <Button
            variant="ghost"
            onClick={handleClear}
            disabled={!hasPersona}
            className="text-muted-foreground"
          >
            <X className="w-4 h-4 mr-2" />
            Clear All
          </Button>
          <div className="flex gap-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="gold-gradient text-primary-foreground">
              <Sparkles className="w-4 h-4 mr-2" />
              Apply Persona
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
