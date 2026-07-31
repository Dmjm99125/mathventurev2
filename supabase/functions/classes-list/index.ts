import { createClassesListHandler } from "./handler.ts";

const handler = createClassesListHandler();

Deno.serve((req) => handler(req));
