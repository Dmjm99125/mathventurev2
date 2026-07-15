import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useStudentDashboard, useAssignments, useJoinClass, useClasses } from '@/lib/hooks';
import { Card, Button, Badge, Input, Label } from '@/components/ui';
import { Flame, Star, Trophy, Map as MapIcon, Play, CheckCircle2, History, Plus, MessageSquare, BookOpen, ArrowLeft } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import type { StudentClassSummary } from '@/lib/api';
import { useClassPosts } from '@/lib/hooks';
import { allTopics } from '@/data';

export function StudentDashboard() {
  const { data: dashboard, isLoading: dashLoading } = useStudentDashboard();
  const { data: assignmentsData, isLoading: assignLoading } = useAssignments();
  const { data: classesData } = useClasses();
  const joinClass = useJoinClass();
  const [joinCode, setJoinCode] = useState('');
  const [isJoining, setIsJoining] = useState(false);
  const [, setLocation] = useLocation();

  const handleJoinClass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    try {
      await joinClass.mutateAsync(joinCode);
      setJoinCode('');
      setIsJoining(false);
    } catch (err: any) {
      alert(err.message || 'Could not join class');
    }
  };

  if (dashLoading || assignLoading) return <div className="p-8 text-center font-bold">Loading your adventure...</div>;
  if (!dashboard) return null;

  const assignments = (assignmentsData?.assignments || []) as import('@/lib/api').AssignmentForStudent[];
  const pendingAssignments = assignments.filter(a => !a.completed);
  const myClasses = (classesData?.classes || []) as StudentClassSummary[];

  // Compute topic mastery from hardcoded catalog
  const recentAttempts = dashboard.recentAttempts || [];
  const byTopic: Record<string, { total: number; completed: number }> = {};
  
  Object.keys(allTopics).forEach(topic => {
    byTopic[topic] = { total: 1, completed: 0 }; // Treat each topic as 1 lesson chunk for simplicity
  });

  const completedLessonIds = new Set(recentAttempts.map((a: any) => a.lessonId));
  completedLessonIds.forEach(id => {
    if (byTopic[id]) {
      byTopic[id].completed = 1;
    }
  });

  const topicMastery = Object.entries(byTopic).map(([topic, v]) => ({
    topic,
    total: v.total,
    completed: v.completed,
    pct: v.total > 0 ? Math.round((v.completed / v.total) * 100) : 0,
  }));

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-jungle-orange/10 border-jungle-orange/20">
          <Flame className="h-8 w-8 text-jungle-orange mb-2" />
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Day Streak</span>
          <span className="text-3xl font-display font-extrabold text-jungle-orange">{dashboard.streakDays}</span>
        </Card>
        <Card className="p-4 flex flex-col items-center justify-center text-center bg-primary/10 border-primary/20">
          <Star className="h-8 w-8 text-primary mb-2" />
          <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider">Lessons Done</span>
          <span className="text-3xl font-display font-extrabold text-primary">{dashboard.completedLessons}</span>
        </Card>
        
        {topicMastery.slice(0, 2).map(mastery => (
          <Card key={mastery.topic} className="p-4 flex flex-col items-center justify-center text-center">
            <Trophy className={`h-8 w-8 mb-2 ${mastery.pct >= 80 ? 'text-jungle-yellow' : 'text-muted-foreground'}`} />
            <span className="text-sm font-bold text-muted-foreground uppercase tracking-wider capitalize">{mastery.topic}</span>
            <div className="w-full bg-muted rounded-full h-2 mt-2 mb-1">
              <div className="bg-primary h-2 rounded-full" style={{ width: `${mastery.pct}%` }} />
            </div>
            <span className="text-xs font-bold text-muted-foreground">{mastery.completed}/{mastery.total}</span>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          
          {/* Active Assignments */}
          <div className="space-y-4">
            <h2 className="text-2xl font-display font-bold flex items-center gap-2">
              <MapIcon className="h-6 w-6 text-primary" /> Your Quests
            </h2>
            {pendingAssignments.length > 0 ? (
              <div className="grid gap-4">
                {pendingAssignments.map(assignment => (
                  <Card key={assignment.id} className="p-4 flex sm:items-center justify-between flex-col sm:flex-row gap-4 border-2 border-primary/30 hover:border-primary transition-colors">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <Badge variant="jungle" className="capitalize">{assignment.lessonId}</Badge>
                        {assignment.dueAt && <span className="text-xs font-bold text-destructive">Due soon!</span>}
                      </div>
                      <h3 className="text-xl font-bold capitalize">Play {assignment.lessonId}</h3>
                      <p className="text-sm font-bold text-muted-foreground">Complete your assignment.</p>
                    </div>
                    <Button variant="jungle" size="lg" className="shrink-0 group" onClick={() => setLocation(`/student/lessons/${assignment.lessonId}?assignmentId=${assignment.id}`)}>
                      Play <Play className="h-5 w-5 ml-2 fill-current group-hover:scale-110 transition-transform" />
                    </Button>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-8 text-center bg-muted/30 border-dashed border-2">
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center mx-auto mb-4 shadow-sm rotate-3">
                  <CheckCircle2 className="h-8 w-8 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">All caught up!</h3>
                <p className="text-muted-foreground font-bold mb-4">You have no pending assignments from your teacher.</p>
                <Link href="/student/lessons">
                  <Button variant="outline" className="gap-2 bg-white">
                    <MapIcon className="h-4 w-4" /> Explore the Jungle Map
                  </Button>
                </Link>
              </Card>
            )}
          </div>

          {/* Map Entry Point */}
          <Card className="relative overflow-hidden rounded-3xl border-4 border-primary">
            <div className="absolute inset-0 bg-jungle-wood/10 z-0">
               {/* Could add a background image of a map here if we had one */}
               <div className="absolute top-10 left-10 w-32 h-32 bg-primary/20 rounded-full blur-3xl"></div>
               <div className="absolute bottom-10 right-10 w-40 h-40 bg-jungle-orange/20 rounded-full blur-3xl"></div>
            </div>
            <div className="relative z-10 p-8 md:p-12 flex flex-col items-center text-center">
              <h2 className="text-3xl md:text-4xl font-display font-extrabold text-foreground mb-4 text-shadow">Free Play Explorer</h2>
              <p className="text-lg font-bold text-foreground/80 mb-8 max-w-md">
                Want to practice on your own? Pick any lesson from the whole jungle catalog!
              </p>
              <Link href="/student/lessons">
                <Button size="lg" className="text-xl px-8 h-16 rounded-full shadow-lg shadow-primary/20 hover:scale-105 transition-transform bg-primary">
                  Open the Map <MapIcon className="ml-2 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </Card>
        </div>

        {/* Sidebar Column */}
        <div className="space-y-6">
          
          <Card className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-display font-bold text-xl">My Classes</h3>
              {!isJoining && (
                <Button variant="ghost" size="sm" onClick={() => setIsJoining(true)} className="h-8 w-8 p-0"><Plus className="h-5 w-5" /></Button>
              )}
            </div>

            {isJoining && (
              <form onSubmit={handleJoinClass} className="mb-4 flex gap-2">
                <Input 
                  placeholder="Join Code" 
                  value={joinCode} 
                  onChange={e => setJoinCode(e.target.value.toUpperCase())}
                  className="font-mono uppercase h-10 text-sm"
                  autoFocus
                />
                <Button type="submit" size="sm" variant="jungle" disabled={joinClass.isPending || !joinCode}>Join</Button>
              </form>
            )}

            {myClasses.length > 0 ? (
              <ul className="space-y-3">
                {myClasses.map(c => (
                  <li 
                    key={c.id} 
                    className="p-3 bg-muted/30 rounded-xl border border-border cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setLocation(`/student/classes/${c.id}`)}
                  >
                    <p className="font-bold">{c.name}</p>
                    <p className="text-xs text-muted-foreground font-bold">Teacher: {c.teacherName}</p>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-bold text-muted-foreground">You haven't joined any classes yet. Ask your teacher for a Join Code!</p>
            )}
          </Card>

          <Card className="p-6">
            <h3 className="font-display font-bold text-xl flex items-center gap-2 mb-4">
              <History className="h-5 w-5 text-muted-foreground" /> Recent Plays
            </h3>
            {dashboard.recentAttempts?.length > 0 ? (
              <ul className="space-y-4">
                {dashboard.recentAttempts.map((attempt: any, i: number) => (
                  <li key={i} className="flex justify-between items-center">
                    <div className="flex-1 min-w-0 pr-4">
                      <p className="font-bold text-sm truncate capitalize">{attempt.lessonId}</p>
                      <p className="text-xs text-muted-foreground font-bold capitalize">{attempt.lessonId}</p>
                    </div>
                    <Badge variant={attempt.score / attempt.maxScore >= 0.7 ? 'default' : 'secondary'}>
                      {Math.round((attempt.score / attempt.maxScore) * 100)}%
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm font-bold text-muted-foreground">No recent activity. Time to play!</p>
            )}
          </Card>

        </div>
      </div>
    </div>
  );
}

export function StudentLessons() {
  const { data: dashboard } = useStudentDashboard();
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
                onClick={() => setLocation(`/student/lessons/${topic}`)}
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

export function StudentClassDetail({ classId }: { classId: string }) {
  const { data: classesData, isLoading: classLoading } = useClasses();
  const { data: postsData, isLoading: postsLoading } = useClassPosts(classId);
  const { data: assignmentsData, isLoading: assignLoading } = useAssignments();
  const [, setLocation] = useLocation();

  if (classLoading || postsLoading || assignLoading) {
    return <div className="p-8 text-center font-bold">Loading class details...</div>;
  }

  const classes = (classesData?.classes || []) as StudentClassSummary[];
  const cls = classes.find(c => c.id === classId);

  if (!cls) {
    return (
      <div className="p-8 text-center space-y-4">
        <p className="font-bold text-muted-foreground">Class not found.</p>
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
          <h1 className="text-3xl font-display font-extrabold text-foreground">{cls.name}</h1>
          <p className="text-muted-foreground font-bold">Teacher: {cls.teacherName}</p>
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
              <BookOpen className="h-5 w-5" /> Your Pending Quests
            </h2>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="p-3 bg-muted/30 rounded-xl border border-border flex justify-between items-center">
                    <div>
                      <Badge variant="jungle" className="mb-1 capitalize">{a.lessonId}</Badge>
                      <p className="text-xs font-bold text-muted-foreground">Pending</p>
                    </div>
                    <Button size="sm" variant="jungle" onClick={() => setLocation(`/student/lessons/${a.lessonId}?assignmentId=${a.id}`)}>
                      Play
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
