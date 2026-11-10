# KittySync chaos harness

The harness is split into three runners:

- **Layer 1 (`test:unit`)** creates three Yjs/Tiptap clients in memory, generates paragraph edits and transport events, heals with state-vector diffs, then checks state vectors, ProseMirror JSON, and Markdown. It also contains a negative control that verifies an unhealed split is rejected.
- **Layer 2 (`test:integration`)** starts two real Fastify/Hocuspocus instances using the configured PostgreSQL and Redis services. A seeded `ws` wrapper delays, drops, duplicates, and reorders messages before a reconnect and convergence check.
- **Layer 3 (`test:browser`)** drives two Chromium contexts against the running frontend/backend. It adds seeded WebSocket latency, performs concurrent edits, then tests offline editing and reconnection.

The PR workflow runs `pnpm check:chaos` with `FC_SEED=20261109` and `FC_RUNS=100`. There is intentionally no scheduled nightly workflow. Toxiproxy is not included.

## Running the layers

Layer 1 needs no services:

```sh
pnpm chaos test:unit
```

Layer 2 needs PostgreSQL and Redis. Start the repository's development services, then load the example environment:

```sh
pnpm stack up -d
set -a; source .env.example; set +a
pnpm chaos test:integration
```

Layer 3 needs Chromium and the database services. Start the database services, install Chromium once with `pnpm chaos exec playwright install chromium`, then run:

```sh
pnpm chaos test:browser
```

Run the browser and property-based chaos checks with `pnpm check:chaos`. The browser runner starts the frontend and backend dev servers and shuts them down when it completes.

## Seeds and replay

`FC_SEED` controls fast-check and the deterministic transport PRNG; its default is `20261109`. `FC_RUNS` controls property-test runs (default `100`). On a fast-check failure, the error includes the counterexample path and a replay command:

```sh
FC_SEED=20261109 FC_PATH='counterexample-path' FC_RUNS=100 pnpm chaos test:property
```

For an integration failure, replay the same scenario with:

```sh
FC_SEED=20261109 pnpm chaos test:integration
```

Playwright attaches the seed to the test result and retains traces and screenshots on failure.

## Extending scenarios

Add in-memory edits and network actions to `src/layer-1/convergence.spec.ts`, using the paragraph editor helpers so generated edits remain valid for the ProseMirror schema. Add real-server transport cases to `src/layer-2/hocuspocus.spec.ts`; use `waitUntil` for state transitions rather than fixed sleeps. Browser scenarios belong under `tests/browser/` and should wait on visible state or `expect.poll`, not fixed delays. Preserve the seed in every new source of chaos and include a useful state snapshot in failure output.

## Reconnection awareness

The real-server test checks that all clients see one another's active awareness states both before faults and after reconnect. Hocuspocus removes awareness states when a connection closes; a reconnect must re-publish the local state with an advanced Yjs awareness clock or the server can ignore it as stale. Providers refresh their non-null local state on each `open` event before the reconnect sync begins.

## Required status check

Configure branch protection / repository rulesets in GitHub to require the `check:chaos` status check (and any existing checks your repository requires). This GitHub setting cannot be enabled from the workflow file.
