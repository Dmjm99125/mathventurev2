import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  defaultHiddenStudentProvisionPersistence,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "../_shared/hidden_student_provision.ts";
import {
  assertWritableTeacherClass,
  type TeacherOwnedClass,
} from "../_shared/teacher_class_access.ts";

type ClassesAddStudentsDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass(
    teacherId: string,
    classId: string,
  ): Promise<TeacherOwnedClass | null>;
  hasStudentWithNormalizedName(
    normalizedLastName: string,
    normalizedFirstName: string,
  ): Promise<boolean>;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  deleteHiddenStudent(studentId: string): Promise<void>;
};

const defaultDeps: ClassesAddStudentsDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClass(teacherId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at, archived_at")
      .eq("id", classId)
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }
    if (!data?.length) return null;
    const classroom = data[0];
    return {
      id: classroom.id as string,
      teacherId: classroom.teacher_id as string,
      name: classroom.name as string,
      createdAt: classroom.created_at as string,
      archivedAt: (classroom.archived_at as string | null) ?? null,
    };
  },
  async hasStudentWithNormalizedName(normalizedLastName, normalizedFirstName) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("normalized_last_name", normalizedLastName)
      .eq("normalized_first_name", normalizedFirstName)
      .limit(1);

    if (error) {
      throw error;
    }

    return (data?.length ?? 0) > 0;
  },
  async provisionStudentForClass(input) {
    return provisionHiddenStudentForClass(
      defaultHiddenStudentProvisionPersistence,
      input,
    );
  },
  async deleteHiddenStudent(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient.auth.admin.deleteUser(studentId);

    if (error) {
      throw error;
    }
  },
};

function buildIdentityKey(identity: NormalizedStudentIdentity): string {
  return `${identity.normalizedLastName}:${identity.normalizedFirstName}`;
}

export function createClassesAddStudentsHandler(
  deps: ClassesAddStudentsDeps = defaultDeps,
) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) {
        return errorResponse("Unauthorized", 401);
      }
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers can add students", 403);
      }

      const body = await req.json().catch(() => null);
      const classId = typeof body?.classId === "string" ? body.classId.trim() : "";
      const students = Array.isArray(body?.students)
        ? body.students as Record<string, unknown>[]
        : [];

      if (!classId) {
        return errorResponse("classId is required", 422);
      }

      const classroom = await deps.getTeacherClass(profile.id, classId);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
      }
      try {
        assertWritableTeacherClass(classroom);
      } catch (error) {
        if (error instanceof Error && error.message === "This classroom is archived and read-only.") {
          return errorResponse("Archived classrooms are read-only", 409);
        }
        throw error;
      }

      if (!students.length) {
        return errorResponse("At least one student is required", 422);
      }

      const identities = students.map((student: Record<string, unknown>) =>
        normalizeStudentIdentity({
          lastName: typeof student?.lastName === "string" ? student.lastName : "",
          firstName: typeof student?.firstName === "string" ? student.firstName : "",
        })
      );

      if (identities.some((identity: NormalizedStudentIdentity | null) => identity === null)) {
        return errorResponse(
          "Every student row needs both Last Name and First Name.",
          422,
        );
      }

      const normalizedIdentities = identities as NormalizedStudentIdentity[];
      const seen = new Set<string>();
      for (const identity of normalizedIdentities) {
        const key = buildIdentityKey(identity);
        if (seen.has(key)) {
          return errorResponse("Each student name can appear only once per batch.", 409);
        }
        seen.add(key);
      }

      for (const identity of normalizedIdentities) {
        const existingStudent = await deps.hasStudentWithNormalizedName(
          identity.normalizedLastName,
          identity.normalizedFirstName,
        );
        if (existingStudent) {
          return errorResponse(
            `A student named ${identity.fullName} already exists.`,
            409,
          );
        }
      }

      const createdStudentIds: string[] = [];

      try {
        for (const identity of normalizedIdentities) {
          const created = await deps.provisionStudentForClass({
            classId: classroom.id,
            identity,
          });
          createdStudentIds.push(created.studentId);
        }
      } catch (error) {
        await Promise.allSettled(
          createdStudentIds.map((studentId) =>
            deps.deleteHiddenStudent(studentId)
          ),
        );
        throw error;
      }

      return jsonResponse({ createdCount: createdStudentIds.length }, 201);
    } catch (error) {
      console.error("classes-add-students failed", error);
      return errorResponse("We couldn't add those students right now.", 500);
    }
  };
}
