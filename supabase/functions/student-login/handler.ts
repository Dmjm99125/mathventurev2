import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildStudentEmail,
  isValidNormalizedLrn,
  normalizeLastName,
  normalizeLrn,
  STUDENT_VERIFY_TYPE,
} from "../_shared/student_auth.ts";

type StudentLoginSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentLoginDeps = {
  findStudentByNormalizedLrn(normalizedLrn: string): Promise<{ normalizedLastName: string } | null>;
  issueStudentSession(email: string): Promise<StudentLoginSession>;
};

const defaultDeps: StudentLoginDeps = {
  async findStudentByNormalizedLrn(normalizedLrn) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("normalized_last_name")
      .eq("role", "student")
      .eq("normalized_lrn", normalizedLrn)
      .maybeSingle();
    if (error) throw error;
    return data ? { normalizedLastName: data.normalized_last_name as string } : null;
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

export function createStudentLoginHandler(deps: StudentLoginDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const body = await req.json().catch(() => null);
      const normalizedLrn = normalizeLrn(typeof body?.lrn === "string" ? body.lrn : "");
      const normalizedLastName = normalizeLastName(typeof body?.lastName === "string" ? body.lastName : "");

      if (!isValidNormalizedLrn(normalizedLrn) || !normalizedLastName) {
        return jsonResponse({ status: "invalid_credentials" }, 401);
      }

      const student = await deps.findStudentByNormalizedLrn(normalizedLrn);
      if (!student || student.normalizedLastName !== normalizedLastName) {
        return jsonResponse({ status: "invalid_credentials" }, 401);
      }

      return jsonResponse(await deps.issueStudentSession(buildStudentEmail(normalizedLrn)));
    } catch (error) {
      console.error("student-login failed", error);
      return errorResponse("We couldn't sign that student in right now.", 500);
    }
  };
}
