import * as Y from "yjs";

import {
    HocuspocusProvider,
    WebSocketStatus,
    type onStatusParameters,
    type onAuthenticationFailedParameters,
    type onDisconnectParameters,
} from "@hocuspocus/provider";
import {
    SOCKET_ERROR_UNBOUND_CONNECTION,
    SOCKET_ERROR_UNSUPPORTED_MESSAGE,
    awarenessStateSchema,
    type AwarenessState,
    type UserDb,
} from "@kittysync/common";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { Collaboration } from "@tiptap/extension-collaboration";
import type { Attachment } from "svelte/attachments";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import { Editor } from "@tiptap/core";
import { untrack } from "svelte";
import { pollNode } from "../../../../../lib/tiptap-extensions/poll-extension";

export type EditorPeer = {
    clientId: number;
    name: string;
};

export class KittySyncEditor {
    private _provider: HocuspocusProvider | null;
    public error: string | null = $state(null);
    public peers: EditorPeer[] = $state([]);
    public connected: boolean = $state(false);
    public loaded: boolean = $state(false);
    private _editor: Editor | null;
    public editable = $state(false);
    private readonly user: UserDb;
    public ready = $derived(this.connected && this.loaded);

    public constructor(options: { user: UserDb; editing: boolean }) {
        this.editable = options.editing;
        this.user = options.user;
        this._provider = null;
        this._editor = null;

        $effect(() => untrack(() => this._editor)?.setEditable(this.editable));
    }

    public get editor(): Editor {
        if (this._editor === null) throw new Error("Editor has not been attached yet.");
        return this._editor;
    }

    public get provider(): HocuspocusProvider {
        if (this._provider === null) throw new Error("Provider has not been attached yet.");
        return this._provider;
    }

    public attach = (document: string): Attachment => {
        return (element: Element) =>
            untrack(() => {
                const ydoc = new Y.Doc();
                const provider = this.createProvider(document, ydoc);
                const editor = this.createEditor(element, ydoc);

                // do not add listeners on the provider or editor here,
                // do them in their coresponding create functions
                window.addEventListener("pageshow", this.onpageshow);

                return () => {
                    // unsubscribe from events
                    window.removeEventListener("pageshow", this.onpageshow);

                    // destroy resources
                    provider.destroy();
                    editor.destroy();
                    ydoc.destroy();

                    // reset state
                    this.connected = false;
                    this._provider = null;
                    this.loaded = false;
                    this._editor = null;
                    this.peers = [];
                };
            });
    };

    private createEditor = (element: Element, ydoc: Y.Doc): Editor => {
        this._editor = new Editor({
            editable: this.editable,
            element: element,
            extensions: [
                StarterKit.configure({ undoRedo: false }),
                Collaboration.configure({ document: ydoc, field: "content" }),
                Markdown,
                pollNode,
                CollaborationCaret.configure({
                    provider: this.provider,
                    // collaboration caret requires the name and color of the user to display the caret correctly
                    user: this.user satisfies UserDb & { name: string; color: string },
                }),
            ],
        });

        return this._editor;
    };

    private createProvider = (document: string, ydoc: Y.Doc): HocuspocusProvider => {
        this._provider = new HocuspocusProvider({
            document: ydoc,
            name: document,
            url: "/api/collaboration",
            onStatus: this.onstatus,
            onAuthenticationFailed: this.onfail,
            onDisconnect: this.ondisconnect,
            onSynced: this.onsynced,
        });

        this._provider.on("awarenessChange", this.updatePeers);
        this._provider.on("open", this.republishPresence);
        return this._provider;
    };

    private onsynced = () => {
        this.loaded = true;
    };

    private ondisconnect = ({ event }: onDisconnectParameters) => {
        if (event.code === SOCKET_ERROR_UNBOUND_CONNECTION)
            this.error = "Unable to connect to the document. Please try again.";
        else if (event.code === SOCKET_ERROR_UNSUPPORTED_MESSAGE)
            this.error = "Unable to sync the document. Please try again.";
    };

    private onfail = ({ reason }: onAuthenticationFailedParameters) => {
        this.error = reason;
    };

    private onstatus = ({ status }: onStatusParameters) => {
        this.connected = status === "connected";
        if (this.connected) this.error = null;
    };

    private onpageshow = (event: PageTransitionEvent) => {
        if (event.persisted) this.reconnect();
    };

    private reconnect = () => {
        const socket = this.provider.configuration.websocketProvider;

        const reconnectWhenDisconnected = ({ status }: { status: WebSocketStatus }) => {
            if (status !== WebSocketStatus.Disconnected) return;

            socket.off("status", reconnectWhenDisconnected);
            void socket.connect();
        };

        socket.on("status", reconnectWhenDisconnected);
        socket.disconnect();

        if (socket.status === WebSocketStatus.Disconnected) {
            socket.off("status", reconnectWhenDisconnected);
            void socket.connect();
        }
    };

    private updatePeers = () => {
        if (this.provider.awareness == null) {
            console.error("Provider awareness is not available.");
            return;
        }

        const peers: EditorPeer[] = [];

        for (const [clientId, s] of this.provider.awareness.getStates()) {
            if (typeof s !== "object" || s === null || !("user" in s) || s["user"] == null) {
                continue;
            }

            let state: AwarenessState;
            try {
                state = awarenessStateSchema.parse(s);
            } catch (error) {
                console.error("Failed to parse awareness state:", error);
                continue;
            }

            peers.push({ clientId, name: state.user.name });
        }

        this.peers = peers;
    };

    private republishPresence = () => {
        const awareness = this.provider.awareness;
        if (!awareness) return;

        const state = awareness.getLocalState();
        if (state !== null && awarenessStateSchema.safeParse(state).success) awareness.setLocalState(state);
        else awareness.setLocalState({ user: this.user });
    };
}
