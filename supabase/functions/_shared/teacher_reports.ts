import type {
  TeacherReportGameResultRecord,
  TeacherReportStudentRecord,
  TeacherReportsWindowKey,
  TeacherSingleClassroomReportPayload,
} from "../../../frontend/src/lib/teacher/reports/index.ts";
import {
  resolveTeacherReportsWindow,
} from "../../../frontend/src/lib/teacher/reports/index.ts";
import {
  decodeCursor,
  encodeCursor,
} from "./pagination.ts";
import {
  parseTeacherReportAggregate,
  type TeacherReportAggregate,
} from "./aggregate_contract.ts";
import { getTeacherSingletonClass } from "./teacher_singleton_class.ts";

type ClassroomRow = {
  id: string;
  name: string;
};

type EnrollmentRow = {
  class_id: string;
  student_id: string;
  joined_at: string;
  classes:
    | {
        id: string;
        name: string;
      }
    | {
        id: string;
        name: string;
      }[]
    | null;
  profiles:
    | {
        id: string;
        full_name: string;
        first_name: string | null;
        last_name: string | null;
      }
    | {
        id: string;
        full_name: string;
        first_name: string | null;
        last_name: string | null;
      }[]
    | null;
};

type ResultRow = {
  attempt_id: string;
  student_id: string;
  topic_id: string;
  game_id: string;
  game_order: number;
  score: number;
  max_score: number;
  score_pct: number;
  passed: boolean;
  completed_at: string;
};

type AttemptRow = {
  id: string;
  student_id: string;
  class_id: string | null;
};

type TeacherReportsDatasetDeps = {
  getClassroom(teacherId: string): Promise<ClassroomRow>;
  listEnrollments(classId: string): Promise<EnrollmentRow[]>;
  listAttempts(studentIds: string[], classId: string): Promise<AttemptRow[]>;
  listResultRows(attemptIds: string[]): Promise<ResultRow[]>;
};

export type TeacherReportsDataset = {
  classroom: {
    id: string;
    studentCount: number;
  };
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
};

const defaultDeps: TeacherReportsDatasetDeps = {
  async getClassroom(teacherId) {
    const { adminClient } = await import("./client.ts");
    const classroom = await getTeacherSingletonClass(
      {
        async listTeacherClasses(nextTeacherId) {
          const { data, error } = await adminClient
            .from("classes")
            .select("id, teacher_id, name, created_at")
            .eq("teacher_id", nextTeacherId);

          if (error) {
            throw error;
          }

          return (data ?? []).map((row) => ({
            id: row.id,
            teacherId: row.teacher_id,
            name: row.name,
            createdAt: row.created_at,
          }));
        },
      },
      teacherId,
    );

    return {
      id: classroom.id,
      name: classroom.name,
    };
  },
  async listEnrollments(classId) {
    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select(
        "class_id, student_id, joined_at, classes(id, name), profiles(id, full_name, first_name, last_name)",
      )
      .eq("class_id", classId);

    if (error) {
      throw error;
    }

    return (data ?? []) as EnrollmentRow[];
  },
  async listAttempts(studentIds, classId) {
    if (!studentIds.length) {
      return [];
    }

    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("id, student_id, class_id")
      .in("student_id", studentIds)
      .eq("class_id", classId)
      .eq("status", "completed");

    if (error) {
      throw error;
    }

    return (data ?? []) as AttemptRow[];
  },
  async listResultRows(attemptIds) {
    if (!attemptIds.length) {
      return [];
    }

    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("attempt_game_results")
      .select(
        "attempt_id, student_id, topic_id, game_id, game_order, score, max_score, score_pct, passed, completed_at",
      )
      .in("attempt_id", attemptIds);

    if (error) {
      throw error;
    }

    return (data ?? []) as ResultRow[];
  },
};

