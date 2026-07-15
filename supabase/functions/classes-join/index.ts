import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// POST /classes-join { joinCode: string }
// Student only. Enrolls the student in the class matching the join code.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "student") return errorResponse("Only students can join a class", 403);

  const body = await req.json().catch(() => null);
  const joinCode = typeof body?.joinCode === "string" ? body.joinCode.trim().toUpperCase() : "";
  if (!joinCode) return errorResponse("A join code is required", 422);

  const { data: klass, error: findError } = await adminClient
    .from("classes")
    .select("id, name")
    .eq("join_code", joinCode)
    .maybeSingle();

  if (findError) return errorResponse(findError.message, 500);
  if (!klass) return errorResponse("No class found with that code", 404);

  const { error: insertError } = await adminClient
    .from("class_students")
    .upsert({ class_id: klass.id, student_id: profile.id }, { onConflict: "class_id,student_id" });

  if (insertError) return errorResponse(insertError.message, 500);

  return jsonResponse({ class: { id: klass.id, name: klass.name } });
});
