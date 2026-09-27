import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { AuthedProfile } from "../_shared/client.ts";
import {
  decodeCursor,
  encodeCursor,
  PaginationInputError,
  parsePageRequest,
} from "../_shared/pagination.ts";

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

export type AssignmentListPage = {
  assignments: AssignmentListRecord[];
  nextCursor: string | null;
  hasMore: boolean;
};

type AssignmentSource = AssignmentListRecord[] | AssignmentListPage;

export type AssignmentsListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  listTeacherAssignments(
    teacherId: string,
    classId: string | null,
    pageSize?: number,
    cursor?: string | null,
  ): Promise<AssignmentSource>;
  listStudentAssignments(
    studentId: string,
    pageSize?: number,
    cursor?: string | null,
  ): Promise<AssignmentSource>;
  listAttempts(studentId: string, assignmentIds: string[]): Promise<Map<string, AssignmentListAttempt>>;
};

type AssignmentQueryRow = {
  id: string;
  name: string | null;
  due_at: string | null;
  created_at: string;
  class_id: string | null;
  student_id: string | null;
  lesson_id: string;
  classes?: { name: string } | { name: string }[] | null;
};

type AssignmentCursor = {
  createdAt: string;
  id: string;
};

function mapAssignment(row: AssignmentQueryRow): AssignmentListRecord {
  const classroom = Array.isArray(row.classes) ? row.classes[0] : row.classes;
  return {
    id: row.id,
    name: row.name?.trim() || row.lesson_id,
    lessonId: row.lesson_id,
    classId: row.class_id ?? null,
    studentId: row.student_id ?? null,
    className: classroom?.name ?? null,
    dueAt: row.due_at ?? null,
    createdAt: row.created_at,
  };
}

function pageFromRows(rows: AssignmentListRecord[], pageSize: number): AssignmentListPage {
  const hasMore = rows.length > pageSize;
  const assignments = rows.slice(0, pageSize);
  const last = assignments.at(-1);
  return {
    assignments,
    nextCursor: hasMore && last
      ? encodeCursor({ createdAt: last.createdAt, id: last.id })
      : null,
    hasMore,
  };
}

function normalizePage(source: AssignmentSource, pageSize: number): AssignmentListPage {
  return Array.isArray(source) ? pageFromRows(source, pageSize) : source;
}

function applyAssignmentCursor<T extends { created_at: string; id: string }>(
  query: T,
  cursor: string | null,
): T {
  if (!cursor) return query;
  const decoded = decodeCursor<AssignmentCursor>(cursor);
  return query.or(
    `created_at.lt.${decoded.createdAt},and(created_at.eq.${decoded.createdAt},id.lt.${decoded.id})`,
  );
}

const defaultDeps: AssignmentsListDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async listTeacherAssignments(teacherId, classId, pageSize = 50, cursor = null) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data: teacherClasses, error: teacherClassesError } = await adminClient
      .from("classes")
      .select("id")
      .eq("teacher_id", teacherId)
      .limit(100);
    if (teacherClassesError) throw teacherClassesError;

    const teacherClassIds = (teacherClasses ?? []).map((row: { id: string }) => row.id);
    const ownershipFilter = teacherClassIds.length
      ? `assigned_by.eq.${teacherId},class_id.in.(${teacherClassIds.join(",")})`
      : `assigned_by.eq.${teacherId}`;
    let query = adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, class_id, student_id, lesson_id, classes(name)")
      .or(ownershipFilter)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);
    if (classId) query = query.eq("class_id", classId);
    query = applyAssignmentCursor(query, cursor);
    const { data, error } = await query;
    if (error) throw error;
    return pageFromRows((data ?? []).map((row) => mapAssignment(row as AssignmentQueryRow),), pageSize);
  },
  async listStudentAssignments(studentId, pageSize = 50, cursor = null) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data: classRows, error: classError } = await adminClient
      .from("class_students")
      .select("class_id")
      .eq("student_id", studentId)
      .limit(100);
    if (classError) throw classError;
    const classIds = (classRows ?? []).map((row: { class_id: string }) => row.class_id);

    const targetFilter = classIds.length
      ? `student_id.eq.${studentId},class_id.in.(${classIds.join(",")})`
      : `student_id.eq.${studentId}`;
    let query = adminClient
      .from("assignments")
      .select("id, name, due_at, created_at, lesson_id, class_id, student_id")
      .or(targetFilter)
      .order("created_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(pageSize + 1);
    query = applyAssignmentCursor(query, cursor);
    const { data, error } = await query;
    if (error) throw error;
    return pageFromRows((data ?? []).map((row) => mapAssignment(row as AssignmentQueryRow),), pageSize);
  },
  async listAttempts(studentId, assignmentIds) {
    if (!assignmentIds.length) return new Map();

    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("assignment_id, status, current_game_order, score, max_score, updated_at, id")
      .eq("student_id", studentId)
      .in("assignment_id", assignmentIds)
      .order("updated_at", { ascending: false })
      .order("id", { ascending: false })
      .limit(Math.min(1000, assignmentIds.length * 10));
    if (error) throw error;

    const attemptsByAssignment = new Map<string, AssignmentListAttempt>();
    for (const row of data ?? []) {
      if (!row.assignment_id || attemptsByAssignment.has(row.assignment_id)) continue;
      attemptsByAssignment.set(row.assignment_id, {
        status: row.status as AssignmentListAttempt["status"],
        currentGameOrder: row.current_game_order,
        score: row.score,
        maxScore: row.max_score,
        updatedAt: row.updated_at,
      });
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

      const { pageSize, cursor } = parsePageRequest(new URL(req.url));
      if (profile.role === "teacher") {
        const classId = new URL(req.url).searchParams.get("classId");
        const source = await deps.listTeacherAssignments(profile.id, classId, pageSize, cursor);
        const page = normalizePage(source, pageSize);
        return jsonResponse({ assignments: page.assignments, page: { nextCursor: page.nextCursor, hasMore: page.hasMore } });
      }

      const source = await deps.listStudentAssignments(profile.id, pageSize, cursor);
      const page = normalizePage(source, pageSize);
      const attemptsByAssignment = await deps.listAttempts(
        profile.id,
        page.assignments.map((assignment) => assignment.id),
      );

      return jsonResponse({
        assignments: page.assignments.map((assignment) => {
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
        page: { nextCursor: page.nextCursor, hasMore: page.hasMore },
      });
    } catch (error) {
      if (error instanceof PaginationInputError) return errorResponse(error.message, error.status);
      console.error("assignments-list failed", error);
      return errorResponse("We couldn't load assignments right now.", 500);
    }
  };
}
