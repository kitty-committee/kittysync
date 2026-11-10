import { GLOBAL_PRESENCE_DOCUMENT, YJS_SHARED_TEXT, type UserDb } from "@kittysync/common";
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

        docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName)).for("update");

        const newDoc = new Y.Doc();
        const newDocText = newDoc.getText(YJS_SHARED_TEXT);
        newDocText.insert(0, docs[0].content);

        await tx
            .update(documentsTable)
            .set({
                yDocState: Buffer.from(Y.encodeStateAsUpdate(newDoc)),
                // YJS does not explicitly expose the definition of toString in their types in such a way that satisfies eslint,
                // but an implementation will exist in runtime. I can't see a way around this annoyingly.
                // eslint-disable-next-line @typescript-eslint/no-base-to-string
                content: newDocText.toString(),
            })
            .where(eq(documentsTable.id, documentName));

        docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName));

        if (docs.length !== 1) throw new DocumentIdConflict();

        return docs[0].yDocState;
    });
}
