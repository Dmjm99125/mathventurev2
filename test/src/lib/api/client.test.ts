import { assertEquals } from "jsr:@std/assert";

Deno.env.set("VITE_SUPABASE_URL", "https://example.supabase.co");
Deno.env.set("VITE_SUPABASE_ANON_KEY", "test-anon-key");

const { invokeFunction } = await import("../../../../src/lib/api/client.ts");
type AuthClient = import("../../../../src/lib/api/client.ts").AuthClient;

Deno.test("invokeFunction can use an explicitly selected auth client", async () => {
  const calls: string[] = [];
  const studentClient = {
    functions: {
      invoke: async () => {
        calls.push("student");
        return { data: { ok: true }, error: null };
      },
    },
  };

  await invokeFunction<{ ok: boolean }>(
    "dashboard-student",
    undefined,
    studentClient as unknown as AuthClient,
  );

  assertEquals(calls, ["student"]);
});
