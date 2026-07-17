import React, { useState } from 'react';
import { useLocation, Link } from 'wouter';
import { useTeacherDashboard, useClasses, useCreateClass, useClassRoster, useAssignments, useCreateAssignment, useClassPosts, useCreatePost } from '@/lib/hooks';
import { Card, Button, Input, Label, Badge } from '@/components/ui';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Users, BookOpen, AlertTriangle, Plus, ArrowRight, UserPlus, CheckCircle2, MessageSquare } from 'lucide-react';
import { useLanguage } from '@/lib/useLanguage';
import { allTopics } from '@/data';

export function TeacherDashboard() {
  const { data: dashboard, isLoading } = useTeacherDashboard();
  const [, setLocation] = useLocation();

  if (isLoading) return <div className="p-8 text-center font-bold">Loading dashboard...</div>;
  if (!dashboard) return null;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Teacher Dashboard</h1>
        <p className="text-muted-foreground font-bold">Welcome back. Here's how your classes are doing.</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Total Students</p>
            <p className="text-3xl font-display font-bold">{dashboard.studentCount}</p>
          </div>
        </Card>
        
        <Card className="p-6 flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-jungle-orange/10 flex items-center justify-center text-jungle-orange">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <p className="text-sm font-bold text-muted-foreground">Active Classes</p>
            <p className="text-3xl font-display font-bold">{dashboard.classCount}</p>
          </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            Your Classes
          </h2>
          {dashboard.classes.length === 0 ? (
            <Card className="p-8 text-center bg-muted/50 border-dashed">
              <p className="font-bold text-muted-foreground mb-4">You haven't created any classes yet.</p>
              <Link href="/teacher/classes">
                <Button>Create a Class</Button>
              </Link>
            </Card>
          ) : (
            dashboard.classes.map(cls => (
              <Card key={cls.id} className="p-4 hover:border-primary transition-colors cursor-pointer group" onClick={() => setLocation(`/teacher/classes/${cls.id}`)}>
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg">{cls.name}</h3>
                    <p className="text-sm text-muted-foreground font-bold">{cls.studentCount} students • {cls.attemptCount} attempts</p>
                  </div>
                  <div className="flex items-center gap-4">
                    {cls.averageScorePct !== null && (
                      <div className="text-right">
                        <p className="text-sm font-bold text-muted-foreground">Avg Score</p>
                        <p className="font-display font-bold text-primary">{Math.round(cls.averageScorePct)}%</p>
                      </div>
                    )}
                    <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" /> Needs Attention
          </h2>
          {dashboard.strugglingLessons.length === 0 ? (
            <Card className="p-8 text-center bg-muted/50 border-dashed">
              <CheckCircle2 className="h-8 w-8 text-primary mx-auto mb-2" />
              <p className="font-bold text-muted-foreground">Students are doing great! No lessons are currently flagged as struggling.</p>
            </Card>
          ) : (
            dashboard.strugglingLessons.map(lesson => (
              <Card key={lesson.lessonId} className="p-4 border-l-4 border-l-destructive">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-lg capitalize">{lesson.lessonId}</h3>
                    <p className="text-sm text-muted-foreground font-bold">{lesson.attempts} recent attempts</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-muted-foreground">Avg Score</p>
                    <p className="font-display font-bold text-destructive">{Math.round(lesson.averageScorePct)}%</p>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
}

export function TeacherClasses() {
  const { data, isLoading } = useClasses();
  const createClass = useCreateClass();
  const [newClassName, setNewClassName] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [, setLocation] = useLocation();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newClassName.trim()) return;
    await createClass.mutateAsync(newClassName);
    setNewClassName('');
    setIsCreating(false);
  };

  if (isLoading) return <div className="p-8 text-center font-bold">Loading classes...</div>;
  const classes = (data?.classes || []) as import('@/lib/api').TeacherClassSummary[];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex justify-between items-end">
        <header>
          <h1 className="text-3xl font-display font-bold text-foreground">My Classes</h1>
          <p className="text-muted-foreground font-bold">Manage your class rosters and invite codes.</p>
        </header>
        {!isCreating && (
          <Button onClick={() => setIsCreating(true)} className="gap-2">
            <Plus className="h-4 w-4" /> New Class
          </Button>
        )}
      </div>

      {isCreating && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <form onSubmit={handleCreate} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label htmlFor="className">Class Name</Label>
              <Input 
                id="className" 
                placeholder="e.g. Morning Kindergarten" 
                value={newClassName}
                onChange={e => setNewClassName(e.target.value)}
                autoFocus
              />
            </div>
            <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>Cancel</Button>
            <Button type="submit" disabled={createClass.isPending || !newClassName.trim()} variant="jungle">
              {createClass.isPending ? 'Saving...' : 'Create'}
            </Button>
          </form>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {classes.map(cls => (
          <Card key={cls.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-xl font-bold mb-1">{cls.name}</h3>
                <p className="text-sm text-muted-foreground font-bold">{cls.studentCount} students</p>
              </div>
              <Badge variant="jungle" className="text-lg px-3 py-1 font-mono tracking-wider">
                {cls.joinCode}
              </Badge>
            </div>
            
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setLocation(`/teacher/classes/${cls.id}`)}>
                View Roster
              </Button>
            </div>
          </Card>
        ))}
        {classes.length === 0 && !isCreating && (
          <div className="col-span-full p-12 text-center text-muted-foreground font-bold">
            No classes yet. Click "New Class" to get started.
          </div>
        )}
      </div>
    </div>
  );
}

export function TeacherClassDetail({ classId }: { classId: string }) {
  const { data: classesData } = useClasses();
  const { data: rosterData, isLoading } = useClassRoster(classId);
  const { data: postsData } = useClassPosts(classId);
  const createAssignment = useCreateAssignment();
  const createPost = useCreatePost();
  
  const [assignLessonId, setAssignLessonId] = useState('');
  const [isAssigning, setIsAssigning] = useState(false);
  const [newPostContent, setNewPostContent] = useState('');
  const [isPosting, setIsPosting] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMessage, setDialogMessage] = useState('');

  const classes = (classesData?.classes || []) as import('@/lib/api').TeacherClassSummary[];
  const cls = classes.find(c => c.id === classId);
  const students = rosterData?.students || [];

  const handleAssign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignLessonId) return;
    await createAssignment.mutateAsync({ lessonId: assignLessonId, classId });
    setIsAssigning(false);
    setAssignLessonId('');
    setDialogMessage('Assignment sent to class!');
    setDialogOpen(true);
  };

  const handlePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPostContent.trim()) return;
    await createPost.mutateAsync({ classId, content: newPostContent });
    setIsPosting(false);
    setNewPostContent('');
  };

  if (isLoading || !cls) return <div className="p-8 text-center font-bold">Loading class...</div>;
  const posts = postsData?.posts || [];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center gap-4">
        <Link href="/teacher/classes">
          <Button variant="ghost" size="icon"><ArrowRight className="h-5 w-5 rotate-180" /></Button>
        </Link>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">{cls.name}</h1>
          <div className="text-muted-foreground font-bold flex items-center gap-2">
            Join Code: <Badge variant="jungle" className="font-mono">{cls.joinCode}</Badge>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <Button onClick={() => setIsAssigning(!isAssigning)} variant={isAssigning ? "outline" : "jungle"} className="gap-2">
          <BookOpen className="h-4 w-4" /> Assign Lesson to Class
        </Button>
        <Button onClick={() => setIsPosting(!isPosting)} variant={isPosting ? "outline" : "default"} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white">
          <MessageSquare className="h-4 w-4" /> Post Announcement
        </Button>
      </div>

      {isPosting && (
        <Card className="p-6 bg-blue-50 border-blue-200">
          <form onSubmit={handlePost} className="flex flex-col gap-4">
            <div className="space-y-2">
              <Label>Announcement Message</Label>
              <textarea 
                className="flex min-h-[80px] w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-base font-bold text-foreground focus-visible:outline-none focus-visible:border-blue-500"
                placeholder="Write a message to your students..."
                value={newPostContent}
                onChange={e => setNewPostContent(e.target.value)}
                required
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsPosting(false)}>Cancel</Button>
              <Button type="submit" disabled={createPost.isPending || !newPostContent.trim()} className="bg-blue-600 hover:bg-blue-700">
                {createPost.isPending ? 'Posting...' : 'Post Message'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {isAssigning && (
        <Card className="p-6 bg-primary/5 border-primary/20">
          <form onSubmit={handleAssign} className="flex gap-4 items-end">
            <div className="flex-1 space-y-2">
              <Label>Select Chapter</Label>
              <Select value={assignLessonId} onValueChange={setAssignLessonId} required>
                <SelectTrigger className="flex h-12 w-full rounded-xl border-2 border-input bg-background px-4 py-2 text-base font-bold text-foreground focus-visible:outline-none focus-visible:border-primary capitalize">
                  <SelectValue placeholder="-- Choose a chapter --" />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-2 shadow-lg">
                  {Object.keys(allTopics).map(topic => (
                    <SelectItem key={topic} value={topic} className="capitalize font-bold text-base py-3 cursor-pointer hover:bg-muted/50 transition-colors">
                      {topic}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="submit" disabled={createAssignment.isPending || !assignLessonId}>
              {createAssignment.isPending ? 'Sending...' : 'Send Assignment'}
            </Button>
          </form>
        </Card>
      )}

      {posts.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-xl font-display font-bold flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-blue-500" /> Recent Announcements
          </h2>
          <div className="grid gap-4">
            {posts.map((post: any) => (
              <Card key={post.id} className="p-4 border-l-4 border-l-blue-500 bg-blue-50/50">
                <div className="flex justify-between items-start mb-2">
                  <p className="font-bold text-sm text-blue-800">{post.authorName}</p>
                  <p className="text-xs text-muted-foreground font-bold">{new Date(post.createdAt).toLocaleDateString()}</p>
                </div>
                <p className="font-bold">{post.content}</p>
              </Card>
            ))}
          </div>
        </div>
      )}

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="p-4 font-bold text-muted-foreground">Student Name</th>
                <th className="p-4 font-bold text-muted-foreground text-center">Lessons Done</th>
                <th className="p-4 font-bold text-muted-foreground text-center">Avg Score</th>
                <th className="p-4 font-bold text-muted-foreground text-right">Last Active</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {students.map(student => (
                <tr key={student.id} className="border-b-2 border-border/50 hover:bg-muted/20">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center">
                        <UserPlus className="h-4 w-4" />
                      </div>
                      {student.fullName}
                    </div>
                  </td>
                  <td className="p-4 text-center">{student.lessonsCompleted}</td>
                  <td className="p-4 text-center">
                    {student.averageScorePct !== null ? (
                      <Badge variant={student.averageScorePct < 70 ? 'outline' : 'jungle'}>
                        {Math.round(student.averageScorePct)}%
                      </Badge>
                    ) : '-'}
                  </td>
                  <td className="p-4 text-right text-muted-foreground">
                    {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
                  </td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-8 text-center text-muted-foreground">
                    No students have joined this class yet. Share the join code!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Notification</DialogTitle>
            <DialogDescription className="font-bold text-base mt-2">
              {dialogMessage}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button>OK</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export function TeacherAssignments() {
  const { data, isLoading } = useAssignments();
  const { data: classesData } = useClasses();

  if (isLoading) return <div className="p-8 text-center font-bold">Loading assignments...</div>;
  const assignments = (data?.assignments || []) as import('@/lib/api').AssignmentForTeacher[];
  const classes = (classesData?.classes || []) as import('@/lib/api').TeacherClassSummary[];

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <header>
        <h1 className="text-3xl font-display font-bold text-foreground">Assignments</h1>
        <p className="text-muted-foreground font-bold">History of lessons you've assigned to classes or students.</p>
      </header>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted/50 border-b-2 border-border">
                <th className="p-4 font-bold text-muted-foreground">Topic</th>
                <th className="p-4 font-bold text-muted-foreground">Assigned To</th>
                <th className="p-4 font-bold text-muted-foreground text-right">Date</th>
              </tr>
            </thead>
            <tbody className="font-bold">
              {assignments.map(assign => (
                <tr key={assign.id} className="border-b-2 border-border/50 hover:bg-muted/20">
                  <td className="p-4 capitalize">
                    <Badge variant="jungle" className="capitalize">{assign.lessonId}</Badge>
                  </td>
                  <td className="p-4">{assign.className || 'Individual Student'}</td>
                  <td className="p-4 text-right text-muted-foreground">
                    {new Date(assign.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {assignments.length === 0 && (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-muted-foreground">
                    You haven't assigned any lessons yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
