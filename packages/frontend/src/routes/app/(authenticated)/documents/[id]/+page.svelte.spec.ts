import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { render } from "vitest-browser-svelte";
import DocumentPage from "./+page.svelte";
import { page } from "vitest/browser";

type ProviderOptions = {
    url: string;
    name: string;
    document: unknown;
    onStatus: (event: { status: string }) => void;
    onAuthenticationFailed: (event: { reason: string }) => void;
    onDisconnect: (event: { event: CloseEvent }) => void;
    onSynced: () => void;
};

type Awareness = {
    states: Map<number, unknown>;
    getStates: () => Map<number, unknown>;
    getLocalState: () => unknown | null;
    setLocalState: (state: unknown | null) => void;
};

type WebsocketProviderHarness = {
    status: string;
    listeners: Map<string, Set<(event: { status: string }) => void>>;
    on: (event: string, handler: (event: { status: string }) => void) => void;
    off: (event: string, handler: (event: { status: string }) => void) => void;
    emit: (event: string, payload: { status: string }) => void;
    connect: ReturnType<typeof vi.fn>;
    disconnect: ReturnType<typeof vi.fn>;
};

type ProviderHarness = {
    options: ProviderOptions;
    awareness: Awareness | null;
    configuration: { websocketProvider: WebsocketProviderHarness };
    listeners: Map<string, Set<() => void>>;
    on: (event: string, handler: () => void) => void;
    off: (event: string, handler: () => void) => void;
    emit: (event: string) => void;
    destroy: ReturnType<typeof vi.fn>;
};

type EditorHarness = {
    options: {
        element: HTMLElement;
        editable: boolean;
    };
    editable: boolean;
    setEditable: (editable: boolean) => void;
    getMarkdown: () => string;
    destroy: ReturnType<typeof vi.fn>;
};

const mocks = vi.hoisted(() => ({
    providers: [] as ProviderHarness[],
    editors: [] as EditorHarness[],
    goto: vi.fn(),
    resolve: vi.fn((path: string) => path),
}));

vi.mock("@hocuspocus/provider", () => ({
    WebSocketStatus: {
        Connecting: "connecting",
        Connected: "connected",
        Disconnected: "disconnected",
    },
    HocuspocusProvider: class {
        options: ProviderOptions;
        awareness: Awareness | null = {
            states: new Map([[1, {}]]),
            getStates() {
                return this.states;
            },
            getLocalState() {
                return this.states.get(1) ?? null;
            },
            setLocalState(state) {
                if (state === null) {
                    this.states.delete(1);
                } else {
                    this.states.set(1, state);
                }
            },
        };
        configuration: ProviderHarness["configuration"];
        listeners = new Map<string, Set<() => void>>();
        destroy = vi.fn();

        constructor(options: ProviderOptions) {
            this.options = options;
            const socket: WebsocketProviderHarness = {
                status: "connected",
                listeners: new Map(),
                on(event, handler) {
                    const handlers = this.listeners.get(event) ?? new Set();
                    handlers.add(handler);
                    this.listeners.set(event, handlers);
                },
                off(event, handler) {
                    this.listeners.get(event)?.delete(handler);
                },
                emit(event, payload) {
                    this.listeners.get(event)?.forEach((handler) => handler(payload));
                },
                connect: vi.fn(),
                disconnect: vi.fn(),
            };
            socket.connect.mockImplementation(() => {
                socket.status = "connected";
                socket.emit("status", { status: socket.status });
                this.options.onStatus({ status: socket.status });
                this.emit("open");
            });
            socket.disconnect.mockImplementation(() => {
                socket.status = "disconnected";
                socket.emit("status", { status: socket.status });
                this.options.onStatus({ status: socket.status });
            });
            this.configuration = { websocketProvider: socket };
            mocks.providers.push(this);
        }

        on(event: string, handler: () => void) {
            const handlers = this.listeners.get(event) ?? new Set();
            handlers.add(handler);
            this.listeners.set(event, handlers);
        }

        off(event: string, handler: () => void) {
            this.listeners.get(event)?.delete(handler);
        }

        emit(event: string) {
            this.listeners.get(event)?.forEach((handler) => handler());
        }
    },
}));

