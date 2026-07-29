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
import { TeacherReportsClassComparison } from '@/components/teacher/reports/TeacherReportsClassComparison';
import { TeacherReportsRecentActivity } from '@/components/teacher/reports/TeacherReportsRecentActivity';
import { TeacherReportsWindowPicker } from '@/components/teacher/reports/TeacherReportsWindowPicker';
import { TeacherWorkspaceBoard } from '@/components/teacher/TeacherWorkspaceBoard';
import { TeacherClassCard } from '@/components/teacher/TeacherClassCard';
import { TeacherStudentListTable } from '@/components/teacher/TeacherStudentListTable';
import { TeacherStudentProgressTable } from '@/components/teacher/TeacherStudentProgressTable';
import {
  useClasses,
  useClassRoster,
  useCreateClass,
  useRemoveStudentFromClass,
  useTeacherReportsOverview,
} from '@/lib/hooks';
import { parseTeacherReportsWindow } from '@/lib/teacher-reports';
import type { TeacherClassStudent, TeacherClassSummary } from '@/lib/api';

export function TeacherClassesHome() {
  const { data, isLoading } = useClasses();
  const createClass = useCreateClass();
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [, setLocation] = useLocation();

  if (isLoading) {
    return <div className="p-8 text-center font-bold">Loading classes...</div>;
  }

  const classes = (data?.classes ?? []) as TeacherClassSummary[];

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">My Classes</h1>
          <p className="mt-2 font-bold text-muted-foreground">
            Open a class or create a new one.
          </p>
        </>
      )}
      action={<Button onClick={() => setIsCreating(true)}>+ Create Class</Button>}
    >
      {isCreating && (
        <Card className="mb-6 rounded-[24px] p-5">
          <form
            className="flex flex-col gap-4 md:flex-row md:items-end"
            onSubmit={async (event) => {
              event.preventDefault();
              if (!newClassName.trim()) {
                return;
              }
              await createClass.mutateAsync(newClassName.trim());
              setNewClassName('');
              setIsCreating(false);
            }}
          >
            <div className="flex-1 space-y-2">
              <Label htmlFor="teacher-class-name">Class Name</Label>
              <Input
                id="teacher-class-name"
                value={newClassName}
                onChange={(event) => setNewClassName(event.target.value)}
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={!newClassName.trim() || createClass.isPending}
              >
                {createClass.isPending ? 'Creating...' : 'Create'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {classes.length === 0 && !isCreating && (
        <Card className="mb-6 rounded-[24px] border-dashed p-8 text-center">
          <p className="font-bold text-muted-foreground">
            No classes yet. Create your first class to get started.
          </p>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {classes.map((klass) => (
          <TeacherClassCard
            key={klass.id}
            klass={klass}
            onEnter={() => setLocation(`/teacher/classes/${klass.id}`)}
          />
        ))}
      </div>
    </TeacherWorkspaceBoard>
  );
}

export function TeacherClassWorkspace({ classId }: { classId: string }) {
  const { data: classesData } = useClasses();
  const { data: rosterData, isLoading } = useClassRoster(classId);
  const removeStudent = useRemoveStudentFromClass();
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'students' | 'progress'>('students');
  const [pendingRemoval, setPendingRemoval] = useState<TeacherClassStudent | null>(null);

  const classes = (classesData?.classes ?? []) as TeacherClassSummary[];
  const klass = classes.find((row) => row.id === classId);
  const students = (rosterData?.students ?? []) as TeacherClassStudent[];

  if (isLoading || !klass) {
    return <div className="p-8 text-center font-bold">Loading class...</div>;
  }

  return (
    <TeacherWorkspaceBoard
      heading={(
        <>
          <h1 className="text-4xl font-display font-bold">{klass.name}</h1>
          <p className="mt-2 font-bold text-muted-foreground">Code: {klass.joinCode}</p>
        </>
      )}
      action={<Button variant="outline" onClick={() => setIsAddStudentsOpen(true)}>+ Add</Button>}
    >
      <TeacherAddStudentsDialog
        classId={classId}
        className={klass.name}
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
            <DialogTitle>Remove student from this class?</DialogTitle>
            <DialogDescription>
              This removes the student from the class only. Their account and progress stay intact.
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
                  classId,
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
