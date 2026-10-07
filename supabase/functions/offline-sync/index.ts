import { createOfflineSyncHandler } from "./handler.ts";

Deno.serve(createOfflineSyncHandler());
