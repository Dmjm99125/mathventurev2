import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildTeacherClassReport,
  coerceTeacherReportsWindowKey,
} from "../../../src/lib/teacher-reports.ts";

type TeacherReportsDataset = {
  classes: import("../../../src/lib/teacher-reports.ts").TeacherReportClassRecord[];
  students: import("../../../src/lib/teacher-reports.ts").TeacherReportStudentRecord[];
  results: import("../../../src/lib/teacher-reports.ts").TeacherReportGameResultRecord[];
};

export function createReportsClassHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
    loadTeacherReportsDataset(input: { teacherId: string; classId: string }): Promise<TeacherReportsDataset>;
    now(): Date;
  } = {
    async getAuthedProfile(req) {
      const { getAuthedProfile } = await import("../_shared/client.ts");
      return getAuthedProfile(req);
    },
    async loadTeacherReportsDataset(input) {
      const { loadTeacherReportsDataset } = await import("../_shared/teacher_reports.ts");
      return loadTeacherReportsDataset(input);
    },
    now: () => new Date(),
  },
) {
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
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers can view reports", 403);
      }

      const url = new URL(req.url);
      const classId = url.searchParams.get("classId");
      if (!classId) {
        return errorResponse("classId is required", 422);
      }

      const dataset = await deps.loadTeacherReportsDataset({ teacherId: profile.id, classId });
      if (!dataset.classes.length) {
        return errorResponse("Class not found", 404);
      }

      return jsonResponse(
        buildTeacherClassReport({
          ...dataset,
          classId,
          windowKey: coerceTeacherReportsWindowKey(url.searchParams.get("window")),
          now: deps.now(),
        }),
      );
    } catch (error) {
      console.error("reports-class failed", error);
      return errorResponse("We couldn't load that class report right now.", 500);
    }
  };
}
