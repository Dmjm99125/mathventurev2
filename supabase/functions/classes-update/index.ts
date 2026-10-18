import { createClassesUpdateHandler } from "./handler.ts";

const handler = createClassesUpdateHandler();

Deno.serve((req) => handler(req));
