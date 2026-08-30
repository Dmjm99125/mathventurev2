import React, { useState } from 'react';
import { useLocation } from 'wouter';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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

export function TeacherWorkspacePage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const {
    data: assignmentsData,
    isLoading: assignmentsLoading,
    error: assignmentsError,
    refetch,
  } = useAssignments(classroomData?.classroom && 'createdAt' in classroomData.classroom ? classroomData.classroom.id : undefined);
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'progress' | 'assignments'>('students');
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);

  const classroom = classroomData?.classroom as TeacherClassroomSummary | null;
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];
  const teacherAssignments = (assignmentsData?.assignments ?? []).filter(
    (assignment): assignment is AssignmentForTeacher => 'className' in assignment,
  );
  const assignedQuizzes = buildTeacherAssignedQuizzes(teacherAssignments, students);

  if (classroomLoading || rosterLoading || assignmentsLoading) {
    return <div className="p-8 text-center font-bold">Loading classroom...</div>;
  }

  if (!classroom) {
    return <div className="p-8 text-center font-bold">Classroom unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-3xl font-display font-bold sm:text-4xl">Classroom</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
            Manage your students and monitor progress in one place.
          </p>
        </>
      )}
      action={(
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
          <Button className="w-full sm:w-auto" variant="jungle" onClick={() => setIsAssignQuizOpen(true)}>
            Assign Quiz
          </Button>
          <Button className="w-full sm:w-auto" variant="outline" onClick={() => setIsAddStudentsOpen(true)}>
            + Add
          </Button>
        </div>
      )}
    >
      <TeacherAddStudentsDialog
        open={isAddStudentsOpen}
        onOpenChange={setIsAddStudentsOpen}
      />
      <TeacherAssignQuizDialog
        open={isAssignQuizOpen}
        onOpenChange={setIsAssignQuizOpen}
        classId={classroom.id}
      />

      <div className="mb-5 w-full max-w-sm">
        <label htmlFor="teacher-classroom-view" className="sr-only">Classroom view</label>
        <Select
          value={activeTab}
          onValueChange={(value) => setActiveTab(value as 'students' | 'progress' | 'assignments')}
        >
          <SelectTrigger id="teacher-classroom-view" className="h-12 rounded-2xl border-2 border-border bg-white px-4 font-bold">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="students">Student List</SelectItem>
            <SelectItem value="progress">Student Progress</SelectItem>
            <SelectItem value="assignments">Quizzes Assigned</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {activeTab === 'students' ? (
        <TeacherStudentListTable students={students} onRemove={setPendingRemoval} />
      ) : activeTab === 'progress' ? (
        <TeacherStudentProgressTable students={students} />
      ) : (
        <TeacherAssignedQuizzes
          assignments={assignedQuizzes}
          error={assignmentsError as Error | null}
          onRetry={() => {
            void refetch();
          }}
        />
      )}

      <Dialog
        open={pendingRemoval !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRemoval(null);
          }
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
              onClick={async () => {
                if (!pendingRemoval) {
                  return;
                }
                await removeStudent.mutateAsync({
                  studentId: pendingRemoval.id,
                });
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

export const TeacherClassesHome = TeacherWorkspacePage;

export function TeacherClassWorkspace(_: { classId: string }) {
  return <TeacherWorkspacePage />;
}

export function TeacherReportsPage() {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherReportsOverview(windowKey);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading reports...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-3xl font-display font-bold sm:text-4xl">Reports</h1>
          <p className="mt-2 text-sm font-bold text-muted-foreground sm:text-base">
            Review classroom performance, student activity, and topic mastery in one place.
          </p>
        </>
      )}
      action={data ? (
        <div className="w-full sm:w-auto [&_button]:w-full sm:[&_button]:w-auto">
          <TeacherClassReportPdfButton report={data} disabled={!data.hasData} />
        </div>
      ) : undefined}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports?window=${nextWindow}`)}
      />

      {error && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-destructive">
          {(error as Error).message || "We couldn't load reports right now."}
        </Card>
      )}

      {data && (
        <div className="grid gap-6">
          <TeacherReportsClassroomSummary summary={data.classroomSummary} />
          {data.hasData ? null : (
            <Card className="rounded-[24px] p-6 font-bold text-muted-foreground">
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

export const TeacherReportsOverviewPage = TeacherReportsPage;
export const TeacherReportsPlaceholder = TeacherReportsPage;

export function TeacherSettingsPlaceholder() {
  return (
    <TeacherWorkspaceBoard
      heading={<h1 className="text-3xl font-display font-bold sm:text-4xl">Settings</h1>}
    >
      <Card className="rounded-[24px] p-8 font-bold text-muted-foreground">
        Settings will be wired in the next teacher flow.
      </Card>
    </TeacherWorkspaceBoard>
  );
}
