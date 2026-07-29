import type {
  TeacherReportClassRecord,
  TeacherReportGameResultRecord,
  TeacherReportStudentRecord,
} from "../../../src/lib/teacher-reports.ts";

type ClassRow = {
  id: string;
  name: string;
  join_code: string;
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
  listClasses(input: { teacherId: string; classId?: string }): Promise<ClassRow[]>;
  listEnrollments(classIds: string[]): Promise<EnrollmentRow[]>;
  listAttempts(studentIds: string[], classIds: string[]): Promise<AttemptRow[]>;
  listResultRows(attemptIds: string[]): Promise<ResultRow[]>;
};

export type TeacherReportsDataset = {
  classes: TeacherReportClassRecord[];
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
};

const defaultDeps: TeacherReportsDatasetDeps = {
  async listClasses(input) {
    const { adminClient } = await import("./client.ts");
    const classQuery = adminClient
      .from("classes")
      .select("id, name, join_code")
      .eq("teacher_id", input.teacherId);

    if (input.classId) {
      classQuery.eq("id", input.classId);
    }

    const { data, error } = await classQuery;
    if (error) {
      throw error;
    }

    return (data ?? []) as ClassRow[];
  },
  async listEnrollments(classIds) {
    if (!classIds.length) {
      return [];
    }

    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("class_students")
      .select(
        "class_id, student_id, joined_at, classes(id, name), profiles(id, full_name, first_name, last_name)",
      )
      .in("class_id", classIds);

    if (error) {
      throw error;
    }

    return (data ?? []) as EnrollmentRow[];
  },
  async listAttempts(studentIds, classIds) {
    if (!studentIds.length || !classIds.length) {
      return [];
    }

    const { adminClient } = await import("./client.ts");
    const { data, error } = await adminClient
      .from("attempts")
      .select("id, student_id, class_id")
      .in("student_id", studentIds)
      .in("class_id", classIds);

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
    input: { teacherId: string; classId?: string },
  ): Promise<TeacherReportsDataset> => {
    const classRows = await deps.listClasses(input);

    const classes = classRows.map((row) => ({
      id: row.id,
      name: row.name,
      joinCode: row.join_code,
      studentCount: 0,
    }));

    if (!classes.length) {
      return {
        classes: [],
        students: [],
        results: [],
      };
    }

    const classIds = classes.map((row) => row.id);
    const enrollmentRows = await deps.listEnrollments(classIds);

    const students = enrollmentRows.flatMap((row) => {
      const klass = Array.isArray(row.classes) ? row.classes[0] : row.classes;
      const profile = Array.isArray(row.profiles) ? row.profiles[0] : row.profiles;

      if (!klass || !profile) {
        return [];
      }

      return [{
        id: profile.id,
        classId: row.class_id,
        className: klass.name,
        fullName: profile.full_name,
        firstName: profile.first_name ?? profile.full_name,
        lastName: profile.last_name ?? null,
        joinedAt: row.joined_at,
      }];
    });

    const studentIds = Array.from(new Set(students.map((row) => row.id)));
    const attempts = await deps.listAttempts(studentIds, classIds);
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
      classes: classes.map((klass) => ({
        ...klass,
        studentCount: studentCountByClassId.get(klass.id) ?? 0,
      })),
      students,
      results,
    };
  };
}

export const loadTeacherReportsDataset = createLoadTeacherReportsDataset();
