import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import { STUDENT_VERIFY_TYPE } from "../_shared/student_auth.ts";

export type StudentSessionPayload = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentViewAsDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  isStudentInTeacherClass(input: { teacherId: string; studentId: string }): Promise<boolean>;
  getStudentEmail(studentId: string): Promise<string | null>;
  issueStudentSession(email: string): Promise<StudentSessionPayload>;
};

const defaultDeps: StudentViewAsDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async isStudentInTeacherClass({ teacherId, studentId }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("student_id, profiles!inner(role), classes!inner(teacher_id)")
      .eq("student_id", studentId)
      .eq("profiles.role", "student")
      .eq("classes.teacher_id", teacherId)
      .limit(1);

    if (error) {
      throw error;
    }

    return (data?.length ?? 0) > 0;
  },
  async getStudentEmail(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient.auth.admin.getUserById(studentId);
    if (error || !data.user?.email) {
      return null;
    }
    return data.user.email;
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

export function createStudentViewAsHandler(
  deps: StudentViewAsDeps = defaultDeps,
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
        return errorResponse("Only teachers can view student accounts", 403);
      }

      const body = await req.json().catch(() => null);
      const studentId = typeof body?.studentId === "string"
        ? body.studentId.trim()
        : "";
      if (!studentId) {
        return errorResponse("A student account is required", 422);
      }

      const isMember = await deps.isStudentInTeacherClass({
        teacherId: profile.id,
        studentId,
      });
      if (!isMember) {
        return errorResponse("That student is not in your classroom", 403);
      }

      const email = await deps.getStudentEmail(studentId);
      if (!email) {
        return errorResponse("Student account not found", 404);
      }

      return jsonResponse(await deps.issueStudentSession(email));
    } catch (error) {
      console.error("student-view-as failed", error);
      return errorResponse("We couldn't open that student account right now.", 500);
    }
  };
}
