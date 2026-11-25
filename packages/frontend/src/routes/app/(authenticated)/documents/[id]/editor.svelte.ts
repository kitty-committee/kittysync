

import * as Y from "yjs";




import { untrack } from "svelte";
import { Collaboration } from "@tiptap/extension-collaboration";
import StarterKit from "@tiptap/starter-kit";
import { Markdown } from "@tiptap/markdown";
import {
    SOCKET_ERROR_UNBOUND_CONNECTION,
    SOCKET_ERROR_UNSUPPORTED_MESSAGE,
    awarenessStateSchema,
    type AwarenessState,
    type UserDb,
} from "@kittysync/common";
import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
import { Editor } from "@tiptap/core";
import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";


let connected = $state(false);
let documentLoaded = $state(false);
let connectionError = $state("");
let inEditMode = $state(false);
let editor: Editor | null = null;
let connectedUsers = $state<ConnectedUser[]>([]);


type ConnectedUser = {
    clientId: number;
    name: string;
};


// Start of getters
export function getConnected() {
    return connected
}

export function getDocumentLoaded() {
    return documentLoaded
}

export function getConnectedUsers() {
    return connectedUsers
}

export function getConnectionError() {
    return connectionError
}

export function getInEditMode() {
    return inEditMode
}

export function getEditor() {
    return editor
}
// End of getters

// Handles reconnection logic, called in the attachEditorElement function
function reconnect(provider: HocuspocusProvider) {
    const socket = provider.configuration.websocketProvider;

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
}

// Handles the initialisation
export function attachEditorElement(documentId: string, user: UserDb) {
    return (element: HTMLDivElement) => {
        const ydoc = new Y.Doc();

        console.log("Initializing provider for document:", documentId);

        const updateConnectedUsers = () => {
            if (provider.awareness == null) {
                console.error("Provider awareness is not available.");
                return;
            }

            const users: ConnectedUser[] = [];
            for (const [clientId, s] of provider.awareness.getStates()) {
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

                users.push({ clientId, name: state.user.name });
            }

            connectedUsers = users;
        };

        const republishPresence = (provider: HocuspocusProvider) => {
            const awareness = provider.awareness;
            if (!awareness) return;

            const state = awareness.getLocalState();
            if (state !== null && awarenessStateSchema.safeParse(state).success) {
                awareness.setLocalState(state);
            } else {
                awareness.setLocalState({ user: user });
            }
        };

        const pageshowListener = (event: PageTransitionEvent) => {
            if (event.persisted === true) {
                reconnect(provider);
            }
        };

        function initialiseProvider(document: Y.Doc) {
            const provider = new HocuspocusProvider({
                url: "/api/collaboration",
                name: documentId,
                document: document,
                onStatus: ({ status }) => {
                    connected = status === "connected";
                    if (connected) connectionError = "";
                },
                onAuthenticationFailed: ({ reason }) => {
                    connectionError = reason;
                },
                onDisconnect: ({ event }) => {
                    if (event.code === SOCKET_ERROR_UNBOUND_CONNECTION) {
                        connectionError = "Unable to connect to the document. Please try again.";
                    } else if (event.code === SOCKET_ERROR_UNSUPPORTED_MESSAGE) {
                        connectionError = "Unable to sync the document. Please try again.";
                    }
                },
                onSynced: () => {
                    if (editor) return;

                    editor = new Editor({
                        element,
                        extensions: [
                            StarterKit.configure({ undoRedo: false }),
                            Collaboration.configure({ document: ydoc, field: "content" }),
                            Markdown,
                            CollaborationCaret.configure({
                                provider,
                                // collaboration caret requires the name and color of the user to display the caret correctly
                                user: user satisfies UserDb & { name: string; color: string },
                            }),
                        ],
                        editable: inEditMode,
                    });

                    documentLoaded = true;
                },
            });

            provider.on("awarenessChange", updateConnectedUsers);

            return provider;
        }

        // Untrack the provider initialization to avoid unwanted reactivity during the setup phase. This ensures that the provider is only initialized once and not re-initialized on reactive updates.
        const provider = untrack(() => initialiseProvider(ydoc));
        window.addEventListener("pageshow", pageshowListener);
        provider.on("open", () => republishPresence(provider));

        return () => {
            console.log("Destroying editor and provider for document:", documentId);
            editor?.destroy();
            editor = null;
            provider.off("awarenessChange", updateConnectedUsers);
            provider.destroy();
            ydoc.destroy();
            connected = false;
            documentLoaded = false;
            window.removeEventListener("pageshow", pageshowListener);
        };
    }

}


export function toggleEditMode() {
    if (!editor) {
        throw new Error("Cannot toggle edit mode before the editor is initialized.");
    }

    inEditMode = !inEditMode;
    editor.setEditable(inEditMode);
}