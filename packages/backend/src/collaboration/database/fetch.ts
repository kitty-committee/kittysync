import { GLOBAL_PRESENCE_DOCUMENT, type UserDb } from "@kittysync/common";
import type { fetchPayload } from "@hocuspocus/server";
import { documentsTable } from "../../db/schema.ts";
import { DocumentIdConflict } from "../errors.ts";
import { db } from "../../app.ts";
import { eq } from "drizzle-orm";
import * as Y from "yjs";

export async function fetch({ documentName }: fetchPayload<{ user: UserDb }>) {
    // Global presence document has no state
    if (documentName === GLOBAL_PRESENCE_DOCUMENT) {
        return null;
    }
    return await db.transaction(async (tx) => {
        let docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName));

        if (docs.length !== 1) throw new DocumentIdConflict();

        const state = docs[0].yDocState;
        if (state !== null) return state;

        await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName)).for("update");

        const newDoc = new Y.Doc();

        await tx
            .update(documentsTable)
            .set({
                yDocState: Buffer.from(Y.encodeStateAsUpdate(newDoc)),
            })
            .where(eq(documentsTable.id, documentName));

        docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName));

        if (docs.length !== 1) throw new DocumentIdConflict();

        return docs[0].yDocState;
    });
}
