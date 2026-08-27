import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { useStudentDashboard, useAssignments, useClasses, useStudentClassroom, useClassPosts } from '@/lib/api/hooks';
import { Card, Button, Badge } from '@/components/ui';
import { Play, CheckCircle2, MessageSquare, BookOpen, ArrowLeft } from 'lucide-react';
import type { AssignmentForStudent, StudentClassSummary, StudentClassroomSummary } from '@/lib/api';
import { allTopics } from '@/data';
import { LegacyLessonMenu } from '@/components/student/LegacyLessonMenu';
import { StudentPortalLoading } from '@/components/student/StudentPortalLoading';
import { StudentPortalRail } from '@/components/student/StudentPortalRail';
import { buildPortalTopicEntries, buildStudentLessonHref, summarizePortalRail } from '@/lib/student/portal';
import { useLanguage } from '@/lib/i18n/useLanguage';

export function StudentDashboard() {
  const { data: dashboard, isLoading: dashLoading, error: dashboardError } = useStudentDashboard();
  const { data: assignmentsData, isLoading: assignLoading, error: assignmentsError } = useAssignments();
  const { data: classroomData, isLoading: classLoading, error: classesError } = useStudentClassroom();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  if (dashLoading || assignLoading || classLoading) return <StudentPortalLoading />;

  const assignments = (assignmentsData?.assignments || []) as AssignmentForStudent[];
  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  const dashboardSummary = dashboard ?? {
    completedLessons: 0,
    streakDays: 0,
    recentAttempts: [],
  };
  const showDashboardNotice = Boolean(dashboardError || assignmentsError || classesError || !dashboard);
  const topics = buildPortalTopicEntries({
    assignments,
    classes: classroom
      ? [{ id: classroom.id, name: 'Classroom', teacherName: classroom.teacherName }]
      : [],
    recentAttempts: dashboardSummary.recentAttempts || [],
  });
  const railSummary = summarizePortalRail({
    assignments,
    classroom: classroom
      ? { id: classroom.id, name: 'Classroom', teacherName: classroom.teacherName }
      : null,
    dashboard: {
      completedLessons: dashboardSummary.completedLessons,
      streakDays: dashboardSummary.streakDays,
      recentAttempts: dashboardSummary.recentAttempts || [],
    },
  });
  const highlightedLessonId =
    railSummary.nextAction.kind === 'assignment' ? railSummary.nextAction.lessonId : null;

  return (
    <div className="animate-in fade-in duration-500">
      {showDashboardNotice && (
        <Card className="mb-4 rounded-[28px] border-white/70 bg-[#fff7db]/95 p-5 shadow-[0_20px_45px_rgba(59,109,42,0.12)]">
          <h2 className="text-xl font-extrabold text-primary">{t('student.portal.dashboardUnavailableTitle')}</h2>
          <p className="mt-2 text-sm font-bold text-primary/75">{t('student.portal.dashboardUnavailableBody')}</p>
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <Button variant="jungle" onClick={() => window.location.reload()}>
              {t('common.tryAgain')}
            </Button>
          </div>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-[minmax(260px,25%)_minmax(0,1fr)]">
        <StudentPortalRail
          summary={railSummary}
          classroom={classroom}
          onOpenAssignment={(href) => setLocation(href)}
          onOpenClassroom={() => setLocation('/student/classroom')}
        />

        <div className="relative overflow-hidden rounded-[32px] border-4 border-white/60 shadow-[0_24px_60px_rgba(34,94,49,0.16)]">
          <div
            className="absolute inset-0 bg-cover bg-center"
            style={{
              backgroundImage:
                "linear-gradient(180deg, rgba(124,214,255,0.88) 0%, rgba(215,245,255,0.7) 65%, rgba(190,220,107,0.28) 100%), url('/assets/images/1bg.jpg')",
            }}
          />
          <div className="absolute -left-12 top-0 h-[68%] w-44 rounded-br-[140px] rounded-tr-[140px] bg-jungle-green/80 blur-sm" />
          <div className="absolute bottom-0 left-0 h-36 w-full bg-[radial-gradient(circle_at_20%_10%,rgba(211,239,126,0.75),transparent_35%),linear-gradient(180deg,rgba(150,193,74,0)_0%,rgba(108,150,54,0.58)_100%)]" />
          <div className="relative p-3 md:p-5">
            <LegacyLessonMenu
              topics={topics}
              highlightedLessonId={highlightedLessonId}
              onSelect={(href) => setLocation(href)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

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
                onClick={() => setLocation(buildStudentLessonHref({ lessonId: topic as import('@/lib/student/portal').PortalTopicId, classId: singleClassId }))}
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

export function StudentClassroomPage() {
  const { data: classroomData, isLoading: classLoading } = useStudentClassroom();
  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  const { data: postsData, isLoading: postsLoading } = useClassPosts(classroom?.id ?? '');
  const { data: assignmentsData, isLoading: assignLoading } = useAssignments();
  const [, setLocation] = useLocation();

  if (classLoading || postsLoading || assignLoading) {
    return <div className="p-8 text-center font-bold">Loading class details...</div>;
  }

  if (!classroom) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="font-bold text-muted-foreground">Classroom not found.</p>
        <Button variant="outline" onClick={() => setLocation('/student')}>Back to Dashboard</Button>
      </div>
    );
  }

  const posts = postsData?.posts || [];
  const assignments = ((assignmentsData?.assignments || []) as import('@/lib/api').AssignmentForStudent[])
    .filter(a => !a.completed); 

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => setLocation('/student')}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
        </Button>
        <div>
          <h1 className="text-3xl font-display font-extrabold text-foreground">Classroom</h1>
          <p className="text-muted-foreground font-bold">Teacher: {classroom.teacherName}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-display font-bold flex items-center gap-2 text-blue-600">
            <MessageSquare className="h-6 w-6" /> Announcements
          </h2>
          
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Card key={post.id} className="p-5 border-l-4 border-l-blue-500 bg-blue-50/30">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold text-blue-800">{post.authorName}</p>
                    <p className="text-sm font-bold text-muted-foreground">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-lg font-bold leading-relaxed">{post.content}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="p-8 text-center bg-muted/30 border-dashed border-2">
              <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2 opacity-50" />
              <p className="font-bold text-muted-foreground">No announcements from your teacher yet.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-display font-bold flex items-center gap-2 mb-4 text-primary">
              <BookOpen className="h-5 w-5" /> Your Classroom Quizzes
            </h2>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="p-3 bg-muted/30 rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <Badge variant="jungle" className="mb-1 capitalize">{a.lessonId}</Badge>
                      <p className="text-xs font-bold text-muted-foreground">
                        {a.status === 'in_progress' ? 'In progress — resume where you left off' : 'Not started — one attempt only'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="jungle"
                      onClick={() =>
                        setLocation(
                          buildStudentLessonHref({
                            lessonId: a.lessonId as import('@/lib/student/portal').PortalTopicId,
                            assignmentId: a.id,
                            classId: classroom.id,
                            returnTo: 'class',
                          }),
                        )}
                    >
                      {a.status === 'in_progress' ? 'Resume' : 'Start Quiz'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm font-bold text-muted-foreground text-center py-4">No pending assignments!</p>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

export function StudentClassDetail(_: { classId: string }) {
  return <StudentClassroomPage />;
}
