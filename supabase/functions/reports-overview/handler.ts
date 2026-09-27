import type { AuthedProfile } from "../_shared/client.ts";
import type { TeacherReportsDataset } from "../_shared/teacher_reports.ts";
import {
  buildTeacherSingleClassroomAggregateReport,
  loadBoundedTeacherReportAggregate,
  type TeacherReportAggregateRequest,
} from "../_shared/teacher_reports.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import { PaginationInputError, parsePageRequest } from "../_shared/pagination.ts";
import {
  buildTeacherSingleClassroomReport,
  coerceTeacherReportsWindowKey,
  resolveTeacherReportsWindow,
} from "../../../frontend/src/lib/teacher/reports/index.ts";
import type { TeacherReportAggregate } from "../_shared/aggregate_contract.ts";

type ReportsOverviewDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getAggregate?(input: TeacherReportAggregateRequest): Promise<TeacherReportAggregate>;
  loadTeacherReportsDataset?(input: { teacherId: string }): Promise<TeacherReportsDataset>;
  now(): Date;
};

const defaultDeps: ReportsOverviewDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  getAggregate: loadBoundedTeacherReportAggregate,
  now: () => new Date(),
};

export function createReportsOverviewHandler(deps: ReportsOverviewDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") return errorResponse("Only teachers can view reports", 403);

      const url = new URL(req.url);
      const windowKey = coerceTeacherReportsWindowKey(url.searchParams.get("window"));
      const window = resolveTeacherReportsWindow(windowKey, deps.now());
      const { pageSize, cursor } = parsePageRequest(url);

      if (deps.getAggregate) {
        const aggregate = await deps.getAggregate({
          teacherId: profile.id,
          startAt: window.startAt,
          endAt: window.endAt,
          studentLimit: pageSize,
          studentCursor: cursor,
        });
        return jsonResponse(buildTeacherSingleClassroomAggregateReport({
          aggregate,
          windowKey,
          now: deps.now(),
        }));
      }

      if (!deps.loadTeacherReportsDataset) throw new Error("Report dependencies are incomplete");
      const dataset = await deps.loadTeacherReportsDataset({ teacherId: profile.id });
      return jsonResponse(buildTeacherSingleClassroomReport({
        ...dataset,
        windowKey,
        now: deps.now(),
      }));
    } catch (error) {
      if (error instanceof PaginationInputError) return errorResponse(error.message, error.status);
      console.error("reports-overview failed", error);
      return errorResponse("We couldn't load teacher reports right now.", 500);
    }
  };
}
