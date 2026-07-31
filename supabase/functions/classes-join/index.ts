import { createClassesJoinHandler } from "./handler.ts";

const handler = createClassesJoinHandler();

Deno.serve((req) => handler(req));
