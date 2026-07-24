import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  normalizeFirstName,
  normalizeLastName,
  STUDENT_VERIFY_TYPE,
} from "../_shared/student_auth.ts";

type StudentLoginSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentEmailLookup = string | null | "ambiguous";

type StudentLoginDeps = {
  findStudentEmailByNormalizedName(
    normalizedLastName: string,
    normalizedFirstName: string,
  ): Promise<StudentEmailLookup>;
  issueStudentSession(email: string): Promise<StudentLoginSession>;
};

const defaultDeps: StudentLoginDeps = {
  async findStudentEmailByNormalizedName(normalizedLastName, normalizedFirstName) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("normalized_last_name", normalizedLastName)
      .eq("normalized_first_name", normalizedFirstName)
      .limit(2);
    if (error) throw error;
    if (!data?.length) {
      return null;
    }
    if (data.length > 1) {
      return "ambiguous";
    }

    const { data: userData, error: userError } = await adminClient.auth.admin.getUserById(data[0].id as string);
    if (userError || !userData.user.email) {
      throw userError ?? new Error("Failed to load student auth user");
    }
    return userData.user.email;
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
      const normalizedLastName = normalizeLastName(typeof body?.lastName === "string" ? body.lastName : "");
      const normalizedFirstName = normalizeFirstName(typeof body?.firstName === "string" ? body.firstName : "");

      if (!normalizedLastName || !normalizedFirstName) {
        return jsonResponse({ status: "invalid_credentials" }, 401);
      }

      const studentEmail = await deps.findStudentEmailByNormalizedName(normalizedLastName, normalizedFirstName);
      if (!studentEmail || studentEmail === "ambiguous") {
        return jsonResponse({ status: "invalid_credentials" }, 401);
      }

      return jsonResponse(await deps.issueStudentSession(studentEmail));
    } catch (error) {
      console.error("student-login failed", error);
      return errorResponse("We couldn't sign that student in right now.", 500);
    }
  };
}
