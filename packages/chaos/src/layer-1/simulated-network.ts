import { createRandomSource, type RandomSource } from "../seeded-random.ts";
import * as Y from "yjs";

const networkOrigin = Symbol("simulated-network");

export type NetworkPacket = {
    id: number;
    from: number;
    to: number;
    sequence: number;
    sentAt: number;
    dueAt: number;
    update: Uint8Array;
};

export type NetworkStats = {
    delayed: number;
    dropped: number;
    duplicated: number;
    reordered: number;
};

export class SimulatedNetwork {
    readonly packets: NetworkPacket[] = [];
    readonly stats: NetworkStats = {
        delayed: 0,
        dropped: 0,
        duplicated: 0,
        reordered: 0,
    };

    private readonly random: RandomSource;
    private readonly sequenceByClient: number[];
    private readonly deliveredSequence = new Map<string, number>();
    private clock = 0;
    private nextPacketId = 0;

    constructor(
        readonly documents: Y.Doc[],
        seed: number,
    ) {
        this.random = createRandomSource(seed);
        this.sequenceByClient = documents.map(() => 0);

        documents.forEach((document, from) => {
            document.on("update", (update: Uint8Array, origin: unknown) => {
                if (origin === networkOrigin) return;

                const sequence = ++this.sequenceByClient[from];
                documents.forEach((_target, to) => {
                    if (to === from) return;

                    const latency = this.random.integer(1, 25);
                    this.packets.push({
                        dueAt: this.clock + latency,
                        from,
                        id: this.nextPacketId++,
                        sentAt: this.clock,
                        sequence,
                        to,
                        update: update.slice(),
                    });
                });
            });
        });
    }

    advance(milliseconds: number): void {
        this.clock += milliseconds;
    }

    deliver(packetId: number): void {
        const packetIndex = this.packets.findIndex((packet) => packet.id === packetId);
        if (packetIndex === -1) return;

        const [packet] = this.packets.splice(packetIndex, 1);
        this.clock = Math.max(this.clock, packet.dueAt);
        if (this.clock > packet.sentAt) {
            this.stats.delayed += 1;
        }

        const key = `${packet.from}:${packet.to}`;
        const lastDelivered = this.deliveredSequence.get(key);
        if (lastDelivered !== undefined && packet.sequence < lastDelivered) {
            this.stats.reordered += 1;
        }
        this.deliveredSequence.set(key, Math.max(lastDelivered ?? -1, packet.sequence));

        Y.applyUpdate(this.documents[packet.to], packet.update, networkOrigin);
    }

    drop(packetId: number): void {
        const packetIndex = this.packets.findIndex((packet) => packet.id === packetId);
        if (packetIndex === -1) return;

        this.packets.splice(packetIndex, 1);
        this.stats.dropped += 1;
    }

    duplicate(packetId: number): void {
        const packet = this.packets.find((candidate) => candidate.id === packetId);
        if (packet === undefined) return;

        this.packets.splice(this.packets.indexOf(packet), 1);
        Y.applyUpdate(this.documents[packet.to], packet.update, networkOrigin);
        Y.applyUpdate(this.documents[packet.to], packet.update, networkOrigin);
        this.stats.duplicated += 1;
    }

    deliverRandom(): void {
        const packet = this.packets[this.random.integer(0, this.packets.length - 1)];
        if (packet !== undefined) this.deliver(packet.id);
    }

    dropRandom(): void {
        const packet = this.packets[this.random.integer(0, this.packets.length - 1)];
        if (packet !== undefined) this.drop(packet.id);
    }

    duplicateRandom(): void {
        const packet = this.packets[this.random.integer(0, this.packets.length - 1)];
        if (packet !== undefined) this.duplicate(packet.id);
    }
}

export function healDocuments(documents: Y.Doc[]): void {
    for (let round = 0; round < documents.length; round += 1) {
        for (const source of documents) {
            for (const target of documents) {
                if (source === target) continue;

                const targetVector = Y.encodeStateVector(target);
                const missingUpdate = Y.encodeStateAsUpdate(source, targetVector);
                Y.applyUpdate(target, missingUpdate, networkOrigin);
            }
        }
    }
}

export function stateVector(document: Y.Doc): string {
    return Buffer.from(Y.encodeStateVector(document)).toString("hex");
}
