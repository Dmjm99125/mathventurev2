import {
  buildStudentEmail,
  normalizeFirstName,
  normalizeLastName,
  normalizeTeacherFirstName,
  studentDisplayName,
} from "./student_auth.ts";
import {
  getTeacherSingletonClass,
  type TeacherSingletonClass,
} from "./teacher_singleton_class.ts";

export type NormalizedStudentIdentity = {
  rawLastName: string;
  rawFirstName: string;
  normalizedLastName: string;
  normalizedFirstName: string;
  fullName: string;
};

export type HiddenStudentProvisionPersistence = {
  createHiddenStudent(input: {
    rawLastName: string;
    rawFirstName: string;
  }): Promise<{ id: string; email: string }>;
  updateStudentProfile(input: {
    studentId: string;
    rawLastName: string;
    normalizedLastName: string;
    rawFirstName: string;
    normalizedFirstName: string;
  }): Promise<void>;
  enrollStudent(input: { classId: string; studentId: string }): Promise<void>;
  deleteHiddenStudent(studentId: string): Promise<void>;
};

export type TeacherScopedStudentLookupPersistence = {
  listTeachersByNormalizedFirstName(
    normalizedTeacherFirstName: string,
  ): Promise<Array<{ id: string }>>;
  listTeacherClasses(teacherId: string): Promise<TeacherSingletonClass[]>;
  listStudentIdsInClassByNormalizedName(input: {
    classId: string;
    normalizedLastName: string;
    normalizedFirstName: string;
  }): Promise<string[]>;
  getStudentEmail(studentId: string): Promise<string>;
};

type TeacherProfileNameRow = {
  id: string;
  first_name: string | null;
  normalized_first_name: string | null;
  full_name: string | null;
};

type ClassStudentLookupRow = {
  student_id: string;
};

type TeacherClassMatch = {
  teacherId: string;
  classId: string;
};

function normalizeTeacherProfileFirstName(profile: TeacherProfileNameRow): string {
  if (profile.normalized_first_name) {
    return normalizeTeacherFirstName(profile.normalized_first_name);
  }
  if (profile.first_name) {
    return normalizeTeacherFirstName(profile.first_name);
  }

  const normalizedFullName = profile.full_name?.trim().replace(/\s+/g, " ") ?? "";
  if (!normalizedFullName) {
    return "";
  }

  const [firstName = ""] = normalizedFullName.split(" ");
  return normalizeTeacherFirstName(firstName);
}

export function normalizeStudentIdentity(
  input: { lastName: string; firstName: string },
): NormalizedStudentIdentity | null {
  const rawLastName = input.lastName.trim().replace(/\s+/g, " ");
  const rawFirstName = input.firstName.trim().replace(/\s+/g, " ");
  const normalizedLastName = normalizeLastName(rawLastName);
  const normalizedFirstName = normalizeFirstName(rawFirstName);

  if (!normalizedLastName || !normalizedFirstName) {
    return null;
  }

  return {
    rawLastName,
    rawFirstName,
    normalizedLastName,
    normalizedFirstName,
    fullName: studentDisplayName(rawLastName, rawFirstName),
  };
}

export const defaultHiddenStudentProvisionPersistence: HiddenStudentProvisionPersistence = {
  async createHiddenStudent({ rawLastName, rawFirstName }) {
    const { adminClient } = await import("./client.ts");
    const email = buildStudentEmail(crypto.randomUUID());
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: studentDisplayName(rawLastName, rawFirstName),
        first_name: rawFirstName,
        last_name: rawLastName,
      },
    });

    if (error || !data.user) {
      throw error ?? new Error("Failed to create student auth user");
    }

    return { id: data.user.id, email };
  },
  async updateStudentProfile({
    studentId,
    rawLastName,
    normalizedLastName,
    rawFirstName,
    normalizedFirstName,
  }) {
    const { adminClient } = await import("./client.ts");
    const { error } = await adminClient
      .from("profiles")
      .update({
        full_name: studentDisplayName(rawLastName, rawFirstName),
        first_name: rawFirstName,
        normalized_first_name: normalizedFirstName,
        last_name: rawLastName,
        normalized_last_name: normalizedLastName,
      })
      .eq("id", studentId);

    if (error) {
      throw error;
    }
  },
  async enrollStudent({ classId, studentId }) {
    const { adminClient } = await import("./client.ts");
    const { error } = await adminClient
      .from("class_students")
      .insert({ class_id: classId, student_id: studentId });

    if (error) {
      throw error;
    }
  },
  async deleteHiddenStudent(studentId) {
    const { adminClient } = await import("./client.ts");
    const { error } = await adminClient.auth.admin.deleteUser(studentId);

    if (error) {
      throw error;
    }
  },
};

