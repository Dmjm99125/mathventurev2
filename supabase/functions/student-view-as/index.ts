import { createStudentViewAsHandler } from "./handler.ts";

const handler = createStudentViewAsHandler();

Deno.serve((req) => handler(req));
