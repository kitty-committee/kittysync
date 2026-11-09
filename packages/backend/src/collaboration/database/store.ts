import { GLOBAL_PRESENCE_DOCUMENT, YJS_SHARED_TEXT } from "@kittysync/common";
import type { storePayload } from "@hocuspocus/server";
import { documentsTable } from "../../db/schema.ts";
import { DocumentIdConflict } from "../errors.ts";
import { db } from "../../app.ts";
import { eq } from "drizzle-orm";
import * as Y from "yjs";

export async function store({ documentName, state }: storePayload<any>) {
    // Global presence document has no state
    if (documentName === GLOBAL_PRESENCE_DOCUMENT) {
        return;
    }

    await db.transaction(async (tx) => {
        const docs = await tx.select().from(documentsTable).where(eq(documentsTable.id, documentName));

        if (docs.length !== 1) throw new DocumentIdConflict();

        const newState = Y.mergeUpdates([docs[0].yDocState!, state]);
        const yDoc = new Y.Doc();
        Y.applyUpdate(yDoc, newState);

        await tx
            .update(documentsTable)
            .set({
                yDocState: Buffer.from(Y.encodeStateAsUpdate(yDoc)),
                // YJS does not explicitly expose the definition of toString in their types in such a way that satisfies eslint,
                // but an implementation will exist in runtime. I can't see a way around this annoyingly.
                // eslint-disable-next-line
                content: yDoc.getText(YJS_SHARED_TEXT).toString(),
            })
            .where(eq(documentsTable.id, documentName));
    });
}
