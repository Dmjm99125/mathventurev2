export type TeacherOwnedClass = {
  id: string;
  teacherId: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
};

export type TeacherClassAccessPersistence = {
  getClass(teacherId: string, classId: string): Promise<TeacherOwnedClass | null>;
};

export async function getTeacherOwnedClass(
  persistence: TeacherClassAccessPersistence,
  teacherId: string,
  classId: string,
): Promise<TeacherOwnedClass> {
  const classroom = await persistence.getClass(teacherId, classId);
  if (!classroom) {
    throw new Error("Classroom not found.");
  }
  return classroom;
}

export function assertWritableTeacherClass(classroom: TeacherOwnedClass): void {
  if (classroom.archivedAt !== null) {
    throw new Error("This classroom is archived and read-only.");
  }
}
