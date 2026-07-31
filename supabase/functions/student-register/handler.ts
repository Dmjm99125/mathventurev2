import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  normalizeTeacherFirstName,
  STUDENT_VERIFY_TYPE,
} from "../_shared/student_auth.ts";
import {
  defaultTeacherScopedStudentLookupPersistence,
  defaultHiddenStudentProvisionPersistence,
  findExistingStudentEmailInClass as findExistingStudentEmailInTeacherClass,
  findTeacherClassByFirstName as resolveTeacherClassByFirstName,
  normalizeStudentIdentity,
  provisionHiddenStudentForClass,
  type NormalizedStudentIdentity,
} from "../_shared/hidden_student_provision.ts";

type StudentRegisterSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentRegisterDeps = {
  findTeacherClassByFirstName(
    normalizedTeacherFirstName: string,
  ): Promise<{ teacherId: string; classId: string } | null | "ambiguous">;
  findExistingStudentEmailInClass(input: {
    classId: string;
    normalizedLastName: string;
    normalizedFirstName: string;
  }): Promise<string | null | "ambiguous">;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  issueStudentSession(email: string): Promise<StudentRegisterSession>;
};

const defaultDeps: StudentRegisterDeps = {
  async findTeacherClassByFirstName(normalizedTeacherFirstName) {
    return resolveTeacherClassByFirstName(
      defaultTeacherScopedStudentLookupPersistence,
      normalizedTeacherFirstName,
    );
  },
  async findExistingStudentEmailInClass(input) {
    return findExistingStudentEmailInTeacherClass(
      defaultTeacherScopedStudentLookupPersistence,
      input,
    );
  },
  async provisionStudentForClass(input) {
    return provisionHiddenStudentForClass(
      defaultHiddenStudentProvisionPersistence,
      input,
    );
  },
  async issueStudentSession(email) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
    });
    if (error || !data?.properties?.hashed_token) {
      throw error ?? new Error("Failed to generate student magic link");
    }
    return {
      status: "ok",
      email,
      tokenHash: data.properties.hashed_token,
      verifyType: STUDENT_VERIFY_TYPE,
    };
  },
};

export function createStudentRegisterHandler(deps: StudentRegisterDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const body = await req.json().catch(() => null);
      const normalizedTeacherFirstName = normalizeTeacherFirstName(
        typeof body?.teacherFirstName === "string" ? body.teacherFirstName : "",
      );
      const identity = normalizeStudentIdentity({
        lastName: typeof body?.lastName === "string" ? body.lastName : "",
        firstName: typeof body?.firstName === "string" ? body.firstName : "",
      });

      if (!normalizedTeacherFirstName || !identity) {
        return errorResponse(
          "Please enter the teacher's first name plus the student's last name and first name.",
          422,
        );
      }

      const teacherClass = await deps.findTeacherClassByFirstName(
        normalizedTeacherFirstName,
      );
      if (!teacherClass || teacherClass === "ambiguous") {
        return errorResponse("We couldn't find that teacher classroom.", 404);
      }

      const existingEmail = await deps.findExistingStudentEmailInClass({
        classId: teacherClass.classId,
        normalizedLastName: identity.normalizedLastName,
        normalizedFirstName: identity.normalizedFirstName,
      });
      if (existingEmail === "ambiguous") {
        return errorResponse(
          "We couldn't resolve that student in the teacher classroom.",
          409,
        );
      }
      if (existingEmail) {
        return jsonResponse(await deps.issueStudentSession(existingEmail), 201);
      }

      const created = await deps.provisionStudentForClass({
        classId: teacherClass.classId,
        identity,
      });
      return jsonResponse(await deps.issueStudentSession(created.email), 201);
    } catch (error) {
      console.error("student-register failed", error);
      return errorResponse("We couldn't register that student right now.", 500);
    }
  };
}
