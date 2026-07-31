export const HIDDEN_CLASSROOM_NAME = "Classroom";

export type TeacherSingletonClass = {
  id: string;
  teacherId: string;
  name: string;
  createdAt: string;
};

export type TeacherSingletonClassPersistence = {
  listTeacherClasses(teacherId: string): Promise<TeacherSingletonClass[]>;
  insertTeacherClass(teacherId: string): Promise<TeacherSingletonClass>;
};

function assertSingleton(
  teacherId: string,
  classrooms: TeacherSingletonClass[],
): TeacherSingletonClass {
  if (classrooms.length !== 1) {
    throw new Error(`Expected exactly one classroom for teacher ${teacherId}.`);
  }

  return classrooms[0];
}

export async function ensureTeacherSingletonClass(
  persistence: TeacherSingletonClassPersistence,
  teacherId: string,
): Promise<TeacherSingletonClass> {
  const existing = await persistence.listTeacherClasses(teacherId);
  if (existing.length === 0) {
    return persistence.insertTeacherClass(teacherId);
  }

  return assertSingleton(teacherId, existing);
}

export async function getTeacherSingletonClass(
  persistence: Pick<TeacherSingletonClassPersistence, "listTeacherClasses">,
  teacherId: string,
): Promise<TeacherSingletonClass> {
  return assertSingleton(teacherId, await persistence.listTeacherClasses(teacherId));
}
