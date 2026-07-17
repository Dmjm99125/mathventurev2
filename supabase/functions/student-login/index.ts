import { createStudentLoginHandler } from "./handler.ts";

const handler = createStudentLoginHandler();

Deno.serve((req) => handler(req));
