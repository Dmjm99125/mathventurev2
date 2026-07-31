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
import { TeacherReportsClassComparison } from '@/components/teacher/reports/TeacherReportsClassComparison';
import { TeacherReportsRecentActivity } from '@/components/teacher/reports/TeacherReportsRecentActivity';
import { TeacherReportsWindowPicker } from '@/components/teacher/reports/TeacherReportsWindowPicker';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { TeacherStudentListTable } from '@/components/teacher/TeacherStudentListTable';
import { TeacherStudentProgressTable } from '@/components/teacher/TeacherStudentProgressTable';
import {
  useClassRoster,
  useRemoveStudentFromClass,
  useTeacherClassroom,
  useTeacherClassReport,
  useTeacherReportsOverview,
} from '@/lib/hooks';
import { buildTeacherClassReportPageState } from '@/lib/teacher-class-report-page-state';
import { parseTeacherReportsWindow } from '@/lib/teacher-reports';
import type { TeacherClassStudent, TeacherClassroomSummary } from '@/lib/api';

export function TeacherWorkspacePage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'progress'>('students');
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);

  const classroom = classroomData?.classroom as TeacherClassroomSummary | null;
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];

  if (classroomLoading || rosterLoading) {
    return <div className="p-8 text-center font-bold">Loading classroom...</div>;
  }

  if (!classroom) {
    return <div className="p-8 text-center font-bold">Classroom unavailable.</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">Classroom</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Manage your students and monitor progress in one place.
          </p>
        </>
      )}
      action={<Button variant="outline" onClick={() => setIsAddStudentsOpen(true)}>+ Add</Button>}
    >
      <TeacherAddStudentsDialog
        open={isAddStudentsOpen}
        onOpenChange={setIsAddStudentsOpen}
      />

      <div className="mb-5 inline-flex rounded-2xl border-2 border-border bg-white p-1">
        <Button
          variant={activeTab === 'students' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('students')}
        >
          Student List
        </Button>
        <Button
          variant={activeTab === 'progress' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setActiveTab('progress')}
        >
          Student Progress
        </Button>
      </div>

      {activeTab === 'students' ? (
        <TeacherStudentListTable students={students} onRemove={setPendingRemoval} />
      ) : (
        <TeacherStudentProgressTable students={students} />
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

export function TeacherReportsOverviewPage() {
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
          <h1 className="text-4xl font-display font-bold">Reports</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Compare classes, find students who need attention, and open class reports.
          </p>
        </>
      )}
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
          <TeacherReportsClassComparison
            rows={data.classSummaries}
            onOpenClass={(classId) => setLocation(`/teacher/reports/classes/${classId}?window=${windowKey}`)}
          />
          <TeacherReportsAttentionList
            rows={data.attentionStudents}
            onOpenClass={(classId) => setLocation(`/teacher/reports/classes/${classId}?window=${windowKey}`)}
          />
          <TeacherReportsRecentActivity data={data.recentActivity} />
          <Card className="rounded-[24px] p-6 font-bold text-muted-foreground">
            PDF export is available from each class report.
          </Card>
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}

export const TeacherReportsPlaceholder = TeacherReportsOverviewPage;

export function TeacherClassReportPage({ classId }: { classId: string }) {
  const [location, setLocation] = useLocation();
  const windowKey = React.useMemo(
    () => parseTeacherReportsWindow(window.location.search),
    [location],
  );
  const { data, isLoading, error } = useTeacherClassReport(classId, windowKey);

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading class report...</div>;
  }

  const pageState = buildTeacherClassReportPageState({
    data: data ?? null,
    error,
  });
  const report = pageState.kind === 'ready' ? pageState.report : null;

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">{pageState.title}</h1>
          <p className="mt-2 font-bold text-muted-foreground">{pageState.subtitle}</p>
        </>
      )}
      action={report ? <TeacherClassReportPdfButton report={report} disabled={!report.hasData} /> : undefined}
    >
      <TeacherReportsWindowPicker
        value={windowKey}
        onChange={(nextWindow) => setLocation(`/teacher/reports/classes/${classId}?window=${nextWindow}`)}
      />

      {pageState.kind === 'error' && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-destructive">
          {pageState.message}
        </Card>
      )}

      {pageState.kind === 'empty' && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-muted-foreground">
          {pageState.message}
        </Card>
      )}

      {report && !report.hasData && (
        <Card className="mb-6 rounded-[24px] p-6 font-bold text-muted-foreground">
          No reportable game results exist for this class in the selected window.
        </Card>
      )}

      {report && (
        <div className="grid gap-6">
          <TeacherClassReportStudentTable rows={report.studentRows} />
          <TeacherClassReportTopicBreakdown rows={report.topicBreakdown} />
        </div>
      )}
    </TeacherWorkspaceBoard>
  );
}

export function TeacherSettingsPlaceholder() {
  return (
    <TeacherWorkspaceBoard
      heading={<h1 className="text-4xl font-display font-bold">Settings</h1>}
    >
      <Card className="rounded-[24px] p-8 font-bold text-muted-foreground">
        Settings will be wired in the next teacher flow.
      </Card>
    </TeacherWorkspaceBoard>
  );
}
