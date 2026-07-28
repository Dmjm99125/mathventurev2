import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
} from '@/components/ui/drawer';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAddStudentsToClass } from '@/lib/hooks';
import {
  createInitialTeacherAddStudentsFlowState,
  teacherAddStudentsFlowReducer,
} from '@/lib/teacher-add-students-flow';
import { TeacherAddStudentsImportStep } from './TeacherAddStudentsImportStep';
import { TeacherAddStudentsManualEditor } from './TeacherAddStudentsManualEditor';
import { TeacherAddStudentsResultStep } from './TeacherAddStudentsResultStep';
import { TeacherAddStudentsReviewTable } from './TeacherAddStudentsReviewTable';
import { TeacherAddStudentsSourcePicker } from './TeacherAddStudentsSourcePicker';

export function TeacherAddStudentsDialog({
  classId,
  className,
  open,
  onOpenChange,
}: {
  classId: string;
  className: string;
  open: boolean;
  onOpenChange(open: boolean): void;
}) {
  const isMobile = useIsMobile();
  const addStudents = useAddStudentsToClass();
  const [state, dispatch] = React.useReducer(
    teacherAddStudentsFlowReducer,
    undefined,
    createInitialTeacherAddStudentsFlowState,
  );
  const [error, setError] = React.useState<string | null>(null);

  const handleOpenChange = (nextOpen: boolean) => {
    onOpenChange(nextOpen);
    if (!nextOpen) {
      setError(null);
      dispatch({ type: 'reset' });
    }
  };

  const handleConfirm = async () => {
    try {
      setError(null);
      const result = await addStudents.mutateAsync({
        classId,
        students: state.rows,
      });
      dispatch({ type: 'submission.succeeded', result });
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "We couldn't add those students right now.",
      );
    }
  };

  const content = (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {state.step === 'source' && (
        <TeacherAddStudentsSourcePicker
          onSelect={(source) => {
            setError(null);
            dispatch({ type: 'source.selected', source });
          }}
        />
      )}

      {state.step === 'entry' && state.source === 'manual' && (
        <TeacherAddStudentsManualEditor
          initialRows={state.rows}
          onBack={() => {
            setError(null);
            dispatch({ type: 'reset' });
          }}
          onContinue={(rows) => {
            setError(null);
            dispatch({ type: 'rows.prepared', rows });
          }}
        />
      )}

      {state.step === 'entry' &&
        (state.source === 'xlsx' || state.source === 'json') && (
          <TeacherAddStudentsImportStep
            source={state.source}
            onBack={() => {
              setError(null);
              dispatch({ type: 'reset' });
            }}
            onContinue={(rows) => {
              setError(null);
              dispatch({ type: 'rows.prepared', rows });
            }}
          />
        )}

      {state.step === 'review' && (
        <TeacherAddStudentsReviewTable
          rows={state.rows}
          isSubmitting={addStudents.isPending}
          error={error}
          onBack={() => {
            setError(null);
            dispatch({ type: 'review.back' });
          }}
          onConfirm={handleConfirm}
        />
      )}

      {state.step === 'result' && state.result && (
        <TeacherAddStudentsResultStep
          result={state.result}
          onDone={() => handleOpenChange(false)}
        />
      )}
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={handleOpenChange}>
        <DrawerContent className="h-[100dvh] rounded-none border-0 px-4 pb-6">
          <DrawerHeader className="px-0 pt-6 text-left">
            <DrawerTitle>Add Students</DrawerTitle>
            <DrawerDescription>
              Add students to {className} and review everything before
              creation.
            </DrawerDescription>
          </DrawerHeader>
          {content}
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-hidden p-0">
        <div className="flex min-h-[36rem] flex-col p-6">
          <DialogHeader>
            <DialogTitle>Add Students</DialogTitle>
            <DialogDescription>
              Add students to {className} and review everything before
              creation.
            </DialogDescription>
          </DialogHeader>
          {content}
        </div>
      </DialogContent>
    </Dialog>
  );
}
