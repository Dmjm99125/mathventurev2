import { useState } from 'react';
import { Button, Card } from '@/components/ui';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { TeacherAddStudentsDialog } from '@/components/teacher/add-students/TeacherAddStudentsDialog';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { TeacherStudentListTable } from '@/components/teacher/TeacherStudentListTable';
import { TeacherStudentProgressTable } from '@/components/teacher/TeacherStudentProgressTable';
import { useClassRoster, useRemoveStudentFromClass, useTeacherClassroom } from '@features/classroom/api/hooks';
import type { TeacherClassStudent, TeacherClassroomSummary } from '@/lib/api';
import { isArchivedClass } from '@features/teacher/model/classes';
import { useTeacherStudentAccountActions } from '@features/teacher/account-actions';

function teacherPageHeading(title: string, description: string) {
  return (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">{description}</p>
    </>
  );
}

export function TeacherStudentsPage({ classId }: { classId: string }) {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom(classId);
  const {
    data: rosterData,
    isLoading: rosterLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useClassRoster(classId);
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'progress'>('students');
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);
  const studentActions = useTeacherStudentAccountActions();
  const classroom = classroomData?.classroom as TeacherClassroomSummary | null | undefined;
  const readOnly = Boolean(classroom && isArchivedClass(classroom));
  const students = rosterData?.pages.flatMap((page) => page.students) ?? [];

  if (classroomLoading || rosterLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading students...</div>;
  }

  if (!classroom) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Classroom unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Students', 'Manage your roster, review progress, and open a student account when you need a closer look.')}
      classId={classId}
      readOnly={readOnly}
      action={!readOnly ? (
        <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 md:w-auto" onClick={() => setIsAddStudentsOpen(true)}>
          Add students
        </Button>
      ) : undefined}
    >
      <TeacherAddStudentsDialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen} classId={classId} />

      {studentActions.viewError && (
        <Card className="teacher-section mb-6 border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-5 font-semibold text-[var(--teacher-ink)]">
          {studentActions.viewError}
        </Card>
      )}

      <div role="tablist" aria-label="Student information" className="mb-6 flex w-fit flex-wrap gap-1 border-b border-[var(--teacher-moss)]/20">
        {([
          ['students', 'Student list'],
          ['progress', 'Student progress'],
        ] as const).map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={activeTab === value}
            className={`border-b-2 px-4 py-3 text-sm font-bold transition-colors ${activeTab === value ? 'border-[var(--teacher-terracotta)] text-[var(--teacher-ink)]' : 'border-transparent text-[var(--teacher-ink)]/60 hover:text-[var(--teacher-ink)]'}`}
            onClick={() => setActiveTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {activeTab === 'students' ? (
        <>
          <TeacherStudentListTable
            students={students}
            onRemove={readOnly ? undefined : setPendingRemoval}
            onView={(student) => {
              void studentActions.viewStudent(student.id);
            }}
            viewingStudentId={studentActions.viewingStudent?.id ?? studentActions.viewingStudentId}
          />
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading students...' : 'Load more students'}
              </Button>
            </div>
          )}
        </>
      ) : (
        <>
        <TeacherStudentProgressTable students={students} classId={classId} />
          {hasNextPage && (
            <div className="mt-4 flex justify-center">
              <Button
                type="button"
                variant="outline"
                className="border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]"
                onClick={() => void fetchNextPage()}
                disabled={isFetchingNextPage}
              >
                {isFetchingNextPage ? 'Loading students...' : 'Load more students'}
              </Button>
            </div>
          )}
        </>
      )}

      <Dialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) setPendingRemoval(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Remove student from your classroom?</DialogTitle>
            <DialogDescription>
              This removes the student from your classroom only. Their account and progress stay intact.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="ghost">Cancel</Button>
            </DialogClose>
            <Button
              variant="danger"
              disabled={removeStudent.isPending}
              onClick={async () => {
                if (!pendingRemoval) return;
                await removeStudent.mutateAsync({ classId, studentId: pendingRemoval.id });
                setPendingRemoval(null);
              }}
            >
              Remove
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </TeacherWorkspaceBoard>
  );
}
