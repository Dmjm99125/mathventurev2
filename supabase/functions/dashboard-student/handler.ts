import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import {
  parseStudentDashboardAggregate,
  type StudentDashboardAggregate,
} from "../_shared/aggregate_contract.ts";

export type DashboardStudentDeps = {
  getAuthedProfile(req: Request): Promise<AuthedProfile | null>;
  getAggregate(studentId: string): Promise<StudentDashboardAggregate>;
};

const defaultDeps: DashboardStudentDeps = {
  async getAuthedProfile(req) {
    const { getAuthedProfile } = await import("../_shared/client.ts");
    return getAuthedProfile(req);
  },
  async getAggregate(studentId) {
    const { adminClient } = await import("../_shared/client.ts");
    const { data, error } = await adminClient.rpc("get_student_dashboard_summary", {
      p_student_id: studentId,
      p_recent_limit: 20,
    });
    if (error) throw error;
    return parseStudentDashboardAggregate(data);
  },
};

export function createDashboardStudentHandler(deps: DashboardStudentDeps = defaultDeps) {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "GET") return errorResponse("Method not allowed", 405);

    try {
      const profile = await deps.getAuthedProfile(req);
      if (!profile) return errorResponse("Unauthorized", 401);
      if (profile.role !== "student") {
        return errorResponse("Only students have a student dashboard", 403);
      }

      const aggregate = await deps.getAggregate(profile.id);
      return jsonResponse({
        ...aggregate,
        recentAttempts: aggregate.recentAttempts.slice(0, 20),
      });
    } catch (error) {
      console.error("dashboard-student failed", error);
      return errorResponse("We couldn't load the student dashboard right now.", 500);
    }
  };
}
