import { Button, Card } from '@/components/ui';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import {
  useAssignments,
  useClassRoster,
  useTeacherClassroom,
  useTeacherReportsOverview,
} from '@/lib/api/hooks';
import type { AssignmentForTeacher, TeacherClassroomSummary } from '@/lib/api';
import { TeacherAttentionRail } from './TeacherAttentionRail';
import { TeacherClassroomSnapshot } from './TeacherClassroomSnapshot';
import { TeacherRecentActivity } from './TeacherRecentActivity';

export function TeacherToday({
  onAddStudents,
  onAssignQuiz,
  onViewStudent,
  viewError = null,
}: {
  onAddStudents(): void;
  onAssignQuiz(): void;
  onViewStudent(studentId: string): Promise<void>;
  viewError?: string | null;
}) {
  const classroomQuery = useTeacherClassroom();
  const rosterQuery = useClassRoster();
  const classroom = classroomQuery.data?.classroom as TeacherClassroomSummary | null | undefined;
  const assignmentsQuery = useAssignments(classroom?.id);
  const reportsQuery = useTeacherReportsOverview('30d');
  const students = rosterQuery.data?.students ?? [];
  const assignments = (assignmentsQuery.data?.assignments ?? []).filter(
    (assignment): assignment is AssignmentForTeacher => 'className' in assignment,
  );
  const isLoading = classroomQuery.isLoading || rosterQuery.isLoading || assignmentsQuery.isLoading || reportsQuery.isLoading;
  const error = classroomQuery.error ?? rosterQuery.error ?? assignmentsQuery.error ?? reportsQuery.error;

  const retry = () => {
    void Promise.all([
      classroomQuery.refetch(),
      rosterQuery.refetch(),
      assignmentsQuery.refetch(),
      reportsQuery.refetch(),
    ]);
  };

  const heading = (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">Today</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">
        See what needs your attention and choose the next step for your classroom.
      </p>
    </>
  );

  const actions = (
    <div className="flex w-full flex-col gap-2 sm:flex-row md:w-auto">
      <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 sm:w-auto" onClick={onAssignQuiz}>
        Assign quiz
      </Button>
      <Button type="button" variant="outline" className="w-full border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)] sm:w-auto" onClick={onAddStudents}>
        Add students
      </Button>
    </div>
  );

  if (isLoading) {
    return (
      <TeacherWorkspaceBoard heading={heading} action={actions}>
        <Card className="teacher-section border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8">
          <p className="font-semibold text-[var(--teacher-ink)]/70">Loading your classroom...</p>
        </Card>
      </TeacherWorkspaceBoard>
    );
  }

  if (!classroom) {
    return (
      <TeacherWorkspaceBoard heading={heading} action={actions}>
        <Card className="teacher-section border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-8">
          <h2 className="font-display text-2xl font-bold text-[var(--teacher-ink)]">Classroom unavailable</h2>
          <p className="mt-2 font-semibold text-[var(--teacher-ink)]/70">We could not load your classroom right now.</p>
          <Button type="button" variant="outline" className="mt-5 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" onClick={retry}>Retry</Button>
        </Card>
      </TeacherWorkspaceBoard>
    );
  }

  if (error || !reportsQuery.data) {
    return (
      <TeacherWorkspaceBoard heading={heading} action={actions}>
        <Card className="teacher-section border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-8">
          <h2 className="font-display text-2xl font-bold text-[var(--teacher-ink)]">Today is unavailable</h2>
          <p className="mt-2 font-semibold text-[var(--teacher-ink)]/70">{error instanceof Error ? error.message : 'We could not load your classroom activity right now.'}</p>
          <Button type="button" variant="outline" className="mt-5 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" onClick={retry}>Retry</Button>
        </Card>
      </TeacherWorkspaceBoard>
    );
  }

  return (
    <TeacherWorkspaceBoard heading={heading} action={actions}>
      <div className="grid gap-10">
        {viewError && (
          <Card className="teacher-section border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-5 font-semibold text-[var(--teacher-ink)]">
            {viewError}
          </Card>
        )}
        <TeacherClassroomSnapshot
          summary={reportsQuery.data.classroomSummary}
          studentCount={students.length}
          assignmentCount={assignments.length}
        />
        <TeacherAttentionRail
          attentionStudents={reportsQuery.data.attentionStudents}
          onViewStudent={(studentId) => {
            void onViewStudent(studentId);
          }}
        />
        <TeacherRecentActivity recentActivity={reportsQuery.data.recentActivity} />
      </div>
    </TeacherWorkspaceBoard>
  );
}
