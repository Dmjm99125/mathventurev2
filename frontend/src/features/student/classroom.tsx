import { useLocation } from 'wouter';
import { useStudentClassroom } from '@features/classroom/api/hooks';
import { useClassPosts } from '@features/posts/api/hooks';
import { useAssignments } from '@features/assignments/api/hooks';
import { Card, Button, Badge } from '@/components/ui';
import { MessageSquare, BookOpen, ArrowLeft } from 'lucide-react';
import type { AssignmentForStudent, StudentClassroomSummary } from '@/lib/api';
import { StudentPortalLoading } from '@/components/student/StudentPortalLoading';
import { StudentShell } from '@/components/student/StudentShell';
import { buildStudentLessonHref } from '@features/student/model/portal';
import { useLanguage } from '@features/i18n/context';
import { useAuth } from '@/lib/auth';

export function StudentClassroomPage() {
  const { isLoading: authLoading } = useAuth();
  const { data: classroomData, isLoading: classLoading } = useStudentClassroom();
  const classroom = (classroomData?.classroom ?? null) as StudentClassroomSummary | null;
  const { data: postsData, isLoading: postsLoading } = useClassPosts(classroom?.id ?? '');
  const { data: assignmentsData, isLoading: assignLoading } = useAssignments();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();

  if (authLoading || classLoading || postsLoading || assignLoading) {
    return <StudentPortalLoading />;
  }

  if (!classroom) {
    return (
      <StudentShell current="classroom">
        <div className="student-empty-state space-y-4 p-8 text-center">
          <p className="font-bold">Classroom not found.</p>
          <Button size="lg" variant="outline" onClick={() => setLocation('/student')}>{t('student.backToLessons')}</Button>
        </div>
      </StudentShell>
    );
  }

  const posts = postsData?.posts || [];
  const assignments = (assignmentsData?.pages.flatMap((page) => page.assignments) || []) as AssignmentForStudent[];

  return (
    <StudentShell current="classroom">
      <div className="student-classroom-page space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500 sm:space-y-8">
      <header className="student-classroom-header flex flex-col gap-4 rounded-[28px] p-5 sm:flex-row sm:items-center sm:p-6">
        <Button variant="outline" size="lg" className="w-full justify-start sm:w-auto" onClick={() => setLocation('/student')}>
          <ArrowLeft className="h-6 w-6 text-foreground" />
          {t('student.backToLessons')}
        </Button>
        <div>
          <h1 className="text-3xl font-display font-extrabold">Classroom</h1>
          <p className="font-bold opacity-75">Teacher: {classroom.teacherName}</p>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="student-section-title flex items-center gap-2 text-2xl font-display font-bold">
            <MessageSquare className="h-6 w-6" /> Announcements
          </h2>
          {posts.length > 0 ? (
            <div className="space-y-4">
              {posts.map((post: any) => (
                <Card key={post.id} className="student-announcement-card p-5 sm:p-6">
                  <div className="flex justify-between items-center mb-3">
                    <p className="font-bold">{post.authorName}</p>
                    <p className="text-sm font-bold opacity-70">{new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                  <p className="text-lg font-bold leading-relaxed">{post.content}</p>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="student-empty-state border-dashed p-8 text-center">
              <MessageSquare className="mx-auto mb-2 h-8 w-8 opacity-50" />
              <p className="font-bold opacity-75">No announcements from your teacher yet.</p>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card className="student-classroom-quizzes p-5 sm:p-6">
            <h2 className="student-section-title mb-4 flex items-center gap-2 text-xl font-display font-bold">
              <BookOpen className="h-5 w-5" /> Your Classroom Quizzes
            </h2>
            {assignments.length > 0 ? (
              <div className="space-y-3">
                {assignments.map(a => (
                  <div key={a.id} className="student-quiz-card flex flex-col items-stretch gap-4 rounded-2xl border-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-bold">{a.name || a.lessonId}</p>
                      <Badge variant="jungle" className="mb-1 capitalize">{a.lessonId}</Badge>
                      <p className="text-sm font-bold opacity-75">
                        {a.status === 'completed'
                          ? 'Completed - ' + a.score + ' / ' + a.maxScore
                          : a.status === 'in_progress'
                            ? 'In progress - resume where you left off'
                            : 'Not started - one attempt only'}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      variant="jungle"
                      className="w-full shrink-0 sm:w-auto"
                      onClick={() =>
                        setLocation(
                          buildStudentLessonHref({
                            lessonId: a.lessonId as import('@features/student/model/portal').PortalTopicId,
                            assignmentId: a.id,
                            classId: classroom.id,
                            returnTo: 'class',
                          }),
                        )}
                    >
                      {a.status === 'completed' ? 'View Result' : a.status === 'in_progress' ? 'Resume' : 'Start Quiz'}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-4 text-center text-sm font-bold opacity-75">No pending assignments!</p>
            )}
          </Card>
        </div>
      </div>
      </div>
    </StudentShell>
  );
}
