import type {
  AssignmentForTeacher,
  AssignmentQuizStatus,
  TeacherClassStudent,
  TeacherGameScore,
} from '@/lib/api/client';

export type TeacherAssignedQuizStudent = {
  id: string;
  fullName: string;
  firstName: string;
  lastName: string | null;
  status: AssignmentQuizStatus;
  overallScore: number | null;
  overallMaxScore: number | null;
  overallScorePct: number | null;
  gameScores: TeacherGameScore[];
};

export type TeacherAssignedQuiz = {
  assignment: AssignmentForTeacher;
  students: TeacherAssignedQuizStudent[];
};

export function buildTeacherAssignedQuizzes(
  assignments: AssignmentForTeacher[],
  students: TeacherClassStudent[],
): TeacherAssignedQuiz[] {
  return assignments.map((assignment) => ({
    assignment,
    students: students
      .filter((student) => assignment.studentId === null || assignment.studentId === student.id)
      .map((student) => {
        const score = student.assignments.find((item) => item.assignmentId === assignment.id);

        return {
          id: student.id,
          fullName: student.fullName,
          firstName: student.firstName,
          lastName: student.lastName,
          status: score?.status ?? 'not_started',
          overallScore: score?.overallScore ?? null,
          overallMaxScore: score?.overallMaxScore ?? null,
          overallScorePct: score?.overallScorePct ?? null,
          gameScores: score?.gameScores ?? [],
        };
      }),
  }));
}
