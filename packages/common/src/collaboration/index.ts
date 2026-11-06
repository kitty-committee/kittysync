export * from "./errors.ts";

import { userDbSchema } from "../validation.ts";
import * as z from "zod";

export const YJS_SHARED_TEXT = "shared-text";
export const GLOBAL_PRESENCE_DOCUMENT = "global:presence";

export const awarenessEditorStateSchema = z.object({
    inEditMode: z.boolean(),
});

export const awarenessStateSchema = z.object({
    user: userDbSchema,
    editor: awarenessEditorStateSchema.optional(),
});

export type AwarenessState = z.infer<typeof awarenessStateSchema>;
export type AwarenessEditorState = z.infer<typeof awarenessEditorStateSchema>;
