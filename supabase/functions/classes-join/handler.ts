import { corsHeaders, errorResponse } from "../_shared/cors.ts";

export function createClassesJoinHandler() {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }
    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    return errorResponse("Class codes are no longer supported.", 410);
  };
}
