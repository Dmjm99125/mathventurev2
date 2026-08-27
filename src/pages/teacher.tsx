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
import { TeacherAssignQuizDialog } from '@/components/teacher/TeacherAssignQuizDialog';
import {
  useClassRoster,
  useRemoveStudentFromClass,
  useTeacherClassroom,
  useTeacherReportsOverview,
} from '@/lib/api/hooks';
import { parseTeacherReportsWindow } from '@/lib/teacher/reports';
import type { TeacherClassStudent, TeacherClassroomSummary } from '@/lib/api';

export function TeacherWorkspacePage() {
  const { data: classroomData, isLoading: classroomLoading } = useTeacherClassroom();
  const { data: rosterData, isLoading: rosterLoading } = useClassRoster();
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);
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
      action={(
        <div className="flex flex-wrap gap-2">
          <Button variant="jungle" onClick={() => setIsAssignQuizOpen(true)}>Assign Quiz</Button>
          <Button variant="outline" onClick={() => setIsAddStudentsOpen(true)}>+ Add</Button>
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
          <h1 className="text-4xl font-display font-bold">Reports</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Review classroom performance, student activity, and topic mastery in one place.
          </p>
        </>
      )}
      action={data ? <TeacherClassReportPdfButton report={data} disabled={!data.hasData} /> : undefined}
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
      heading={<h1 className="text-4xl font-display font-bold">Settings</h1>}
    >
      <Card className="rounded-[24px] p-8 font-bold text-muted-foreground">
        Settings will be wired in the next teacher flow.
      </Card>
    </TeacherWorkspaceBoard>
  );
}
