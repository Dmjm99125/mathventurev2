import { adminClient, getAuthedProfile } from "../_shared/client.ts";
import { corsHeaders, errorResponse, jsonResponse } from "../_shared/cors.ts";

// GET /classes-list
// Teacher -> their own classes, each with a student count.
// Student -> the classes they're enrolled in.
Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const profile = await getAuthedProfile(req);
  if (!profile) return errorResponse("Unauthorized", 401);

  if (profile.role === "teacher") {
    const { data: classes, error } = await adminClient
      .from("classes")
      .select("id, name, join_code, created_at, class_students(count)")
      .eq("teacher_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) return errorResponse(error.message, 500);

    const shaped = (classes ?? []).map((c: any) => ({
      id: c.id,
      name: c.name,
      joinCode: c.join_code,
      createdAt: c.created_at,
      studentCount: c.class_students?.[0]?.count ?? 0,
    }));

    return jsonResponse({ classes: shaped });
  }

  const { data, error } = await adminClient
    .from("class_students")
    .select("joined_at, classes(id, name, join_code, teacher_id, profiles!classes_teacher_id_fkey(full_name))")
    .eq("student_id", profile.id);

  if (error) return errorResponse(error.message, 500);

  const shaped = (data ?? []).map((row: any) => ({
    id: row.classes.id,
    name: row.classes.name,
    teacherName: row.classes.profiles?.full_name ?? "Teacher",
    joinedAt: row.joined_at,
  }));

  return jsonResponse({ classes: shaped });
});
