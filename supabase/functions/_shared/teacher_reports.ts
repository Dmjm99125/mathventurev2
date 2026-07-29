import { adminClient } from "./client.ts";
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

export type TeacherReportsDataset = {
  classes: TeacherReportClassRecord[];
  students: TeacherReportStudentRecord[];
  results: TeacherReportGameResultRecord[];
};

export async function loadTeacherReportsDataset(
  input: { teacherId: string; classId?: string },
): Promise<TeacherReportsDataset> {
  const classQuery = adminClient
    .from("classes")
    .select("id, name, join_code")
    .eq("teacher_id", input.teacherId);

  if (input.classId) {
    classQuery.eq("id", input.classId);
  }

  const { data: classRows, error: classError } = await classQuery;
  if (classError) {
    throw classError;
  }

  const classes = ((classRows ?? []) as ClassRow[]).map((row) => ({
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

  const { data: enrollmentRows, error: enrollmentError } = await adminClient
    .from("class_students")
    .select("class_id, student_id, joined_at, classes(id, name), profiles(id, full_name, first_name, last_name)")
    .in("class_id", classIds);

  if (enrollmentError) {
    throw enrollmentError;
  }

  const students = ((enrollmentRows ?? []) as EnrollmentRow[]).flatMap((row) => {
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
  const classIdsByStudentId = new Map<string, string[]>();
  for (const student of students) {
    const current = classIdsByStudentId.get(student.id) ?? [];
    current.push(student.classId);
    classIdsByStudentId.set(student.id, current);
  }

  const { data: resultRows, error: resultError } = studentIds.length
    ? await adminClient
        .from("attempt_game_results")
        .select("student_id, topic_id, game_id, game_order, score, max_score, score_pct, passed, completed_at")
        .in("student_id", studentIds)
    : { data: [], error: null };

  if (resultError) {
    throw resultError;
  }

  const results = ((resultRows ?? []) as ResultRow[]).flatMap((row) => {
    const ownedClassIds = classIdsByStudentId.get(row.student_id) ?? [];
    return ownedClassIds.map((classId) => ({
      studentId: row.student_id,
      classId,
      topicId: row.topic_id,
      gameId: row.game_id,
      gameOrder: row.game_order,
      score: row.score,
      maxScore: row.max_score,
      scorePct: row.score_pct,
      passed: row.passed,
      completedAt: row.completed_at,
    }));
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
}
