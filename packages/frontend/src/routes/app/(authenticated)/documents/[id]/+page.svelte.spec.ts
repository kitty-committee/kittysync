import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import DocumentPage from "./+page.svelte";
import { page } from "vitest/browser";

const route = vi.hoisted(() => ({ params: { id: "notes.md" } }));

vi.mock("$app/state", () => ({ page: route }));

class MockWebSocket extends EventTarget {
    static instances: MockWebSocket[] = [];

    readyState = 0;
    onopen: ((event: Event) => void) | null = null;
    onmessage: ((event: MessageEvent) => void) | null = null;
    onclose: ((event: Event) => void) | null = null;
    sent: string[] = [];

    constructor(public url: string) {
        super();
        MockWebSocket.instances.push(this);
    }

    send(data: string) {
        this.sent.push(data);
    }

    close() {
        this.readyState = 3;
        this.dispatchEvent(new Event("close"));
    }

    open() {
        this.readyState = 1;
        this.dispatchEvent(new Event("open"));
    }

    receive(packet: unknown) {
        this.dispatchEvent(new MessageEvent("message", { data: JSON.stringify(packet) }));
    }

    override dispatchEvent(event: Event) {
        const dispatched = super.dispatchEvent(event);

        if (event.type === "open") this.onopen?.(event);
        if (event.type === "close") this.onclose?.(event);
        if (event.type === "message") this.onmessage?.(event as MessageEvent);

        return dispatched;
    }
}

describe("document page", () => {
    beforeEach(() => {
        route.params.id = "notes.md";
        MockWebSocket.instances = [];
        vi.stubGlobal("WebSocket", MockWebSocket);
    });

    afterEach(() => {
        vi.unstubAllGlobals();
    });

    it("connects for the route document and displays the connection state", async () => {
        render(DocumentPage);
        const socket = MockWebSocket.instances[0];
        expect(socket).toBeDefined();
        const protocol = location.protocol === "https:" ? "wss" : "ws";
        expect(socket?.url).toBe(`${protocol}://${location.host}/api/websocket?fileID=notes.md`);
        await expect.element(page.getByText("Disconnected")).toBeInTheDocument();
        await expect.element(page.getByText("Users: 0")).toBeInTheDocument();
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeDisabled();

        socket?.open();

        await expect.element(page.getByText("Connected")).toBeInTheDocument();
        expect(socket?.sent).toContain(JSON.stringify({ type: "open", data: null }));
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeDisabled();

        socket?.receive({ type: "updateFile", data: { file: "Initial document" } });
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeEnabled();

        socket?.close();

        await expect.element(page.getByText("Disconnected")).toBeInTheDocument();
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeDisabled();
    });

    it("renders incoming document and user updates", async () => {
        render(DocumentPage);

        const socket = MockWebSocket.instances[0];
        socket?.open();
        socket?.receive({ type: "updateFile", data: { file: "# Shared notes\n\nLatest update" } });
        socket?.receive({ type: "updateUsers", data: { userList: ["alice", "bob"] } });

        await expect.element(page.getByRole("heading", { level: 1, name: "Shared notes" })).toBeInTheDocument();
        await expect.element(page.getByText("Latest update")).toBeInTheDocument();
        await expect.element(page.getByText("Users: 2")).toBeInTheDocument();
    });

    it("does not save edits until the Save button is clicked", async () => {
        render(DocumentPage);

        const socket = MockWebSocket.instances[0];
        socket?.open();
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeDisabled();
        socket?.receive({ type: "updateFile", data: { file: "Original document" } });

        await page.getByRole("button", { name: "Change View" }).click();
        const editor = page.getByRole("textbox");
        await expect.element(editor).toHaveValue("Original document");
        await editor.fill("Saved from the button");

        expect(socket?.sent).not.toContain(
            JSON.stringify({ type: "saveFile", data: { file: "Saved from the button" } }),
        );

        await page.getByRole("button", { name: "Save" }).click();

        await expect
            .poll(() => socket?.sent)
            .toContain(JSON.stringify({ type: "saveFile", data: { file: "Saved from the button" } }));
    });
});
