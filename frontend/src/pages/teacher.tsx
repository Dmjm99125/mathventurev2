import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Button, Card, Input, Label } from '@/components/ui';
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
import { TeacherReportsAttentionList } from '@/components/teacher/reports/TeacherReportsAttentionList';
import { TeacherClassReportPdfButton } from '@/components/teacher/reports/TeacherClassReportPdfButton';
import { TeacherClassReportStudentTable } from '@/components/teacher/reports/TeacherClassReportStudentTable';
import { TeacherClassReportTopicBreakdown } from '@/components/teacher/reports/TeacherClassReportTopicBreakdown';
import { TeacherReportsClassroomSummary } from '@/components/teacher/reports/TeacherReportsClassroomSummary';
import { TeacherReportsRecentActivity } from '@/components/teacher/reports/TeacherReportsRecentActivity';
import { TeacherReportsWindowPicker } from '@/components/teacher/reports/TeacherReportsWindowPicker';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { TeacherStudentListTable } from '@/components/teacher/TeacherStudentListTable';
import { TeacherStudentProgressTable } from '@/components/teacher/TeacherStudentProgressTable';
import { TeacherAssignedQuizzes } from '@/components/teacher/TeacherAssignedQuizzes';
import { TeacherAssignQuizDialog } from '@/components/teacher/TeacherAssignQuizDialog';
import { TeacherToday } from '@/components/teacher/TeacherToday';
import { changeTeacherPassword, useAuth, signOut } from '@/lib/auth';
import {
  useAssignments,
  useClassRoster,
  useRemoveStudentFromClass,
  useTeacherClassroom,
  useTeacherReportsOverview,
} from '@/lib/api/hooks';
import { parseTeacherReportsWindow } from '@/lib/teacher/reports';
import type { AssignmentForTeacher, TeacherClassStudent, TeacherClassroomSummary } from '@/lib/api';
import { buildTeacherAssignedQuizzes } from '@/lib/teacher/assigned-quizzes';
import { useLanguage } from '@/lib/i18n/useLanguage';

function useTeacherStudentAccountActions() {
  const { viewStudentAccount, viewingStudent } = useAuth();
  const [, setLocation] = useLocation();
  const [viewError, setViewError] = useState<string | null>(null);
  const [viewingStudentId, setViewingStudentId] = useState<string | null>(null);

  const viewStudent = async (studentId: string) => {
    setViewError(null);
    setViewingStudentId(studentId);
    try {
      await viewStudentAccount(studentId);
      setLocation('/student');
    } catch (caught) {
      setViewError(
        caught instanceof Error
          ? caught.message
          : "We couldn't open that student account right now.",
      );
    } finally {
      setViewingStudentId(null);
    }
  };

  return {
    viewStudent,
    viewError,
    viewingStudent,
    viewingStudentId,
  };
}

function teacherPageHeading(title: string, description: string) {
  return (
    <>
      <p className="teacher-eyebrow">MathVenture teacher workspace</p>
      <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-[var(--teacher-ink)] sm:text-5xl">{title}</h1>
      <p className="mt-3 max-w-2xl text-base font-semibold leading-7 text-[var(--teacher-ink)]/70">{description}</p>
    </>
  );
}

export function TeacherTodayPage() {
  const classroomQuery = useTeacherClassroom();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);
  const studentActions = useTeacherStudentAccountActions();
  const classroom = classroomQuery.data?.classroom as TeacherClassroomSummary | null | undefined;

  return (
    <>
      <TeacherToday
        onAddStudents={() => setIsAddStudentsOpen(true)}
        onAssignQuiz={() => setIsAssignQuizOpen(true)}
        onViewStudent={studentActions.viewStudent}
        viewError={studentActions.viewError}
      />
      <TeacherAddStudentsDialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen} />
      {classroom && (
        <TeacherAssignQuizDialog
          open={isAssignQuizOpen}
          onOpenChange={setIsAssignQuizOpen}
          classId={classroom.id}
        />
      )}
    </>
  );
}

export function TeacherStudentsPage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'progress'>('students');
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);
  const studentActions = useTeacherStudentAccountActions();
  const classroom = classroomData?.classroom as TeacherClassroomSummary | null | undefined;
  const students = rosterData?.students ?? [];

  if (classroomLoading || rosterLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading students...</div>;
  }

  if (!classroom) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Classroom unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Students', 'Manage your roster, review progress, and open a student account when you need a closer look.')}
      action={(
        <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 md:w-auto" onClick={() => setIsAddStudentsOpen(true)}>
          Add students
        </Button>
      )}
    >
      <TeacherAddStudentsDialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen} />

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
        <TeacherStudentListTable
          students={students}
          onRemove={setPendingRemoval}
          onView={(student) => {
            void studentActions.viewStudent(student.id);
          }}
          viewingStudentId={studentActions.viewingStudent?.id ?? studentActions.viewingStudentId}
        />
      ) : (
        <TeacherStudentProgressTable students={students} />
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
                await removeStudent.mutateAsync({ studentId: pendingRemoval.id });
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

export function TeacherAssignmentsPage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const classroom = classroomData?.classroom as TeacherClassroomSummary | null | undefined;
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refetch,
  } = useAssignments(classroom?.id);
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);

  if (classroomLoading || rosterLoading || assignmentsLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading assignments...</div>;
  }

  if (!classroom) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Classroom unavailable.</div>;
  }

  const teacherAssignments = (assignmentsData?.assignments ?? []).filter(
    (assignment): assignment is AssignmentForTeacher => 'className' in assignment,
  );
  const students = rosterData?.students ?? [];

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Assignments', 'Create clear practice for your class and review what students have been assigned.')}
      action={(
        <Button type="button" className="w-full bg-[var(--teacher-terracotta)] text-[var(--teacher-sand)] hover:bg-[var(--teacher-terracotta)]/90 md:w-auto" onClick={() => setIsAssignQuizOpen(true)}>
          Assign quiz
        </Button>
      )}
    >
      <TeacherAssignQuizDialog open={isAssignQuizOpen} onOpenChange={setIsAssignQuizOpen} classId={classroom.id} />
      <TeacherAssignedQuizzes
        assignments={buildTeacherAssignedQuizzes(teacherAssignments, students)}
        error={assignmentsError as Error | null}
        onRetry={() => {
          void refetch();
        }}
      />
    </TeacherWorkspaceBoard>
  );
}

