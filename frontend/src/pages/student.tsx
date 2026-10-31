import { useLocation } from 'wouter';
import { useStudentDashboard } from '@features/dashboard/api/hooks';
import { useClasses } from '@features/classroom/api/hooks';
import { Card, Button, Badge } from '@/components/ui';
import { Play, CheckCircle2 } from 'lucide-react';
import type { StudentClassSummary } from '@/lib/api';
import { allTopics } from '@/data';
import { buildStudentLessonHref, type PortalTopicId } from '@features/student/model/portal';
import { StudentClassroomPage } from '@features/student/classroom';

export { StudentDashboard } from '@features/student/dashboard';
export { StudentClassroomPage };

export function StudentLessons() {
  const { data: dashboard } = useStudentDashboard();
  const { data: classesData } = useClasses();
  const [, setLocation] = useLocation();

  // Topics to show in order
  const topics = Object.keys(allTopics);
  
  // Theme colors for topics
  const topicTheme: Record<string, { bg: string, text: string, border: string }> = {
    colors: { bg: 'bg-jungle-orange/10', text: 'text-jungle-orange', border: 'border-jungle-orange/30 hover:border-jungle-orange' },
    shapes: { bg: 'bg-primary/10', text: 'text-primary', border: 'border-primary/30 hover:border-primary' },
    numbers: { bg: 'bg-jungle-yellow/10', text: 'text-yellow-600', border: 'border-jungle-yellow/50 hover:border-jungle-yellow' },
    sequencing: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/30 hover:border-blue-500' },
    addition: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/30 hover:border-green-500' },
    subtraction: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/30 hover:border-red-500' },
    measurement: { bg: 'bg-purple-500/10', text: 'text-purple-600', border: 'border-purple-500/30 hover:border-purple-500' },
    comparison: { bg: 'bg-pink-500/10', text: 'text-pink-600', border: 'border-pink-500/30 hover:border-pink-500' },
    clock: { bg: 'bg-indigo-500/10', text: 'text-indigo-600', border: 'border-indigo-500/30 hover:border-indigo-500' },
  };

  const getRecentScore = (topic: string) => {
    if (!dashboard) return null;
    const attempt = dashboard.recentAttempts?.find((a: any) => a.lessonId === topic);
    if (!attempt) return null;
    return Math.round((attempt.score / attempt.maxScore) * 100);
  };
  const classes = (classesData?.classes || []) as StudentClassSummary[];
  const singleClassId = classes.length === 1 ? classes[0].id : null;

  return (
    <div className="space-y-12 pb-12 animate-in fade-in duration-700 relative">
      <header className="text-center max-w-2xl mx-auto py-8">
        <h1 className="text-4xl font-display font-extrabold text-foreground mb-4">The Jungle Map</h1>
        <p className="text-lg text-muted-foreground font-bold">Choose a path and start exploring. You can play these in any order!</p>
      </header>

      <section className="relative">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {topics.map(topic => {
            const theme = topicTheme[topic] || topicTheme.colors;
            const score = getRecentScore(topic);
            const isCompleted = score !== null && score >= 70;
            
            return (
              <Card 
                key={topic} 
                className={`relative p-5 cursor-pointer transition-all hover:-translate-y-2 border-2 ${theme.border} ${isCompleted ? 'bg-muted/10' : 'bg-card'}`}
                onClick={() => setLocation(buildStudentLessonHref({ lessonId: topic as PortalTopicId, classId: singleClassId }))}
              >
                {isCompleted && (
                  <div className="absolute -top-3 -right-3 h-8 w-8 rounded-full bg-jungle-yellow text-white flex items-center justify-center shadow-sm">
                    <CheckCircle2 className="h-5 w-5" />
                  </div>
                )}
                
                <Badge variant="outline" className="mb-3 capitalize">{topic}</Badge>
                <h3 className="text-lg font-bold mb-2 leading-tight capitalize">Chapter: {topic}</h3>
                <p className="text-sm font-bold text-muted-foreground mb-4 line-clamp-2">Practice {topic}</p>
                
                <div className="flex justify-between items-center mt-auto pt-4 border-t border-border/50">
                  {score !== null ? (
                    <span className="text-sm font-bold text-muted-foreground">Best: <strong className="text-foreground">{score}%</strong></span>
                  ) : (
                    <span className="text-sm font-bold text-muted-foreground">Not played</span>
                  )}
                  <div className={`h-8 w-8 rounded-full flex items-center justify-center ${theme.bg} ${theme.text}`}>
                    <Play className="h-4 w-4 ml-0.5 fill-current" />
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </section>
    </div>
  );
}

export function StudentClassDetail(_: { classId: string }) {
  return <StudentClassroomPage />;
}
