import { createClassesRosterHandler } from "./handler.ts";

const handler = createClassesRosterHandler();

Deno.serve(handler);
