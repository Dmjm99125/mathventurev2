import { createAttemptsSubmitHandler } from "./handler.ts";

const handler = createAttemptsSubmitHandler();

Deno.serve(handler);
