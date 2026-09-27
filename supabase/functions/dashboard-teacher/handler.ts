import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  parseTeacherDashboardAggregate,
  type TeacherDashboardAggregate,
} from "../_shared/aggregate_contract.ts";

export type DashboardTeacherDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getAggregate(teacherId: string): Promise<TeacherDashboardAggregate>;
};

const defaultDeps: DashboardTeacherDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getAggregate(teacherId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient.rpc("get_teacher_dashboard_summary", {
      p_teacher_id: teacherId,
    });
    if (error) throw error;
    return parseTeacherDashboardAggregate(data);
  },
};

export function createDashboardTeacherHandler(deps: DashboardTeacherDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "teacher") {
        return errorResponse("Only teachers have a teacher dashboard", 403);
      }

      const aggregate = await deps.getAggregate(profile.id);
      return jsonResponse(aggregate);
    } catch (error) {
      console.error("dashboard-teacher failed", error);
      return errorResponse("We couldn't load the teacher dashboard right now.", 500);
    }
  };
}
