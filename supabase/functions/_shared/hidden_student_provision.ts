import {
  buildStudentEmail,
  normalizeFirstName,
  normalizeLastName,
  studentDisplayName,
} from "./student_auth.ts";

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
};

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
};

export async function provisionHiddenStudentForClass(
  persistence: HiddenStudentProvisionPersistence,
  input: { classId: string; identity: NormalizedStudentIdentity },
): Promise<{ studentId: string; email: string }> {
  const created = await persistence.createHiddenStudent({
    rawLastName: input.identity.rawLastName,
    rawFirstName: input.identity.rawFirstName,
  });

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

  return { studentId: created.id, email: created.email };
}
