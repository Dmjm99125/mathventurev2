import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildStudentEmail,
  isValidNormalizedLrn,
  normalizeClassCode,
  normalizeLastName,
  normalizeLrn,
  STUDENT_VERIFY_TYPE,
  studentDisplayName,
} from "../_shared/student_auth.ts";

type StudentRegisterSession = {
  status: "ok";
  email: string;
  tokenHash: string;
  verifyType: typeof STUDENT_VERIFY_TYPE;
};

type StudentRegisterDeps = {
  findClassByCode(joinCode: string): Promise<{ id: string; name: string } | null>;
  findStudentByNormalizedLrn(normalizedLrn: string): Promise<{ id: string } | null>;
  createHiddenStudent(input: { normalizedLrn: string; rawLastName: string }): Promise<{ id: string; email: string }>;
  updateStudentProfile(input: {
    studentId: string;
    normalizedLrn: string;
    rawLastName: string;
    normalizedLastName: string;
  }): Promise<void>;
  enrollStudent(input: { classId: string; studentId: string }): Promise<void>;
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
  async findStudentByNormalizedLrn(normalizedLrn) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("profiles")
      .select("id")
      .eq("role", "student")
      .eq("normalized_lrn", normalizedLrn)
      .maybeSingle();
    if (error) throw error;
    return data;
  },
  async createHiddenStudent({ normalizedLrn, rawLastName }) {
    const { adminClient } = await import("../_shared/client.ts");
    const email = buildStudentEmail(normalizedLrn);
    const password = `${crypto.randomUUID()}${crypto.randomUUID()}`;
    const { data, error } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        role: "student",
        full_name: studentDisplayName(rawLastName),
        last_name: rawLastName.trim(),
        lrn: normalizedLrn,
      },
    });
    if (error || !data.user) {
      throw error ?? new Error("Failed to create student auth user");
    }
    return { id: data.user.id, email };
  },
  async updateStudentProfile({ studentId, normalizedLrn, rawLastName, normalizedLastName }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient
      .from("profiles")
      .update({
        full_name: studentDisplayName(rawLastName),
        lrn: normalizedLrn,
        normalized_lrn: normalizedLrn,
        last_name: rawLastName.trim(),
        normalized_last_name: normalizedLastName,
      })
      .eq("id", studentId);
    if (error) throw error;
  },
  async enrollStudent({ classId, studentId }) {
    const { adminClient } = await import("../_shared/client.ts");
    const { error } = await adminClient
      .from("class_students")
      .insert({ class_id: classId, student_id: studentId });
    if (error) throw error;
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
      const normalizedLrn = normalizeLrn(typeof body?.lrn === "string" ? body.lrn : "");
      const normalizedClassCode = normalizeClassCode(typeof body?.classCode === "string" ? body.classCode : "");
      const rawLastName = typeof body?.lastName === "string" ? body.lastName : "";
      const normalizedLastName = normalizeLastName(rawLastName);

      if (!isValidNormalizedLrn(normalizedLrn)) {
        return errorResponse("Check your learner number and try again.", 422);
      }

      if (!normalizedClassCode) {
        return errorResponse("We couldn't find that class code.", 422);
      }

      if (!normalizedLastName) {
        return errorResponse("We couldn't sign you in right now.", 422);
      }

      const existingStudent = await deps.findStudentByNormalizedLrn(normalizedLrn);
      if (existingStudent) {
        return jsonResponse({ status: "already_registered" }, 409);
      }

      const klass = await deps.findClassByCode(normalizedClassCode);
      if (!klass) {
        return errorResponse("We couldn't find that class code.", 404);
      }

      const created = await deps.createHiddenStudent({ normalizedLrn, rawLastName });
      await deps.updateStudentProfile({
        studentId: created.id,
        normalizedLrn,
        rawLastName,
        normalizedLastName,
      });
      await deps.enrollStudent({ classId: klass.id, studentId: created.id });

      return jsonResponse(await deps.issueStudentSession(created.email), 201);
    } catch (error) {
      console.error("student-register failed", error);
      return errorResponse("We couldn't register that student right now.", 500);
    }
  };
}
