import { expect, test } from "vitest";
import { SHARED } from "./index.ts";

test("example test", () => {
    expect(SHARED).length.greaterThan(0);
});
