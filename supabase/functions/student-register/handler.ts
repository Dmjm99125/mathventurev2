import { corsHeaders, errorResponse } from "../_shared/cors.ts";

const STUDENT_ACCOUNT_CREATION_MESSAGE =
  "Student accounts must be created by a teacher.";

/**
 * Kept as a compatibility response for previously deployed clients.
 * Student accounts are now provisioned only through the teacher add-students flow.
 */
export function createStudentRegisterHandler() {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    return errorResponse(STUDENT_ACCOUNT_CREATION_MESSAGE, 410);
  };
}
