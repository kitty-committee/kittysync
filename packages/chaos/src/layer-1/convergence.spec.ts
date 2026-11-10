import { applyParagraphEdit, createParagraphEditor, editorSnapshot, type ParagraphEdit } from "./paragraph-editor.ts";
import { SimulatedNetwork, healDocuments, stateVector } from "./simulated-network.ts";
import { createRandomSource } from "../seeded-random.ts";
import { afterEach, describe, expect, it } from "vitest";
import { chaosConfig } from "../config.ts";
import * as fc from "fast-check";
import * as Y from "yjs";

const editors: ReturnType<typeof createParagraphEditor>[] = [];
const documents: Y.Doc[] = [];

afterEach(() => {
    for (const editor of editors.splice(0)) editor.destroy();
    for (const document of documents.splice(0)) document.destroy();
});

function createClients(count: number) {
    const clientDocuments = Array.from({ length: count }, () => new Y.Doc());
    const clientEditors = clientDocuments.map((document) => createParagraphEditor(document));
    documents.push(...clientDocuments);
    editors.push(...clientEditors);
    return { clientDocuments, clientEditors };
}

function destroyClients(clientDocuments: Y.Doc[], clientEditors: ReturnType<typeof createParagraphEditor>[]): void {
    for (const editor of clientEditors) {
        editor.destroy();
        editors.splice(editors.indexOf(editor), 1);
    }
    for (const document of clientDocuments) {
        document.destroy();
        documents.splice(documents.indexOf(document), 1);
    }
}

function assertConverged(clientDocuments: Y.Doc[], clientEditors: ReturnType<typeof createParagraphEditor>[]): void {
    const vectors = clientDocuments.map(stateVector);
    expect(new Set(vectors).size, "Yjs state vectors differ").toBe(1);

    const snapshots = clientEditors.map(editorSnapshot);
    expect(
        new Set(snapshots.map((snapshot) => JSON.stringify(snapshot.json))),
        "ProseMirror JSON differs",
    ).toHaveLength(1);
    expect(new Set(snapshots.map((snapshot) => snapshot.markdown)), "Markdown output differs").toHaveLength(1);
}

function applyEdit(
    clientEditors: ReturnType<typeof createParagraphEditor>[],
    client: number,
    edit: ParagraphEdit,
): void {
    applyParagraphEdit(clientEditors[client], edit);
}

const editArbitrary = fc.oneof(
    fc.record({
        type: fc.constant("insert" as const),
        client: fc.integer({ min: 0, max: 2 }),
        offset: fc.nat(30),
        text: fc.constantFrom("a", "b", "c", "x", "y", "z", "*"),
    }),
    fc.record({
        type: fc.constant("delete" as const),
        client: fc.integer({ min: 0, max: 2 }),
        offset: fc.nat(30),
        length: fc.integer({ min: 1, max: 5 }),
    }),
);

const networkActionArbitrary = fc.constantFrom("deliver", "drop", "duplicate", "advance");

const scenarioArbitrary = fc.record({
    actions: fc.array(
        fc.oneof(
            editArbitrary,
            networkActionArbitrary.map((type) => ({ type }) as const),
        ),
        { minLength: 10, maxLength: 60 },
    ),
    edits: fc.array(editArbitrary, { minLength: 6, maxLength: 30 }),
});

describe("in-memory Yjs convergence", () => {
    it("converges after concurrent paragraph edits and seeded transport faults", () => {
        console.info(`[chaos] FC_SEED=${chaosConfig.seed} FC_RUNS=${chaosConfig.runCount}`);
        const property = fc.property(scenarioArbitrary, (scenario) => {
            const { clientDocuments, clientEditors } = createClients(3);
            try {
                const random = createRandomSource(chaosConfig.seed);
                const network = new SimulatedNetwork(clientDocuments, chaosConfig.seed);

                for (const edit of scenario.edits) applyEdit(clientEditors, edit.client, edit);

                for (const action of scenario.actions) {
                    if ("client" in action) {
                        applyEdit(clientEditors, action.client, action);
                        continue;
                    }

                    switch (action.type) {
                        case "advance":
                            network.advance(random.integer(1, 20));
                            break;
                        case "deliver":
                            network.deliverRandom();
                            break;
                        case "drop":
                            network.dropRandom();
                            break;
                        case "duplicate":
                            network.duplicateRandom();
                            break;
                    }
                }

                for (let index = 0; index < 3; index += 1) {
                    applyEdit(clientEditors, 0, { type: "insert", offset: index, text: "q" });
                }

                const sourcePackets = network.packets.filter((packet) => packet.from === 0 && packet.to === 1);
                expect(sourcePackets.length).toBeGreaterThanOrEqual(3);
                network.advance(100);
                network.deliver(sourcePackets.at(-1)!.id);
                network.deliver(sourcePackets[0].id);

                const duplicatePacket = network.packets.find((packet) => packet.from === 0 && packet.to === 2);
                const droppedPacket = network.packets.find((packet) => packet.id !== duplicatePacket?.id);
                expect(duplicatePacket).toBeDefined();
                expect(droppedPacket).toBeDefined();
                network.duplicate(duplicatePacket!.id);
                network.drop(droppedPacket!.id);

                for (const packet of [...network.packets]) network.deliver(packet.id);

                expect(network.stats.delayed).toBeGreaterThan(0);
                expect(network.stats.dropped).toBeGreaterThan(0);
                expect(network.stats.duplicated).toBeGreaterThan(0);
                expect(network.stats.reordered).toBeGreaterThan(0);

                healDocuments(clientDocuments);
                assertConverged(clientDocuments, clientEditors);
            } finally {
                destroyClients(clientDocuments, clientEditors);
            }
        });

        const result = fc.check(property, {
            numRuns: chaosConfig.runCount,
            seed: chaosConfig.seed,
            ...(chaosConfig.path === undefined ? {} : { path: chaosConfig.path }),
        });

        if (result.failed) {
            const path = result.counterexamplePath ?? "<none>";
            throw new Error(
                `[chaos] convergence property failed; seed=${chaosConfig.seed} path=${path}. ` +
                `Replay with FC_SEED=${chaosConfig.seed} FC_PATH='${path}' FC_RUNS=${chaosConfig.runCount} ` +
                "pnpm chaos test:unit:property",
                { cause: result.errorInstance },
            );
        }

        expect(result.failed).toBe(false);
    }, 30_000 + chaosConfig.runCount * 500);

    it("detects a deliberately unhealed split", () => {
        const { clientDocuments, clientEditors } = createClients(2);

        try {
            applyEdit(clientEditors, 0, { type: "insert", offset: 0, text: "left" });
            applyEdit(clientEditors, 1, { type: "insert", offset: 0, text: "right" });

            expect(() => assertConverged(clientDocuments, clientEditors)).toThrow();
        } finally {
            destroyClients(clientDocuments, clientEditors);
        }
    });
});
