import { useState } from 'react';
import { TeacherAddStudentsDialog } from '@/components/teacher/add-students/TeacherAddStudentsDialog';
import { TeacherAssignQuizDialog } from '@/components/teacher/TeacherAssignQuizDialog';
import { TeacherToday } from '@/components/teacher/TeacherToday';
import { useTeacherClassroom } from '@features/classroom/api/hooks';
import type { TeacherClassroomSummary } from '@/lib/api';
import { isArchivedClass } from '@features/teacher/model/classes';
import { useTeacherStudentAccountActions } from '@features/teacher/account-actions';

export function TeacherTodayPage({ classId }: { classId: string }) {
  const classroomQuery = useTeacherClassroom(classId);
  const [isAddStudentsOpen, setIsAddStudentsOpen] = useState(false);
  const [isAssignQuizOpen, setIsAssignQuizOpen] = useState(false);
  const studentActions = useTeacherStudentAccountActions();
  const classroom = classroomQuery.data?.classroom as TeacherClassroomSummary | null | undefined;

  return (
    <>
      <TeacherToday
        classId={classId}
        readOnly={Boolean(classroom && isArchivedClass(classroom))}
        onAddStudents={() => setIsAddStudentsOpen(true)}
        onAssignQuiz={() => setIsAssignQuizOpen(true)}
        onViewStudent={studentActions.viewStudent}
        viewError={studentActions.viewError}
      />
      <TeacherAddStudentsDialog open={isAddStudentsOpen} onOpenChange={setIsAddStudentsOpen} classId={classId} />
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
