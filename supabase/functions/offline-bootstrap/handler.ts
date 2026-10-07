import type { AuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";
import type { OfflineTeacherSnapshot } from "../_shared/offline_snapshot.ts";
import { getOfflineTeacherSnapshot } from "../_shared/offline_snapshot.ts";

export type OfflineBootstrapDeps = {
  getAuthedProfile: (request: Request) => Promise<AuthedProfile | null>;
  getSnapshot: (teacherId: string) => Promise<OfflineTeacherSnapshot>;
};

function defaultDependencies(): OfflineBootstrapDeps {
  return {
    getAuthedProfile: async (request) => {
      const { getAuthedProfile } = await import("../_shared/client.ts");
      return getAuthedProfile(request);
    },
    getSnapshot: getOfflineTeacherSnapshot,
  };
}

export function createOfflineBootstrapHandler(
  dependencies: OfflineBootstrapDeps = defaultDependencies(),
): (request: Request) => Promise<Response> {
  return async (request) => {
    if (request.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (request.method !== "GET") return errorResponse("Method not allowed", 405);

    const profile = await dependencies.getAuthedProfile(request);
    if (!profile) return errorResponse("Unauthorized", 401);
    if (profile.role !== "teacher") return errorResponse("Only teachers can download offline data", 403);

    try {
      const snapshot = await dependencies.getSnapshot(profile.id);
      return jsonResponse({
        ...snapshot,
        teacher: {
          id: profile.id,
          role: profile.role,
          fullName: profile.full_name,
        },
      });
    } catch (error) {
      console.error("offline-bootstrap failed", error);
      return errorResponse("We couldn't download the offline classroom pack right now.", 500);
    }
  };
}
