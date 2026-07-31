import type { AuthedProfile } from "../_shared/client.ts";
import type { TeacherReportsDataset } from "../_shared/teacher_reports.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  buildTeacherSingleClassroomReport,
  coerceTeacherReportsWindowKey,
} from "../../../src/lib/teacher/reports/index.ts";

export function createReportsOverviewHandler(
  deps: {
    getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
    loadTeacherReportsDataset(input: { teacherId: string }): Promise<TeacherReportsDataset>;
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
      const windowKey = coerceTeacherReportsWindowKey(url.searchParams.get("window"));
      const dataset = await deps.loadTeacherReportsDataset({ teacherId: profile.id });

      return jsonResponse(
        buildTeacherSingleClassroomReport({
          ...dataset,
          windowKey,
          now: deps.now(),
        }),
      );
    } catch (error) {
      console.error("reports-overview failed", error);
      return errorResponse("We couldn't load teacher reports right now.", 500);
    }
  };
}