export const defaultTeacherScopedStudentLookupPersistence: TeacherScopedStudentLookupPersistence = {
  async listTeachersByNormalizedFirstName(normalizedTeacherFirstName) {
    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id, first_name, normalized_first_name, full_name")
      .eq("role", "teacher");

    if (error) {
      throw error;
    }

    return ((data ?? []) as TeacherProfileNameRow[])
      .filter((profile) =>
        normalizeTeacherProfileFirstName(profile) === normalizedTeacherFirstName
      )
      .map((profile) => ({ id: profile.id }));
  },
  async listTeacherClasses(teacherId) {
    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }

    return (data ?? []).map((row) => ({
      id: row.id as string,
      teacherId: row.teacher_id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
  },
  async listStudentIdsInClassByNormalizedName(input) {
    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select(
        "student_id, profiles!inner(role, normalized_last_name, normalized_first_name)",
      )
      .eq("class_id", input.classId)
      .eq("profiles.role", "student")
      .eq("profiles.normalized_last_name", input.normalizedLastName)
      .eq("profiles.normalized_first_name", input.normalizedFirstName);

    if (error) {
      throw error;
    }

    return ((data ?? []) as ClassStudentLookupRow[]).map((row) => row.student_id);
  },
  async getStudentEmail(studentId) {
    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient.auth.admin.getUserById(studentId);

    if (error || !data.user.email) {
      throw error ?? new Error("Failed to load student auth user");
    }

    return data.user.email;
  },
};

export async function findTeacherClassByFirstName(
  persistence: Pick<
    TeacherScopedStudentLookupPersistence,
    "listTeachersByNormalizedFirstName" | "listTeacherClasses"
  >,
  normalizedTeacherFirstName: string,
): Promise<TeacherClassMatch | null | "ambiguous"> {
  const teachers = await persistence.listTeachersByNormalizedFirstName(
    normalizedTeacherFirstName,
  );

  if (teachers.length === 0) {
    return null;
  }
  if (teachers.length > 1) {
    return "ambiguous";
  }

  const classroom = await getTeacherSingletonClass(persistence, teachers[0].id);
  return {
    teacherId: teachers[0].id,
    classId: classroom.id,
  };
}

export async function findExistingStudentEmailInClass(
  persistence: Pick<
    TeacherScopedStudentLookupPersistence,
    "listStudentIdsInClassByNormalizedName" | "getStudentEmail"
  >,
  input: {
    classId: string;
    normalizedLastName: string;
    normalizedFirstName: string;
  },
): Promise<string | null | "ambiguous"> {
  const studentIds = await persistence.listStudentIdsInClassByNormalizedName(input);

  if (studentIds.length === 0) {
    return null;
  }
  if (studentIds.length > 1) {
    return "ambiguous";
  }

  return persistence.getStudentEmail(studentIds[0]);
}

export async function findStudentEmailByTeacherAndName(
  persistence: TeacherScopedStudentLookupPersistence,
  input: {
    normalizedTeacherFirstName: string;
    normalizedLastName: string;
    normalizedFirstName: string;
  },
): Promise<string | null | "ambiguous"> {
  const teacherClass = await findTeacherClassByFirstName(
    persistence,
    input.normalizedTeacherFirstName,
  );

  if (!teacherClass || teacherClass === "ambiguous") {
    return teacherClass;
  }

  return findExistingStudentEmailInClass(persistence, {
    classId: teacherClass.classId,
    normalizedLastName: input.normalizedLastName,
    normalizedFirstName: input.normalizedFirstName,
  });
}

export async function provisionHiddenStudentForClass(
  persistence: HiddenStudentProvisionPersistence,
  input: { classId: string; identity: NormalizedStudentIdentity },
): Promise<{ studentId: string; email: string }> {
  const created = await persistence.createHiddenStudent({
    rawLastName: input.identity.rawLastName,
    rawFirstName: input.identity.rawFirstName,
  });

  try {
    await persistence.updateStudentProfile({
      studentId: created.id,
      rawLastName: input.identity.rawLastName,
      normalizedLastName: input.identity.normalizedLastName,
      rawFirstName: input.identity.rawFirstName,
      normalizedFirstName: input.identity.normalizedFirstName,
    });

    await persistence.enrollStudent({
      classId: input.classId,
      studentId: created.id,
    });
  } catch (error) {
    await Promise.allSettled([persistence.deleteHiddenStudent(created.id)]);
    throw error;
  }

  return { studentId: created.id, email: created.email };
}
