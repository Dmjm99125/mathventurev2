import { corsHeaders, errorResponse } from "../_shared/cors.ts";
const STUDENT_LOGIN_DISABLED_MESSAGE =
  "Student login is available only through a teacher account.";

export function createStudentLoginHandler() {
  return async (req: Request): Promise<Response> => {
    if (req.method === "OPTIONS") {
      return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
      return errorResponse("Method not allowed", 405);
    }

    return errorResponse(STUDENT_LOGIN_DISABLED_MESSAGE, 410);
  };
}
