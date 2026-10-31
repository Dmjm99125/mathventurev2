import { useState } from 'react';
import { Button } from '@/components/ui';
import { TeacherAssignQuizDialog } from '@/components/teacher/TeacherAssignQuizDialog';
import { TeacherAssignedQuizzes } from '@/components/teacher/TeacherAssignedQuizzes';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { useAssignments } from '@features/assignments/api/hooks';
import { useClassRoster, useTeacherClassroom } from '@features/classroom/api/hooks';
import type { AssignmentForTeacher, TeacherClassroomSummary } from '@/lib/api';
import { buildTeacherAssignedQuizzes } from '@features/teacher/model/assignments';
import { isArchivedClass } from '@features/teacher/model/classes';

function teacherPageHeading(title: string, description: string) {
  return (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">{description}</p>
    </>
  );
}

export function TeacherAssignmentsPage({ classId }: { classId: string }) {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom(classId);
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster(classId);
  const classroom = classroomData?.classroom as TeacherClassroomSummary | null | undefined;
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refetch,
    fetchNextPage: fetchNextAssignmentPage,
    hasNextPage: hasNextAssignmentPage,
    isFetchingNextPage: isFetchingNextAssignmentPage,
  } = useAssignments(classId);
  const readOnly = Boolean(classroom && isArchivedClass(classroom));
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);

  if (classroomLoading || rosterLoading || assignmentsLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading assignments...</div>;
  }

  if (!classroom) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Classroom unavailable.</div>;
  }

  const teacherAssignments = (assignmentsData?.pages.flatMap((page) => page.assignments) ?? []).filter(
    (assignment): assignment is AssignmentForTeacher => 'className' in assignment,
  );
  const students = rosterData?.pages.flatMap((page) => page.students) ?? [];

  return (
    <TeacherWorkspaceBoard
      classId={classId}
      readOnly={readOnly}
      heading={teacherPageHeading('Assignments', 'Create clear practice for your class and review what students have been assigned.')}
      action={!readOnly ? (
        <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 md:w-auto" onClick={() => setIsAssignQuizOpen(true)}>
          Assign quiz
        </Button>
      ) : undefined}
    >
      <TeacherAssignQuizDialog open={isAssignQuizOpen} onOpenChange={setIsAssignQuizOpen} classId={classroom.id} />
      <TeacherAssignedQuizzes
        assignments={buildTeacherAssignedQuizzes(teacherAssignments, students)}
        error={assignmentsError as Error | null}
        readOnly={readOnly}
        onRetry={() => {
          void refetch();
        }}
      />
      {hasNextAssignmentPage && (
        <div className="mt-4 flex justify-center">
          <Button
            type="button"
            variant="outline"
            className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
            onClick={() => void fetchNextAssignmentPage()}
            disabled={isFetchingNextAssignmentPage}
          >
            {isFetchingNextAssignmentPage ? 'Loading assignments...' : 'Load more assignments'}
          </Button>
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}
