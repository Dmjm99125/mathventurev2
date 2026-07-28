import { createClassesRemoveStudentHandler } from "./handler.ts";

const handler = createClassesRemoveStudentHandler();

Deno.serve(handler);
