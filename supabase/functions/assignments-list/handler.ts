import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";

export type AssignmentListRecord = {
  id: string;
  name: string;
  lessonId: string;
  classId: string | null;
  studentId?: string | null;
  className?: string | null;
  dueAt: string | null;
  createdAt: string;
};

export type AssignmentListAttempt = {
  status: "in_progress" | "completed";
  currentGameOrder: number;
  score: number;
  maxScore: number;
  updatedAt?: string;
};

export type AssignmentsListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  listTeacherAssignments(teacherId: string, classId: string | null): Promise<AssignmentListRecord[]>;
  listStudentAssignments(studentId: string): Promise<AssignmentListRecord[]>;
  listAttempts(studentId: string, assignmentIds: string[]): Promise<Map<string, AssignmentListAttempt>>;
};

const defaultDeps: AssignmentsListDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async listTeacherAssignments(teacherId, classId) {
    const { adminClient } = await import("../_shared/client.ts");
    let query = adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, class_id, student_id, lesson_id, classes(name)")
      .eq("assigned_by", teacherId)
      .order("created_at", { ascending: false });
    if (classId) query = query.eq("class_id", classId);
    const { data, error } = await query;
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name || row.lesson_id,
      lessonId: row.lesson_id,
      classId: row.class_id ?? null,
      studentId: row.student_id ?? null,
      className: row.classes?.name ?? null,
      dueAt: row.due_at ?? null,
      createdAt: row.created_at,
    }));
  },
  async listStudentAssignments(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data: classRows, error: classError } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId);
    if (classError) throw classError;
    const classIds = (classRows ?? []).map((row: any) => row.class_id);

    const { data, error } = await adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, lesson_id, class_id, student_id")
      .or(
        classIds.length
          ? "student_id.eq." + studentId + ",class_id.in.(" + classIds.join(",") + ")"
          : "student_id.eq." + studentId,
      )
      .order("created_at", { ascending: false });
    if (error) throw error;

    return (data ?? []).map((row: any) => ({
      id: row.id,
      name: row.name || row.lesson_id,
      lessonId: row.lesson_id,
      classId: row.class_id ?? null,
      studentId: row.student_id ?? null,
      dueAt: row.due_at ?? null,
      createdAt: row.created_at,
    }));
  },
  async listAttempts(studentId, assignmentIds) {
    if (!assignmentIds.length) return new Map();

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("assignment_id, status, current_game_order, score, max_score, updated_at")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds);
    if (error) throw error;

    const attemptsByAssignment = new Map<string, AssignmentListAttempt>();
    for (const row of data ?? []) {
      const current = attemptsByAssignment.get(row.assignment_id);
      const candidate = {
        status: row.status as AssignmentListAttempt["status"],
        currentGameOrder: row.current_game_order,
        score: row.score,
        maxScore: row.max_score,
        updatedAt: row.updated_at,
      };
      if (
        !current
        || candidate.status === "completed"
        || (current.status !== "completed" && candidate.updatedAt! > current.updatedAt!)
      ) {
        attemptsByAssignment.set(row.assignment_id, candidate);
      }
    }
    return attemptsByAssignment;
  },
};

export function createAssignmentsListHandler(deps: AssignmentsListDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);

      if (profile.role === "teacher") {
        const classId = new URL(req.url).searchParams.get("classId");
        return jsonResponse({
          assignments: await deps.listTeacherAssignments(profile.id, classId),
        });
      }

      const assignments = await deps.listStudentAssignments(profile.id);
      const attemptsByAssignment = await deps.listAttempts(
        profile.id,
        assignments.map((assignment) => assignment.id),
      );

      return jsonResponse({
        assignments: assignments.map((assignment) => {
          const attempt = attemptsByAssignment.get(assignment.id);
          return {
            ...assignment,
            status: attempt?.status ?? "not_started",
            currentGameOrder: attempt?.currentGameOrder ?? 0,
            score: attempt?.score ?? 0,
            maxScore: attempt?.maxScore ?? 0,
            completed: attempt?.status === "completed",
          };
        }),
      });
    } catch (error) {
      console.error("assignments-list failed", error);
      return errorResponse("We couldn't load assignments right now.", 500);
    }
  };
}