export function createLoadTeacherReportsDataset(
  deps: TeacherReportsDatasetDeps = defaultDeps,
) {
  return async (
    input: { teacherId: string },
  ): Promise<TeacherReportsDataset> => {
    const classroom = await deps.getClassroom(input.teacherId);
    const enrollmentRows = await deps.listEnrollments(classroom.id);

    const students = enrollmentRows.flatMap((row) => {
      const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      if (!klass || !profile) {
        return [];
      }

      return [{
        id: profile.id,
        classId: row.class_id,
        className: klass?.name ?? classroom.name,
        fullName: profile.full_name,
        firstName: profile.first_name ?? profile.full_name,
        lastName: profile.last_name ?? null,
        joinedAt: row.joined_at,
      }];
    });

    const studentIds = Array.from(new Set(students.map((row) => row.id)));
    const attempts = await deps.listAttempts(studentIds, classroom.id);
    const attemptsById = new Map(attempts.map((row) => [row.id, row]));
    const enrollmentJoinAtByClassStudent = new Map(
      students.map((row) => [`${row.classId}:${row.id}`, row.joinedAt] as const),
    );
    const resultRows = await deps.listResultRows(attempts.map((row) => row.id));

    const results = resultRows.flatMap((row) => {
      const attempt = attemptsById.get(row.attempt_id);
      if (!attempt?.class_id) {
        return [];
      }

      const joinedAt = enrollmentJoinAtByClassStudent.get(
        `${attempt.class_id}:${row.student_id}`,
      );
      if (!joinedAt || row.completed_at < joinedAt) {
        return [];
      }

      return [{
        studentId: row.student_id,
        classId: attempt.class_id,
        topicId: row.topic_id,
        gameId: row.game_id,
        gameOrder: row.game_order,
        score: row.score,
        maxScore: row.max_score,
        scorePct: row.score_pct,
        passed: row.passed,
        completedAt: row.completed_at,
      }];
    });

    const studentCountByClassId = new Map<string, number>();
    for (const student of students) {
      studentCountByClassId.set(
        student.classId,
        (studentCountByClassId.get(student.classId) ?? 0) + 1,
      );
    }

    return {
      classroom: {
        id: classroom.id,
        studentCount: studentCountByClassId.get(classroom.id) ?? 0,
      },
      students,
      results,
    };
  };
}

export const loadTeacherReportsDataset = createLoadTeacherReportsDataset();

export type TeacherReportAggregateRequest = {
  teacherId: string;
  startAt: string | null;
  endAt: string;
  studentLimit: number;
  studentCursor: string | null;
};

export async function loadBoundedTeacherReportAggregate(
  input: TeacherReportAggregateRequest,
): Promise<TeacherReportAggregate> {
  const { adminClient } = await import("./client.ts");
  const decodedCursor = input.studentCursor
    ? decodeCursor<{ studentId: string }>(input.studentCursor)
    : null;
  const { data, error } = await adminClient.rpc("get_teacher_report_summary", {
    p_teacher_id: input.teacherId,
    p_start_at: input.startAt,
    p_end_at: input.endAt,
    p_student_limit: input.studentLimit,
    p_student_cursor: decodedCursor?.studentId ?? null,
  });
  if (error) throw error;
  return parseTeacherReportAggregate(data);
}

export function buildTeacherSingleClassroomAggregateReport(input: {
  aggregate: TeacherReportAggregate;
  windowKey: TeacherReportsWindowKey;
  now: Date;
}): TeacherSingleClassroomReportPayload {
  const window = resolveTeacherReportsWindow(input.windowKey, input.now);
  const { aggregate } = input;
  return {
    windowKey: window.key,
    windowLabel: window.label,
    hasData: aggregate.topicBreakdown.length > 0,
    classroomSummary: aggregate.classroom,
    attentionStudents: aggregate.attentionStudents.map((student) => ({
      ...student,
      reasonCodes: student.reasonCodes.filter((reason): reason is
        "low_average" | "inactive_while_class_active" | "low_completion" =>
        reason === "low_average"
        || reason === "inactive_while_class_active"
        || reason === "low_completion"
      ),
    })),
    recentActivity: aggregate.recentActivity,
    studentRows: aggregate.studentRows,
    studentRowsPage: {
      nextCursor: aggregate.page.nextCursor
        ? encodeCursor({ studentId: aggregate.page.nextCursor })
        : null,
      hasMore: aggregate.page.hasMore,
    },
    topicBreakdown: aggregate.topicBreakdown,
  };
}
