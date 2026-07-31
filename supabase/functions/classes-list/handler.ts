import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  HIDDEN_CLASSROOM_NAME,
  ensureTeacherSingletonClass,
  type TeacherSingletonClassPersistence,
} from "../_shared/teacher_singleton_class.ts";

type TeacherClassroomRow = {
  id: string;
  teacher_id: string;
  name: string;
  created_at: string;
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

type ClassesListDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getTeacherClassroom(teacherId: string): Promise<{
    id: string;
    teacherId: string;
    name: string;
    createdAt: string;
    studentCount: number;
  } | null>;
  getStudentClassroom(studentId: string): Promise<{
    id: string;
    teacherName: string;
    joinedAt: string;
  } | null>;
};

const defaultTeacherClassPersistence: TeacherSingletonClassPersistence = {
  async listTeacherClasses(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .select("id, teacher_id, name, created_at")
      .eq("teacher_id", teacherId);

    if (error) {
      throw error;
    }

    return ((data ?? []) as TeacherClassroomRow[]).map((row) => ({
      id: row.id,
      teacherId: row.teacher_id,
      name: row.name,
      createdAt: row.created_at,
    }));
  },
  async insertTeacherClass(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient
      .from("classes")
      .insert({
        teacher_id: teacherId,
        name: HIDDEN_CLASSROOM_NAME,
        join_code: null,
      })
      .select("id, teacher_id, name, created_at")
      .single();

    if (error) {
      throw error;
    }

    return {
      id: data.id as string,
      teacherId: data.teacher_id as string,
      name: data.name as string,
      createdAt: data.created_at as string,
    };
  },
};

const defaultDeps: ClassesListDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getTeacherClassroom(teacherId) {
    const classroom = await ensureTeacherSingletonClass(
      defaultTeacherClassPersistence,
      teacherId,
    );

    const { adminClient } = await import("../_shared/client.ts");
    const { count, error } = await adminClient
      .from("class_students")
      .select("*", { count: "exact", head: true })
      .eq("class_id", classroom.id);

    if (error) {
      throw error;
    }

    return {
      ...classroom,
      studentCount: count ?? 0,
    };
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
        const classroom = await deps.getTeacherClassroom(profile.id);
        return jsonResponse({
          classroom: classroom
            ? {
                id: classroom.id,
                createdAt: classroom.createdAt,
                studentCount: classroom.studentCount,
              }
            : null,
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
