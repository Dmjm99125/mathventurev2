import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  defaultHiddenStudentProvisionPersistence,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "../_shared/hidden_student_provision.ts";
import { getTeacherSingletonClass } from "../_shared/teacher_singleton_class.ts";

type ClassesAddStudentsDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClassroom(
    teacherId: string,
  ): Promise<{ id: string; teacherId: string; name: string } | null>;
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
  async getTeacherClassroom(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }
    const classrooms = (data ?? []).map((row) => ({
      id: row.id as string,
      teacherId: row.teacher_id as string,
      name: row.name as string,
      createdAt: row.created_at as string,
    }));
    if (!classrooms.length) {
      return null;
    }

    const classroom = await getTeacherSingletonClass(
      { listTeacherClasses: async () => classrooms },
      teacherId,
    );
    return { id: classroom.id, teacherId: classroom.teacherId, name: classroom.name };
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
      const students = Array.isArray(body?.students)
        ? body.students as Record<string, unknown>[]
        : [];

      if (!students.length) {
        return errorResponse("At least one student is required", 422);
      }

      const classroom = await deps.getTeacherClassroom(profile.id);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
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
