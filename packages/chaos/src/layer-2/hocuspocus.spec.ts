import { applyParagraphEdit, createParagraphEditor, editorSnapshot } from "../layer-1/paragraph-editor.ts";
import { createChaosPolicy, createChaosWebSocket, type ChaosPolicy } from "./chaos-websocket.ts";
import { HocuspocusProvider, type HocuspocusProviderWebsocket } from "@hocuspocus/provider";
import { createDocument, createIdentity, type TestIdentity } from "./backend-fixtures.ts";
import { createApp } from "@kittysync/backend/src/app.ts";
import { createRandomSource } from "../seeded-random.ts";
import { awarenessStateSchema } from "@kittysync/common";
import { waitUntil } from "../wait-until.ts";
import { chaosConfig } from "../config.ts";
import { expect, test } from "vitest";
import * as Y from "yjs";

type Client = {
    document: Y.Doc;
    editor: ReturnType<typeof createParagraphEditor>;
    identity: TestIdentity;
    policy: ChaosPolicy;
    provider: HocuspocusProvider;
    socket: HocuspocusProviderWebsocket;
};

function createClient(url: string, documentName: string, identity: TestIdentity, seed: number): Client {
    const document = new Y.Doc();
    const editor = createParagraphEditor(document);
    const policy = createChaosPolicy(seed);
    const configuration = {
        url,
        document,
        name: documentName,
        WebSocketPolyfill: createChaosWebSocket(identity.cookie, policy),
        autoConnect: false,
        initialDelay: 1,
        delay: 10,
        minDelay: 1,
        jitter: false,
    };
    const provider = new HocuspocusProvider(configuration);
    const socket = provider.configuration.websocketProvider;
    provider.awareness?.setLocalState({ user: identity.user });
    socket.on("status", ({ status }: { status: string }) => console.info(`[chaos] ${url} websocket ${status}`));
    socket.on("maxAttemptsFailed", ({ error }: { error: unknown }) =>
        console.error(`[chaos] WebSocket retry failed: ${String(error)}`),
    );
    provider.on("authenticationFailed", ({ reason }: { reason: string }) =>
        console.error(`[chaos] authentication failed: ${reason}`),
    );
    void socket.connect().catch((error: unknown) => console.error(`[chaos] socket connect failed: ${String(error)}`));

    return { document, editor, identity, policy, provider, socket };
}

function awarenessSnapshot(client: Client): string {
    const awareness = client.provider.awareness;
    if (awareness === null) {
        throw new Error("Hocuspocus provider did not create an awareness instance");
    }

    const states = [...awareness.getStates()].map(([clientId, state]) => {
        const parsed = awarenessStateSchema.parse(state);
        return {
            clientId,
            color: parsed.user.color,
            name: parsed.user.name,
            userId: parsed.user.id,
        };
    });
    states.sort((left, right) => left.clientId - right.clientId);
    return JSON.stringify(states);
}

function documentsConverged(clients: Client[]): boolean {
    const vectors = clients.map((client) => Buffer.from(Y.encodeStateVector(client.document)).toString("hex"));
    if (new Set(vectors).size !== 1) return false;

    const snapshots = clients.map((client) => JSON.stringify(editorSnapshot(client.editor)));
    return new Set(snapshots).size === 1;
}

function awarenessConverged(clients: Client[]): boolean {
    if (clients.some((client) => client.provider.awareness?.getStates().size !== clients.length)) return false;
    const snapshots = clients.map(awarenessSnapshot);
    return snapshots.every((snapshot) => snapshot === snapshots[0]);
}

