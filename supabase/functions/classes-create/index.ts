import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

function generateJoinCode(): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return code;
}

// POST /classes-create { name: string }
// Teacher only. Creates a class with a fresh unique join code.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return errorResponse("Method not allowed", 405);

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);
  if (profile.role !== "teacher") return errorResponse("Only teachers can create classes", 403);

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";
  if (!name) return errorResponse("A class name is required", 422);

  let joinCode = generateJoinCode();
  for (let attempt = 0; attempt < 5; attempt++) {
    const { data: existing } = await adminClient
      .from("classes")
      .select("id")
      .eq("join_code", joinCode)
      .maybeSingle();
    if (!existing) break;
    joinCode = generateJoinCode();
  }

  const { data, error } = await adminClient
    .from("classes")
    .insert({ teacher_id: profile.id, name, join_code: joinCode })
    .select("id, name, join_code, created_at")
    .single();

  if (error) return errorResponse(error.message, 500);

  return jsonResponse({
    class: { id: data.id, name: data.name, joinCode: data.join_code, createdAt: data.created_at },
  }, 201);
});
