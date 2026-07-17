import { createStudentRegisterHandler } from "./handler.ts";

const handler = createStudentRegisterHandler();

Deno.serve((req) => handler(req));
