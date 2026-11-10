import { createRandomSource } from "../seeded-random.ts";
import { describe, expect, it } from "vitest";

describe("createRandomSource", () => {
    it("produces an identical sequence for the same seed across instances", () => {
        const first = createRandomSource(20261109);
        const second = createRandomSource(20261109);
        const firstValues = Array.from({ length: 100 }, () => first.next());
        const secondValues = Array.from({ length: 100 }, () => second.next());
        expect(firstValues).toEqual(secondValues);
    });

    it("produces different sequences for different seeds", () => {
        const first = createRandomSource(1);
        const second = createRandomSource(2);
        expect(Array.from({ length: 10 }, () => first.next())).not.toEqual(
            Array.from({ length: 10 }, () => second.next()),
        );
    });

    it("returns integers within the inclusive bounds", () => {
        const random = createRandomSource(7);
        for (let index = 0; index < 1_000; index += 1) {
            const value = random.integer(3, 5);
            expect(value).toBeGreaterThanOrEqual(3);
            expect(value).toBeLessThanOrEqual(5);
        }
    });
});
