import { createClient } from "npm:@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

// Privileged client -- bypasses Row Level Security. Only ever used inside
// edge functions, never sent to the browser. Every function below performs
// its own authorization checks before touching data with this client.
export const adminClient = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

export interface AuthedProfile {
  id: string;
  role: "student" | "teacher";
  full_name: string;
}

// Resolves the calling user from the request's Authorization header and
// loads their profile (id + role). Returns null if the request is
// unauthenticated or the profile doesn't exist.
export async function getAuthedProfile(
  req: Request,
): Promise<AuthedProfile | null> {
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "");

  const { data: userData, error: userError } =
    await adminClient.auth.getUser(token);
  if (userError || !userData?.user) return null;

  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("id, role, full_name")
    .eq("id", userData.user.id)
    .single();

  if (profileError || !profile) return null;
  return profile as AuthedProfile;
}
