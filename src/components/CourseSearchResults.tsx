import { motion } from 'framer-motion';
import { BookOpen, Sparkles, Users, ArrowRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ExistingCourse } from '@/types/learner';

interface CourseSearchResultsProps {
  topic: string;
  existingCourses: ExistingCourse[];
  onSelectCourse: (courseId: string) => void;
  onCreateNew: () => void;
}

export function CourseSearchResults({
  topic,
  existingCourses,
  onSelectCourse,
  onCreateNew,
}: CourseSearchResultsProps) {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-8">
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center max-w-3xl mx-auto w-full"
      >
        {/* Header */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 border border-primary/20"
        >
          <BookOpen className="w-8 h-8 text-primary" />
        </motion.div>

        <h1 className="font-display text-3xl md:text-4xl font-bold mb-3 text-foreground">
          Courses for "<span className="text-primary">{topic}</span>"
        </h1>

        <p className="text-muted-foreground mb-8">
          We found existing courses on this topic. Choose one to start learning, or create a personalized course.
        </p>

        {/* Existing Courses */}
        <div className="space-y-4 mb-8">
          {existingCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 + index * 0.1 }}
              className="group bg-card border border-border rounded-xl p-5 text-left hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
              onClick={() => onSelectCourse(course.id)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <h3 className="font-display font-semibold text-lg text-foreground group-hover:text-primary transition-colors mb-1">
                    {course.title}
                  </h3>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {course.description}
                  </p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" />
                      {course.creator_name}
                    </span>
                    {course.match_score >= 0.8 && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full font-medium">
                        Best Match
                      </span>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0 mt-1" />
              </div>
            </motion.div>
          ))}
        </div>

        {/* Divider */}
        <div className="flex items-center gap-4 mb-8">
          <div className="flex-1 h-px bg-border" />
          <span className="text-sm text-muted-foreground font-medium">or</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        {/* Create New Course Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            size="lg"
            onClick={onCreateNew}
            className="gap-3 gold-gradient text-primary-foreground px-8 py-6 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all"
          >
            <Plus className="w-5 h-5" />
            Create Personalized Course
            <Sparkles className="w-5 h-5" />
          </Button>
          <p className="text-xs text-muted-foreground mt-3">
            Take a quick assessment and get a course tailored just for you
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}
