export * from "./errors.ts";

import { userDbSchema } from "../validation.ts";
import * as z from "zod";

export const YJS_SHARED_TEXT = "shared-text";
export const GLOBAL_PRESENCE_DOCUMENT = "global:presence";

export const awarenessStateSchema = z.object({
    user: userDbSchema,
});

export type AwarenessState = z.infer<typeof awarenessStateSchema>;
