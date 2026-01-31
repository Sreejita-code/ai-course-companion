import { useState } from 'react';
import { Search, BookOpen, BrainCircuit, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ExistingCourseSummary } from '@/types/course';

interface LearnerSearchViewProps {
  onSearch: (topic: string) => void;
  searchResults?: ExistingCourseSummary[];
  searchedTopic?: string;
  onTakeAssessment: (topic: string) => void;
  onViewCourse: (courseId: string) => void; // <--- NEW PROP
}

export function LearnerSearchView({ 
  onSearch, 
  searchResults, 
  searchedTopic, 
  onTakeAssessment,
  onViewCourse // <--- Destructure
}: LearnerSearchViewProps) {
  const [topic, setTopic] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (topic.trim()) onSearch(topic);
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-stone-50 p-6">
      <div className="w-full max-w-4xl text-center space-y-8">
        <div className="space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 mb-4">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-bold text-stone-900 tracking-tight">
            What do you want to learn?
          </h1>
          <p className="text-xl text-stone-500 font-light">
            Search for a topic. Enroll in an existing course or create a custom one.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative max-w-lg mx-auto w-full">
          <Input
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            placeholder="e.g., Python, Digital Marketing, History of Rome..."
            className="h-14 pl-12 pr-4 rounded-full border-2 border-stone-200 focus:border-blue-500 text-lg shadow-sm"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <Button 
            type="submit" 
            className="absolute right-2 top-2 bottom-2 rounded-full px-6 bg-blue-600 hover:bg-blue-700"
          >
            Search
          </Button>
        </form>

        {searchedTopic && (
          <div className="mt-12 text-left animate-in fade-in slide-in-from-bottom-4 duration-500 w-full space-y-10">
            
            {/* SECTION 1: Existing Courses */}
            {searchResults && searchResults.length > 0 && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold text-stone-900">Existing Courses for "{searchedTopic}"</h3>
                  <span className="text-sm text-muted-foreground">{searchResults.length} results found</span>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                  {searchResults.map(course => (
                    <div key={course.id} className="p-5 bg-white rounded-xl border border-stone-200 shadow-sm flex flex-col justify-between hover:shadow-md transition-all duration-200">
                      <div className="space-y-2 mb-4">
                        <h4 className="font-bold text-lg text-stone-900">{course.title}</h4>
                        <p className="text-sm text-stone-500 line-clamp-2">{course.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                           <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                             Match: {Math.round(course.match_score * 100)}%
                           </span>
                           <span className="text-xs text-stone-400">By {course.creator_name}</span>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => onViewCourse(course.id)} // <--- CONNECTED
                        className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800"
                      >
                        Enroll Now
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* DIVIDER */}
            {searchResults && searchResults.length > 0 && (
               <div className="flex items-center gap-4">
                  <div className="h-px bg-stone-200 flex-1"></div>
                  <span className="text-stone-400 font-medium text-sm">OR CREATE YOUR OWN</span>
                  <div className="h-px bg-stone-200 flex-1"></div>
               </div>
            )}

            {/* SECTION 2: Create Personalized Course */}
            <div className="bg-gradient-to-br from-stone-900 to-stone-800 p-8 rounded-2xl shadow-xl text-white flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
               <div className="absolute -top-24 -right-24 w-64 h-64 bg-white/5 rounded-full blur-3xl" />
               
               <div className="space-y-2 relative z-10">
                 <div className="flex items-center gap-2 text-yellow-400 mb-1">
                   <BrainCircuit className="w-5 h-5" />
                   <span className="font-bold uppercase tracking-wider text-xs">AI-Powered</span>
                 </div>
                 <h4 className="text-2xl font-bold">Want something specific?</h4>
                 <p className="text-stone-300 max-w-lg leading-relaxed">
                   Take a quick assessment and let our AI build a custom syllabus tailored exactly to your skill level and learning goals.
                 </p>
               </div>
               
               <Button 
                 onClick={() => onTakeAssessment(searchedTopic)}
                 size="lg" 
                 className="bg-white text-stone-900 hover:bg-stone-100 whitespace-nowrap px-8 h-14 text-base font-bold shadow-lg relative z-10"
               >
                 <Plus className="w-5 h-5 mr-2" />
                 Create Personalized Course
               </Button>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}