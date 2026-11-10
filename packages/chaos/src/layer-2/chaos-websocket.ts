import { createRandomSource, type RandomSource } from "../seeded-random.ts";
import WebSocket from "ws";

type FaultPlan = {
    action: "deliver" | "drop" | "duplicate";
    delay: number;
};

export type ChaosStats = {
    delayed: number;
    dropped: number;
    duplicated: number;
    reordered: number;
};

export type ChaosPolicy = {
    active: boolean;
    stats: ChaosStats;
    plan(direction: "incoming" | "outgoing"): FaultPlan;
};

export type ChaosWebSocketConstructor = new (address: string | URL) => WebSocket;

export function createChaosPolicy(seed: number): ChaosPolicy {
    const random: RandomSource = createRandomSource(seed);
    const messages = { incoming: 0, outgoing: 0 };
    const stats: ChaosStats = {
        delayed: 0,
        dropped: 0,
        duplicated: 0,
        reordered: 0,
    };

    return {
        active: false,
        stats,
        plan(direction) {
            const sequence = messages[direction]++;
            const action = sequence % 9 === 3 ? "drop" : sequence % 9 === 6 ? "duplicate" : "deliver";
            const delay = sequence % 2 === 0 ? random.integer(20, 35) : random.integer(1, 8);

            if (action === "drop") stats.dropped += 1;
            if (action === "duplicate") stats.duplicated += 1;

            return { action, delay };
        },
    };
}

export function createChaosWebSocket(cookie: string, policy: ChaosPolicy): ChaosWebSocketConstructor {
    return class ChaosWebSocket extends WebSocket {
        private readonly scheduled = new Set<NodeJS.Timeout>();
        private incomingSequence = 0;
        private lastIncomingSequence = -1;
        private outgoingSequence = 0;
        private lastOutgoingSequence = -1;

        constructor(address: string | URL) {
            console.info(`[chaos] opening WebSocket ${address}`);
            super(address, { headers: { Cookie: cookie } });
        }

        override send(data: Parameters<WebSocket["send"]>[0]): void {
            if (!policy.active) {
                super.send(data);
                return;
            }

            const sequence = this.outgoingSequence++;
            const plan = policy.plan("outgoing");
            if (plan.action === "drop") return;
            let delayCounted = false;

            const dispatch = () => {
                if (sequence < this.lastOutgoingSequence) policy.stats.reordered += 1;
                this.lastOutgoingSequence = Math.max(this.lastOutgoingSequence, sequence);
                if (this.readyState === WebSocket.OPEN) {
                    super.send(data);
                    if (plan.delay > 0 && !delayCounted) {
                        policy.stats.delayed += 1;
                        delayCounted = true;
                    }
                }
            };

            this.schedule(dispatch, plan.delay);
            if (plan.action === "duplicate") this.schedule(dispatch, plan.delay + 1);
        }

        override emit(eventName: string | symbol, ...args: unknown[]): boolean {
            if (eventName !== "message" || !policy.active) {
                return super.emit(eventName, ...args);
            }

            const sequence = this.incomingSequence++;
            const plan = policy.plan("incoming");
            if (plan.action === "drop") return true;
            let delayCounted = false;

            const dispatch = () => {
                if (sequence < this.lastIncomingSequence) policy.stats.reordered += 1;
                this.lastIncomingSequence = Math.max(this.lastIncomingSequence, sequence);
                super.emit(eventName, ...args);
                if (plan.delay > 0 && !delayCounted) {
                    policy.stats.delayed += 1;
                    delayCounted = true;
                }
            };

            this.schedule(dispatch, plan.delay);
            if (plan.action === "duplicate") this.schedule(dispatch, plan.delay + 1);
            return true;
        }

        override close(code?: number, data?: string | Buffer): void {
            for (const timer of this.scheduled) clearTimeout(timer);
            this.scheduled.clear();
            super.close(code, data);
        }

        private schedule(callback: () => void, delay: number): void {
            const timer = setTimeout(() => {
                this.scheduled.delete(timer);
                callback();
            }, delay);
            this.scheduled.add(timer);
        }
    };
}