export function TeacherReportsPage() {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherReportsOverview(windowKey);

  if (isLoading) {
    return <div className="teacher-shell min-h-[calc(100dvh-4rem)] p-8 text-center font-semibold">Loading reports...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Reports', 'Review classroom performance, student activity, and topic mastery in one place.')}
      action={data ? (
        <div className="w-full md:w-auto [&_button]:w-full md:[&_button]:w-auto">
          <TeacherClassReportPdfButton report={data} disabled={!data.hasData} />
        </div>
      ) : undefined}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports?window=${nextWindow}`)}
      />

      {error && (
        <Card className="teacher-section mb-6 border-[var(--teacher-terracotta)]/35 bg-[var(--teacher-oat)]/55 p-6 font-semibold text-[var(--teacher-ink)]">
          {(error as Error).message || "We couldn't load reports right now."}
        </Card>
      )}

      {data && (
        <div className="grid gap-10">
          <TeacherReportsClassroomSummary summary={data.classroomSummary} />
          {data.hasData ? null : (
            <Card className="teacher-section border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 font-semibold text-[var(--teacher-ink)]">
              No reportable game results exist for this classroom in the selected window.
            </Card>
          )}
          <TeacherReportsAttentionList rows={data.attentionStudents} />
          <TeacherReportsRecentActivity data={data.recentActivity} />
          <TeacherClassReportStudentTable rows={data.studentRows} />
          <TeacherClassReportTopicBreakdown rows={data.topicBreakdown} />
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}

export function TeacherSettingsPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  const handleChangePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordMessage('');
    setIsChangingPassword(true);
    try {
      await changeTeacherPassword(currentPassword, newPassword, confirmPassword);
      setPasswordMessage('Your password has been changed.');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (caught) {
      setPasswordError(caught instanceof Error ? caught.message : 'Password change failed.');
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <TeacherWorkspaceBoard
      heading={teacherPageHeading('Settings', 'Manage the account details and session controls already available to you.')}
    >
      <section className="teacher-section max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="teacher-account-settings">
        <p className="teacher-eyebrow">Account</p>
        <h2 id="teacher-account-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Your teacher account</h2>
        <dl className="mt-6 grid gap-4 border-y border-[var(--teacher-moss)]/20 py-5 sm:grid-cols-[10rem_minmax(0,1fr)]">
          <dt className="text-sm font-bold text-[var(--teacher-ink)]/65">Name</dt>
          <dd className="font-semibold text-[var(--teacher-ink)]">{user?.full_name ?? 'Teacher'}</dd>
          <dt className="text-sm font-bold text-[var(--teacher-ink)]/65">Role</dt>
          <dd className="font-semibold text-[var(--teacher-ink)]">Teacher</dd>
        </dl>
        <Button type="button" variant="outline" className="mt-6 border-[var(--teacher-moss)]/30 text-[var(--teacher-ink)]" onClick={handleSignOut}>
          {t('common.logout')}
        </Button>
      </section>

      <section className="teacher-section mt-6 max-w-2xl border border-[var(--teacher-moss)]/20 bg-[var(--teacher-oat)]/55 p-6 sm:p-8" aria-labelledby="teacher-password-settings">
        <p className="teacher-eyebrow">Security</p>
        <h2 id="teacher-password-settings" className="mt-2 font-display text-2xl font-bold text-[var(--teacher-ink)]">Change your password</h2>
        <p className="mt-2 text-sm font-semibold text-[var(--teacher-ink)]/70">Enter your current password before choosing a new one.</p>
        <form onSubmit={handleChangePassword} className="mt-6 space-y-4">
          <div className="space-y-2">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              autoComplete="current-password"
              required
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              autoComplete="new-password"
              required
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Confirm new password</Label>
            <Input
              id="confirm-password"
              type="password"
              autoComplete="new-password"
              required
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
            />
          </div>
          {passwordMessage && <p className="text-primary text-sm font-bold">{passwordMessage}</p>}
          {passwordError && <p className="text-destructive text-sm font-bold">{passwordError}</p>}
          <Button type="submit" variant="jungle" disabled={isChangingPassword}>
            {isChangingPassword ? t('common.loading') : 'Change password'}
          </Button>
        </form>
      </section>
    </TeacherWorkspaceBoard>
  );
}

export const TeacherWorkspacePage = TeacherTodayPage;
export const TeacherClassesHome = TeacherStudentsPage;
export function TeacherClassWorkspace(_: { classId: string }) {
  return <TeacherStudentsPage />;
}
export const TeacherReportsOverviewPage = TeacherReportsPage;
export const TeacherReportsPlaceholder = TeacherReportsPage;
export const TeacherSettingsPlaceholder = TeacherSettingsPage;
