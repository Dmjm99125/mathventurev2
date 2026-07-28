import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  normalizeClassCode,
  STUDENT_VERIFY_TYPE,
} from "../_shared/student_auth.ts";
import {
  defaultHiddenStudentProvisionPersistence,
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
  findClassByCode(joinCode: string): Promise<{ id: string; name: string } | null>;
  hasStudentWithNormalizedName(normalizedLastName: string, normalizedFirstName: string): Promise<boolean>;
  provisionStudentForClass(input: {
    classId: string;
    identity: NormalizedStudentIdentity;
  }): Promise<{ studentId: string; email: string }>;
  issueStudentSession(email: string): Promise<StudentRegisterSession>;
};

const defaultDeps: StudentRegisterDeps = {
  async findClassByCode(joinCode) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, name")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (error) throw error;
    return data;
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
    if (error) throw error;
    return (data?.length ?? 0) > 0;
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
      const normalizedClassCode = normalizeClassCode(typeof body?.classCode === "string" ? body.classCode : "");
      const identity = normalizeStudentIdentity({
        lastName: typeof body?.lastName === "string" ? body.lastName : "",
        firstName: typeof body?.firstName === "string" ? body.firstName : "",
      });

      if (!normalizedClassCode) {
        return errorResponse("We couldn't find that class code.", 422);
      }

      if (!identity) {
        return errorResponse("Please enter the student's last name and first name.", 422);
      }

      const existingStudent = await deps.hasStudentWithNormalizedName(
        identity.normalizedLastName,
        identity.normalizedFirstName,
      );
      if (existingStudent) {
        return jsonResponse({ status: "already_registered" }, 409);
      }

      const klass = await deps.findClassByCode(normalizedClassCode);
      if (!klass) {
        return errorResponse("We couldn't find that class code.", 404);
      }

      const created = await deps.provisionStudentForClass({
        classId: klass.id,
        identity,
      });
      return jsonResponse(await deps.issueStudentSession(created.email), 201);
    } catch (error) {
      console.error("student-register failed", error);
      return errorResponse("We couldn't register that student right now.", 500);
    }
  };
}