test("real Hocuspocus nodes converge after seeded WebSocket faults and reconnect", async () => {
    console.info(`[chaos] FC_SEED=${chaosConfig.seed}`);
    const apps: Awaited<ReturnType<typeof createApp>>[] = [];
    const clients: Client[] = [];

    try {
        for (const name of ["chaos-node-one", "chaos-node-two"]) {
            const app = await createApp({ name });
            await app.listen({ host: "127.0.0.1", port: 0 });
            apps.push(app);
        }

        const baseUrls = apps.map((app) => {
            const address = app.server.address();
            if (address === null || typeof address === "string") {
                throw new Error("Backend did not expose a TCP address");
            }
            return `http://127.0.0.1:${address.port}`;
        });
        const identities = await Promise.all(
            baseUrls.map((url, index) => createIdentity(url, `chaos-${chaosConfig.seed}-${index}`)),
        );
        const documentName = await createDocument(baseUrls[0], identities[0].cookie, "chaos-convergence");
        const websocketUrls = baseUrls.map((url) => url.replace(/^http/, "ws") + "/api/collaboration");

        clients.push(
            createClient(websocketUrls[0], documentName, identities[0], chaosConfig.seed + 11),
            createClient(websocketUrls[0], documentName, identities[1], chaosConfig.seed + 23),
            createClient(websocketUrls[1], documentName, identities[0], chaosConfig.seed + 37),
        );

        await waitUntil(
            () => clients.every((client) => client.socket.webSocket !== null),
            "all Hocuspocus WebSocket objects to be created",
            5_000,
        );
        await waitUntil(
            () => clients.every((client) => client.provider.synced),
            "all Hocuspocus clients to complete initial sync",
            15_000,
        );

        for (const [index, client] of clients.entries()) {
            applyParagraphEdit(client.editor, {
                type: "insert",
                offset: 0,
                text: String.fromCharCode(97 + index),
            });
        }
        await waitUntil(
            () => documentsConverged(clients),
            "concurrent edits to converge across backend nodes without injected faults",
            10_000,
        );

        for (const client of clients) client.policy.active = true;

        const random = createRandomSource(chaosConfig.seed);
        for (let clientIndex = 0; clientIndex < clients.length; clientIndex += 1) {
            const client = clients[clientIndex];
            for (let editIndex = 0; editIndex < 9; editIndex += 1) {
                const paragraph = client.editor.state.doc.firstChild;
                if (paragraph === null) throw new Error("Editor has no paragraph for generated operations");

                if (editIndex < 6) {
                    applyParagraphEdit(client.editor, {
                        type: "insert",
                        offset: random.integer(0, paragraph.content.size),
                        text: String.fromCharCode(97 + random.integer(0, 25)),
                    });
                } else if (paragraph.content.size > 0) {
                    applyParagraphEdit(client.editor, {
                        type: "delete",
                        offset: random.integer(0, paragraph.content.size - 1),
                        length: 1,
                    });
                }
            }
        }

        await waitUntil(
            () =>
                clients.some((client) => client.policy.stats.delayed > 0) &&
                clients.some((client) => client.policy.stats.dropped > 0) &&
                clients.some((client) => client.policy.stats.duplicated > 0) &&
                clients.some((client) => client.policy.stats.reordered > 0),
            "seeded latency, drops, duplicates, and out-of-order delivery",
            10_000,
        );

        for (const client of clients) client.policy.active = false;
        for (const client of clients) client.socket.disconnect();
        await waitUntil(
            () => clients.every((client) => client.socket.status === "disconnected"),
            "all Hocuspocus sockets to finish disconnecting before reconnection",
            5_000,
        );
        await Promise.all(clients.map((client) => client.provider.connect()));

        await waitUntil(
            () => clients.every((client) => client.provider.synced) && documentsConverged(clients),
            "all document states to converge after reconnection",
            15_000,
        );
        await waitUntil(
            () => awarenessConverged(clients),
            "all active awareness states to reach every client after reconnection",
            15_000,
        );

        expect(documentsConverged(clients)).toBe(true);
        expect(
            awarenessConverged(clients),
            "all active awareness states to reach every client after reconnection",
        ).toBe(true);
        for (const client of clients) {
            expect(client.policy.stats.delayed).toBeGreaterThan(0);
            expect(client.policy.stats.dropped).toBeGreaterThan(0);
            expect(client.policy.stats.duplicated).toBeGreaterThan(0);
            expect(client.policy.stats.reordered).toBeGreaterThan(0);
        }
    } catch (error) {
        const observed = clients.map((client) => ({
            stateVector: Buffer.from(Y.encodeStateVector(client.document)).toString("hex"),
            editor: editorSnapshot(client.editor),
            awareness: client.provider.awareness ? [...client.provider.awareness.getStates()] : null,
            localAwareness: client.provider.awareness?.getLocalState() ?? null,
            synced: client.provider.synced,
            websocketStatus: client.socket.status,
            faults: client.policy.stats,
        }));
        throw new Error(
            `[chaos] Hocuspocus scenario failed; seed=${chaosConfig.seed}; observed=${JSON.stringify(observed)}`,
            { cause: error },
        );
    } finally {
        for (const client of clients) {
            client.policy.active = false;
            client.provider.destroy();
            client.socket.disconnect();
            client.editor.destroy();
            client.document.destroy();
        }
        for (const app of apps) await app.close();
    }
}, 60_000);
