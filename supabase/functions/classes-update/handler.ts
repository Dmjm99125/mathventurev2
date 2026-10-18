import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { TeacherClassSummary } from "../classes-list/handler.ts";

export type ClassesUpdateDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClass(
    teacherId: string,
    classId: string,
  ): Promise<TeacherClassSummary | null>;
  renameClass(classId: string, name: string): Promise<TeacherClassSummary>;
  setArchivedAt(
    classId: string,
    archivedAt: string | null,
  ): Promise<TeacherClassSummary>;
  now?: () => string;
};

type ClassRow = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
  archived_at: string | null;
};

function toClassSummary(row: ClassRow, studentCount = 0): TeacherClassSummary {
  return {
    id: row.id,
    teacherId: row.teacher_id,
    name: row.name,
    createdAt: row.created_at,
    archivedAt: row.archived_at ?? null,
    studentCount,
  };
}

const defaultDeps: ClassesUpdateDeps = {
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
      .eq("teacher_id", teacherId)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    const { count, error: countError } = await adminClient
      .from("class_students")
      .select("student_id", { count: "exact", head: true })
      .eq("class_id", classId);

    if (countError) {
      throw countError;
    }

    return toClassSummary(data as ClassRow, count ?? 0);
  },
  async renameClass(classId, name) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .update({ name })
      .eq("id", classId)
      .select("id, teacher_id, name, created_at, archived_at")
      .single();

    if (error) {
      throw error;
    }

    return toClassSummary(data as ClassRow);
  },
  async setArchivedAt(classId, archivedAt) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .update({ archived_at: archivedAt })
      .eq("id", classId)
      .select("id, teacher_id, name, created_at, archived_at")
      .single();

    if (error) {
      throw error;
    }

    return toClassSummary(data as ClassRow);
  },
};

function refreshedClass(
  deps: ClassesUpdateDeps,
  teacherId: string,
  classId: string,
  fallback: TeacherClassSummary,
) {
  return deps.getTeacherClass(teacherId, classId).then((classroom) => classroom ?? fallback);
}

export function createClassesUpdateHandler(deps: ClassesUpdateDeps = defaultDeps) {
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
        return errorResponse("Only teachers can manage classrooms", 403);
      }

      const body = await req.json().catch(() => null) as {
        classId?: unknown;
        action?: unknown;
        name?: unknown;
      } | null;
      const classId = typeof body?.classId === "string" ? body.classId.trim() : "";
      const action = body?.action;
      if (!classId || !["rename", "archive", "unarchive"].includes(String(action))) {
        return errorResponse("A valid class action is required", 422);
      }

      const classroom = await deps.getTeacherClass(profile.id, classId);
      if (!classroom) {
        return errorResponse("Classroom not found", 404);
      }

      if (action === "rename") {
        if (classroom.archivedAt !== null) {
          return errorResponse("Archived classrooms are read-only", 409);
        }
        const name = typeof body?.name === "string" ? body.name.trim() : "";
        if (!name) {
          return errorResponse("Class name is required", 422);
        }
        if (name.length > 120) {
          return errorResponse("Class name is too long", 422);
        }

        const updated = await deps.renameClass(classId, name);
        return jsonResponse({
          classroom: await refreshedClass(deps, profile.id, classId, updated),
        });
      }

      if (action === "archive") {
        if (classroom.archivedAt !== null) {
          return jsonResponse({ classroom });
        }
        const updated = await deps.setArchivedAt(
          classId,
          (deps.now ?? (() => new Date().toISOString()))(),
        );
        return jsonResponse({
          classroom: await refreshedClass(deps, profile.id, classId, updated),
        });
      }

      if (classroom.archivedAt === null) {
        return jsonResponse({ classroom });
      }
      const updated = await deps.setArchivedAt(classId, null);
      return jsonResponse({
        classroom: await refreshedClass(deps, profile.id, classId, updated),
      });
    } catch (error) {
      console.error("classes-update failed", error);
      return errorResponse("We couldn't update that classroom right now.", 500);
    }
  };
}
