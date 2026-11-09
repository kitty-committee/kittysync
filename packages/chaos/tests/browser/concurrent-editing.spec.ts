import { expect, test, type BrowserContext, type Locator, type Page, type WebSocketRoute } from "@playwright/test";
import { createDocument, createIdentity, type TestIdentity } from "../../src/layer-2/backend-fixtures.ts";
import { createRandomSource } from "../../src/seeded-random.ts";
import { chaosConfig } from "../../src/config.ts";

const baseUrl = process.env["CHAOS_BASE_URL"] ?? "http://127.0.0.1:5173";

async function addSessionCookie(context: BrowserContext, identity: TestIdentity): Promise<void> {
    await context.addCookies([
        {
            name: "session",
            value: identity.cookie.slice("session=".length),
            url: baseUrl,
            sameSite: "Strict",
        },
    ]);
}

async function openEditor(page: Page, documentId: string): Promise<void> {
    await page.goto("/");
    const sessionStatus = await page.evaluate(async () => {
        const response = await fetch("/api/auth/session?session");
        return response.status;
    });
    if (sessionStatus !== 200) {
        throw new Error(`Browser session cookie was not accepted: HTTP ${sessionStatus}`);
    }

    await page.goto(`/app/documents/${documentId}`);
    const editButton = page.getByRole("button", { name: "Change View" });
    await expect(editButton).toBeEnabled();
    await expect(page.locator("nav")).toContainText("Connected");
    await editButton.click();
    await expect(page.locator(".editorelement [contenteditable='true']")).toBeVisible();
}

async function readEditorText(editor: Locator): Promise<string> {
    return editor.evaluate((element) => {
        const clone = element.cloneNode(true) as HTMLElement;
        clone.querySelectorAll(".collaboration-carets__caret").forEach((caret) => caret.remove());
        return clone.innerText;
    });
}

test("two browser clients converge through latency and offline edits", async ({ browser }, testInfo) => {
    const seed = chaosConfig.seed;
    await testInfo.attach("chaos-seed.txt", {
        body: `FC_SEED=${seed}\n`,
        contentType: "text/plain",
    });
    console.info(`[chaos] browser FC_SEED=${seed}`);

    const suffix = `${seed}-${process.pid}`;
    const [firstIdentity, secondIdentity] = await Promise.all([
        createIdentity(baseUrl, `chaos-e2e-${suffix}-one`),
        createIdentity(baseUrl, `chaos-e2e-${suffix}-two`),
    ]);
    const documentId = await createDocument(baseUrl, firstIdentity.cookie, "Browser chaos convergence");

    const firstContext = await browser.newContext();
    const secondContext = await browser.newContext();
    const contexts = [
        { context: firstContext, identity: firstIdentity, seedOffset: 11 },
        { context: secondContext, identity: secondIdentity, seedOffset: 23 },
    ];

    try {
        for (const { context, identity } of contexts) {
            await addSessionCookie(context, identity);
        }

        const pages = await Promise.all(contexts.map(({ context }) => context.newPage()));
        let offlineRoute: WebSocketRoute | undefined;
        for (const [index, page] of pages.entries()) {
            const client = contexts[index];
            if (client === undefined) throw new Error(`Missing browser context for page ${index}`);
            const random = createRandomSource(seed + client.seedOffset);
            await page.routeWebSocket("**/api/collaboration", (webSocket) => {
                if (index === 0) offlineRoute = webSocket;
                const server = webSocket.connectToServer();
                webSocket.onMessage((message) => {
                    setTimeout(() => server.send(message), random.integer(5, 25));
                });
                server.onMessage((message) => {
                    setTimeout(() => webSocket.send(message), random.integer(5, 25));
                });
            });
        }

        await Promise.all(pages.map((page) => openEditor(page, documentId)));
        const editors = pages.map((page) => page.locator(".editorelement [contenteditable='true']"));
        const [firstEditor, secondEditor] = editors;
        if (firstEditor === undefined || secondEditor === undefined) {
            throw new Error("Expected two browser editors");
        }

        await Promise.all([firstEditor.fill("alpha"), secondEditor.fill("beta")]);
        await expect
            .poll(async () => {
                const [firstText, secondText] = await Promise.all([
                    readEditorText(firstEditor),
                    readEditorText(secondEditor),
                ]);
                return {
                    converged: firstText === secondText,
                    hasAlpha: firstText.includes("alpha") && secondText.includes("alpha"),
                    hasBeta: firstText.includes("beta") && secondText.includes("beta"),
                    firstText,
                    secondText,
                };
            })
            .toMatchObject({ converged: true, hasAlpha: true, hasBeta: true });

        await firstContext.setOffline(true);
        if (offlineRoute === undefined) throw new Error("First browser WebSocket route was not created");
        await offlineRoute.close({ code: 1001, reason: "simulated offline edit" });
        await expect(pages[0].locator("nav")).toContainText("Disconnected");
        await Promise.all([
            firstEditor.press("End").then(() => firstEditor.pressSequentially(" offline-only")),
            secondEditor.press("End").then(() => secondEditor.pressSequentially(" online-only")),
        ]);
        await firstContext.setOffline(false);

        await expect
            .poll(async () => {
                const [firstText, secondText] = await Promise.all([
                    readEditorText(firstEditor),
                    readEditorText(secondEditor),
                ]);
                return (
                    firstText === secondText && firstText.includes("offline-only") && firstText.includes("online-only")
                );
            })
            .toBe(true);
    } finally {
        await Promise.all(contexts.map(({ context }) => context.close()));
    }
});
