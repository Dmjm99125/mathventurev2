import { createClassesCreateHandler } from "./handler.ts";

const handler = createClassesCreateHandler();

Deno.serve((req) => handler(req));
