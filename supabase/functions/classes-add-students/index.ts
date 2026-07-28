import { createClassesAddStudentsHandler } from "./handler.ts";

const handler = createClassesAddStudentsHandler();

Deno.serve(handler);
