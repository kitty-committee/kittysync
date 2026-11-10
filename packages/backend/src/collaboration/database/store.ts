import { GLOBAL_PRESENCE_DOCUMENT, type UserDb } from "@kittysync/common";
import type { storePayload } from "@hocuspocus/server";
import { documentsTable } from "../../db/schema.ts";
import { DocumentIdConflict } from "../errors.ts";
import { db } from "../../app.ts";
import { eq } from "drizzle-orm";
import * as Y from "yjs";

export async function store({ documentName, state }: storePayload<{ user: UserDb }>) {
    // Global presence document has no state
    if (documentName === GLOBAL_PRESENCE_DOCUMENT) {
        return;
    }

    await db.transaction(async (tx) => {
        const docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName)).for("update");

        if (docs.length !== 1) throw new DocumentIdConflict();

        const newState = Y.mergeUpdates([docs[0].yDocState!, state]);
        const yDoc = new Y.Doc();
        Y.applyUpdate(yDoc, newState);

        await tx
            .update(documentsTable)
            .set({
                yDocState: Buffer.from(Y.encodeStateAsUpdate(yDoc)),
            })
            .where(eq(documentsTable.id, documentName));
    });
}