vi.mock("@tiptap/core", () => ({
    Editor: class {
        options: EditorHarness["options"];
        editable: boolean;
        destroy = vi.fn();

        constructor(options: EditorHarness["options"]) {
            this.options = options;
            this.editable = options.editable;
            mocks.editors.push(this);
        }

        setEditable(editable: boolean) {
            this.editable = editable;
        }

        getMarkdown() {
            return "";
        }
    },
}));

vi.mock("@tiptap/extension-collaboration", () => ({
    Collaboration: { configure: vi.fn(() => ({})) },
}));

vi.mock("@tiptap/extension-collaboration-caret", () => ({
    CollaborationCaret: { configure: vi.fn(() => ({})) },
}));

vi.mock("@tiptap/starter-kit", () => ({
    default: { configure: vi.fn(() => ({})) },
}));

vi.mock("@tiptap/markdown", () => ({
    Markdown: {},
}));

vi.mock("$app/navigation", () => ({
    goto: mocks.goto,
}));

vi.mock("$app/paths", () => ({
    resolve: mocks.resolve,
}));

const documentData = {
    documentId: "notes.md",
    user: {
        id: "00000000-0000-4000-8000-000000000001",
        name: "test-user",
        color: "#123456",
    },
};

function renderDocumentPage() {
    render(DocumentPage, { data: documentData });

    const provider = mocks.providers[0];
    if (!provider) {
        throw new Error("The document page did not create a Hocuspocus provider.");
    }

    return provider;
}

function getEditor() {
    const editor = mocks.editors[0];
    if (!editor) {
        throw new Error("The document page did not create a Tiptap editor.");
    }

    return editor;
}

