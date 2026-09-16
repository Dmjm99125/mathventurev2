export type AssignmentAccessRecord = {
  assignedBy: string;
  classId: string | null;
};

export function canTeacherManageAssignment(
  assignment: AssignmentAccessRecord,
  teacherId: string,
  teacherClassIds: string[],
): boolean {
  return assignment.assignedBy === teacherId
    || (assignment.classId !== null && teacherClassIds.includes(assignment.classId));
}
