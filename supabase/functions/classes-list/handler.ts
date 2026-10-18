import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

export type TeacherClassSummary = {
  id: string;
  teacherId: string;
  name: string;
  createdAt: string;
  archivedAt: string | null;
  studentCount: number;
};

type TeacherClassroomRow = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
  archived_at: string | null;
};

type StudentClassroomQueryRow = {
  joined_at: string;
  classes:
    | {
        id: string;
        profiles:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
      }
    | {
        id: string;
        profiles:
          | {
              full_name: string;
            }
          | {
              full_name: string;
            }[]
          | null;
      }[]
    | null;
};

export type ClassesListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  listTeacherClasses?: (teacherId: string) => Promise<TeacherClassSummary[]>;
  getStudentClassroom(studentId: string): Promise<{
    id: string;
    teacherName: string;
    joinedAt: string;
  } | null>;
};

const defaultDeps: ClassesListDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async listTeacherClasses(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at, archived_at")
      .eq("teacher_id", teacherId)
      .order("created_at", { ascending: true })
      .order("id", { ascending: true });

    if (error) {
      throw error;
    }

    const classrooms: TeacherClassSummary[] = [];
    for (const row of (data ?? []) as TeacherClassroomRow[]) {
      const { count, error: countError } = await adminClient
        .from("class_students")
        .select("student_id", { count: "exact", head: true })
        .eq("class_id", row.id);

      if (countError) {
        throw countError;
      }

      classrooms.push({
        id: row.id,
        teacherId: row.teacher_id,
        name: row.name,
        createdAt: row.created_at,
        archivedAt: row.archived_at ?? null,
        studentCount: count ?? 0,
      });
    }

    return classrooms;
  },
  async getStudentClassroom(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select("joined_at, classes(id, profiles!classes_teacher_id_fkey(full_name))")
      .eq("student_id", studentId)
      .order("joined_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      throw error;
    }
    if (!data) {
      return null;
    }

    const classroomRow = data as StudentClassroomQueryRow;
    const classroom = Array.isArray(classroomRow.classes)
      ? classroomRow.classes[0]
      : classroomRow.classes;
    const teacherProfile = Array.isArray(classroom?.profiles)
      ? classroom.profiles[0]
      : classroom?.profiles;

    if (!classroom) {
      return null;
    }

    return {
      id: classroom.id,
      teacherName: teacherProfile?.full_name ?? "Teacher",
      joinedAt: classroomRow.joined_at,
    };
  },
};

function toPublicClassroom(classroom: TeacherClassSummary) {
  return {
    id: classroom.id,
    name: classroom.name,
    createdAt: classroom.createdAt,
    archivedAt: classroom.archivedAt,
    studentCount: classroom.studentCount,
  };
}

export function createClassesListHandler(deps: ClassesListDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "GET") {
      return errorResponse("Method not allowed", 405);
    }

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) {
        return errorResponse("Unauthorized", 401);
      }

      if (profile.role === "teacher") {
        const classrooms = await deps.listTeacherClasses!(profile.id);
        return jsonResponse({
          classes: classrooms
            .filter((classroom) => classroom.archivedAt === null)
            .map(toPublicClassroom),
          archivedClasses: classrooms
            .filter((classroom) => classroom.archivedAt !== null)
            .map(toPublicClassroom),
        });
      }

      const classroom = await deps.getStudentClassroom(profile.id);
      return jsonResponse({
        classroom: classroom
          ? {
              id: classroom.id,
              teacherName: classroom.teacherName,
              joinedAt: classroom.joinedAt,
            }
          : null,
      });
    } catch (error) {
      console.error("classes-list failed", error);
      return errorResponse("We couldn't load classrooms right now.", 500);
    }
  };
}