describe("document page", () => {
    beforeEach(() => {
        mocks.providers = [];
        mocks.editors = [];
        mocks.goto.mockClear();
        mocks.resolve.mockClear();
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it("enables editing only after the collaboration provider connects and syncs", async () => {
        const provider = renderDocumentPage();
        const changeViewButton = page.getByRole("button", { name: "Change View" });

        expect(provider.options.url).toBe("/api/collaboration");
        expect(provider.options.name).toBe("notes.md");
        await expect.element(page.getByText("Disconnected")).toBeInTheDocument();
        await expect.element(page.getByText("0 connected users")).toBeInTheDocument();
        await expect.element(changeViewButton).toBeDisabled();

        provider.options.onStatus({ status: "connected" });
        await expect.element(page.getByText("Connected", { exact: true })).toBeInTheDocument();
        await expect.element(changeViewButton).toBeDisabled();

        provider.options.onSynced();
        await expect.element(changeViewButton).toBeEnabled();
        expect(mocks.editors).toHaveLength(1);
        expect(getEditor().editable).toBe(false);
    });

    it("shows a specific alert when authentication fails because the document was not found", async () => {
        const provider = renderDocumentPage();

        provider.options.onAuthenticationFailed({ reason: "document-not-found" });

        await expect.element(page.getByRole("alert")).toHaveTextContent("document-not-found");
    });

    it("shows a generic safe alert for other authentication failures", async () => {
        const provider = renderDocumentPage();

        provider.options.onAuthenticationFailed({ reason: "permission-denied" });

        await expect.element(page.getByRole("alert")).toHaveTextContent("permission-denied");
    });

    it("shows a reconnect alert when the provider closes an unbound connection", async () => {
        const provider = renderDocumentPage();

        provider.options.onDisconnect({ event: new CloseEvent("close", { code: 4001 }) });

        await expect
            .element(page.getByRole("alert"))
            .toHaveTextContent("Unable to connect to the document. Please try again.");
    });

    it("shows a sync alert when the provider closes for an unsupported message", async () => {
        const provider = renderDocumentPage();

        provider.options.onDisconnect({ event: new CloseEvent("close", { code: 4002 }) });

        await expect
            .element(page.getByRole("alert"))
            .toHaveTextContent("Unable to sync the document. Please try again.");
    });

    it("displays users from provider awareness updates", async () => {
        const provider = renderDocumentPage();

        provider.awareness?.states.clear();
        provider.awareness?.states.set(101, {
            user: { ...documentData.user, name: "alice" },
        });
        provider.awareness?.states.set(102, {
            user: { ...documentData.user, name: "bobby" },
        });
        provider.emit("awarenessChange");

        await expect.element(page.getByText("2 connected users")).toBeInTheDocument();
        await expect.element(page.getByRole("listitem").nth(0)).toHaveTextContent("alice");
        await expect.element(page.getByRole("listitem").nth(1)).toHaveTextContent("bobby");
    });

    it("waits for populated awareness before updating connected users", async () => {
        const consoleError = vi.spyOn(console, "error");
        const provider = renderDocumentPage();

        provider.emit("awarenessChange");

        await expect.element(page.getByText("0 connected users")).toBeInTheDocument();
        expect(consoleError).not.toHaveBeenCalledWith(
            "Failed to parse awareness state:",
            expect.anything(),
        );
        consoleError.mockRestore();

        provider.awareness?.states.set(1, {
            user: { ...documentData.user, name: "alice" },
        });
        provider.emit("awarenessChange");

        await expect.element(page.getByText("1 connected user")).toBeInTheDocument();
        await expect.element(page.getByRole("listitem")).toHaveTextContent("alice");
    });

    it("reconnects the existing collaboration session after a BFCache restore", async () => {
        const provider = renderDocumentPage();
        const socket = provider.configuration.websocketProvider;

        provider.options.onStatus({ status: "connected" });
        provider.options.onSynced();

        await expect.element(page.getByText("Connected", { exact: true })).toBeInTheDocument();
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeEnabled();
        await page.getByRole("button", { name: "Change View" }).click();
        expect(getEditor().editable).toBe(true);

        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: false }));
        expect(mocks.providers).toHaveLength(1);
        expect(socket.disconnect).not.toHaveBeenCalled();

        window.dispatchEvent(new PageTransitionEvent("pageshow", { persisted: true }));

        expect(mocks.providers).toHaveLength(1);
        expect(provider.destroy).not.toHaveBeenCalled();
        expect(socket.disconnect).toHaveBeenCalledOnce();
        expect(socket.connect).toHaveBeenCalledOnce();
        expect(provider.awareness?.getLocalState()).toEqual({ user: documentData.user });
        expect(getEditor().destroy).not.toHaveBeenCalled();
        expect(getEditor().editable).toBe(true);
        await expect.element(page.getByText("Connected", { exact: true })).toBeInTheDocument();
        await expect.element(page.getByRole("button", { name: "Change View" })).toBeEnabled();

        provider.emit("awarenessChange");
        await expect.element(page.getByText("1 connected user")).toBeInTheDocument();
        await expect.element(page.getByRole("listitem")).toHaveTextContent("test-user");
    });

    it("toggles the synced editor between view and edit mode", async () => {
        const provider = renderDocumentPage();
        provider.options.onStatus({ status: "connected" });
        provider.options.onSynced();

        const changeViewButton = page.getByRole("button", { name: "Change View" });
        const editor = getEditor();

        await changeViewButton.click();
        expect(editor.editable).toBe(true);

        await changeViewButton.click();
        expect(editor.editable).toBe(false);
    });

    it("navigates back to the documents list", async () => {
        renderDocumentPage();

        await page.getByRole("button", { name: "Back" }).click();

        expect(mocks.resolve).toHaveBeenCalledWith("/app/(authenticated)/documents");
        expect(mocks.goto).toHaveBeenCalledWith("/app/(authenticated)/documents");
    });
});
