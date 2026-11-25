<script lang="ts">
    import {
        faBold,
        faItalic,
        faUnderline,
        faStrikethrough,
        faListOl,
        faListUl,
        faHeading,
        faEye,
        faPen,
    } from "@fortawesome/free-solid-svg-icons";
    import {
        SOCKET_ERROR_UNBOUND_CONNECTION,
        SOCKET_ERROR_UNSUPPORTED_MESSAGE,
        awarenessStateSchema,
        type AwarenessState,
        type UserDb,
    } from "@kittysync/common";
    import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
    import { HocuspocusProvider, WebSocketStatus } from "@hocuspocus/provider";
    import { faFileLines } from "@fortawesome/free-regular-svg-icons";
    import { Collaboration } from "@tiptap/extension-collaboration";
    import StarterKit from "@tiptap/starter-kit";
    import { Markdown } from "@tiptap/markdown";
    import { goto } from "$app/navigation";
    import { Editor } from "@tiptap/core";
    import { resolve } from "$app/paths";
    import { onMount } from "svelte";
    import Fa from "svelte-fa";
    import * as Y from "yjs";

    let connected = $state(false);
    let documentLoaded = $state(false);
    let inEditMode = $state(false);
    let connectionError = $state("");
    let editorElement = $state<HTMLDivElement | undefined>(undefined);
    let editor: Editor | null = null;

    type ConnectedUser = {
        clientId: number;
        name: string;
    };

    let { data } = $props();

    let connectedUsers = $state<ConnectedUser[]>([]);

    function attachEditorElement(element: HTMLDivElement) {
        editorElement = element;
        return () => {
            editorElement = undefined;
        };
    }

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

    function toggleEditMode() {
        if (!editor) {
            throw new Error("Cannot toggle edit mode before the editor is initialized.");
        }

        const nextEditMode = !inEditMode;
        editor.setEditable(nextEditMode);
        inEditMode = nextEditMode;
    }

    onMount(() => {
        const ydoc = new Y.Doc();

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

        let provider = initialiseProvider(ydoc);

        const republishPresence = (provider: HocuspocusProvider) => {
            const awareness = provider.awareness;
            if (!awareness) return;

            const state = awareness.getLocalState();
            if (state !== null && awarenessStateSchema.safeParse(state).success) {
                awareness.setLocalState(state);
            } else {
                awareness.setLocalState({ user: data.user });
            }
        };

        const pageshowListener = (event: PageTransitionEvent) => {
            if (event.persisted === true) {
                reconnect(provider);
            }
        };
        window.addEventListener("pageshow", pageshowListener);
        provider.on("open", () => republishPresence(provider));

        function initialiseProvider(document: Y.Doc) {
            const provider = new HocuspocusProvider({
                url: "/api/collaboration",
                name: data.documentId,
                document: document,
                onStatus: ({ status }) => {
                    connected = status === "connected";
                    if (connected) {
                        connectionError = "";
                    }
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
                    if (!editorElement) {
                        console.error("Tiptap editor element is not available.");
                        return;
                    }

                    editor = new Editor({
                        element: editorElement,
                        extensions: [
                            StarterKit.configure({ undoRedo: false }),
                            Collaboration.configure({ document: ydoc, field: "content" }),
                            Markdown,
                            CollaborationCaret.configure({
                                provider,
                                // collaboration caret requires the name and color of the user to display the caret correctly
                                user: data.user satisfies UserDb & { name: string; color: string },
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

        return () => {
            editor?.destroy();
            editor = null;
            provider.off("awarenessChange", updateConnectedUsers);
            provider.destroy();
            ydoc.destroy();
            connected = false;
            documentLoaded = false;
            window.removeEventListener("pageshow", pageshowListener);
        };
    });
</script>

<!-- top bar -->
<nav class="top-bar-background">
    <div class="top-bar">
        <div class="horizontal-flex">
            <button
                class="document-return-button"
                title="Return to Documents"
                aria-label="Return to Documents"
                onclick={() => {
                    goto(resolve("/app/(authenticated)/documents"));
                }}><Fa class="fa-2x" icon={faFileLines} /></button>
            <h1>Document Editor</h1>
        </div>
        <!-- connection status box -->
        <div class="connection-status">
            <div>
                {#if connected}
                    <h3>Status: Connected</h3>
                {:else}
                    <h3>Status: Disconnected</h3>
                {/if}
            </div>
            <div>
                <span class="connected-users">
                    {connectedUsers.length} connected user{connectedUsers.length === 1 ? "" : "s"}</span>
                <ul class="connected-users">
                    <div class="vertical-flex">
                        {#if connectedUsers.length === 0}
                            <li>No users connected</li>
                        {/if}
                        {#each connectedUsers as user (user.clientId)}
                            <li>{user.name}</li>
                        {/each}
                    </div>
                </ul>
            </div>
        </div>
    </div>
</nav>

{#if connectionError}
    <p role="alert">{connectionError}</p>
{/if}

<hr />

<!-- editor -->
<div class="align-center">
    <div style="max-width: 8.27in;" class="align-left">
        <!-- button to toggle edit mode -->
        <div class="horizontal-flex">
            <button
                class="editor-button"
                title="Change Between Edit and View Mode"
                aria-label="Toggle Edit Mode"
                aria-pressed={inEditMode}
                onclick={toggleEditMode}
                disabled={!connected || !documentLoaded}>
                {#if inEditMode}
                    <Fa icon={faEye} />
                {:else}
                    <Fa icon={faPen} />
                {/if}
            </button>
            <div class="horizontal-flex" style:display={inEditMode ? "flex" : "none"}>
                <button
                    class="editor-button"
                    title="Bold"
                    aria-label="Toggle Bold"
                    onclick={() => {
                        editor?.chain().focus().toggleBold().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faBold} /></button>
                <button
                    class="editor-button"
                    title="Italic"
                    aria-label="Toggle Italic"
                    onclick={() => {
                        editor?.chain().focus().toggleItalic().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faItalic} /></button>
                <button
                    class="editor-button"
                    title="Underline"
                    aria-label="Toggle Underline"
                    onclick={() => {
                        editor?.chain().focus().toggleUnderline().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faUnderline} /></button>
                <button
                    class="editor-button"
                    title="Strikethrough"
                    aria-label="Toggle Strikethrough"
                    onclick={() => {
                        editor?.chain().focus().toggleStrike().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faStrikethrough} /></button>
                <button
                    class="editor-button"
                    title="Ordered List"
                    aria-label="Toggle Ordered List"
                    onclick={() => {
                        editor?.chain().focus().toggleOrderedList().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faListOl} /></button>
                <button
                    class="editor-button"
                    title="Unordered List"
                    aria-label="Toggle Unordered List"
                    onclick={() => {
                        editor?.chain().focus().toggleBulletList().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faListUl} /></button>
                <button
                    class="editor-button"
                    title="Heading 1"
                    aria-label="Toggle Heading 1"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />1</button>
                <button
                    class="editor-button"
                    title="Heading 2"
                    aria-label="Toggle Heading 2"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />2</button>
                <button
                    class="editor-button"
                    title="Heading 3"
                    aria-label="Toggle Heading 3"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />3</button>
                <button
                    class="editor-button"
                    title="Heading 4"
                    aria-label="Toggle Heading 4"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 4 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />4</button>
                <button
                    class="editor-button"
                    title="Heading 5"
                    aria-label="Toggle Heading 5"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 5 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />5</button>
            </div>
        </div>
    </div>
    <!-- editor container -->
    <div class="editor-container">
        <div {@attach attachEditorElement} class="view-element"></div>
    </div>
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    hr {
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .editor-container {
        margin: 10px;
        max-width: 8.27in;
        width: 100%;
    }

    .editor-button {
        width: 35px;
        height: 35px;
        font-size: 1em;
        border-radius: 100%;
        border: none;
        background-color: transparent;
    }

    .editor-button:hover {
        background-color: #f2f2f2;
    }

    .document-return-button {
        width: 50px;
        height: 50px;
        font-size: 2em;
        border-radius: 100%;
        padding-bottom: 5px;
        border: none;
        background-color: transparent;
    }

    .document-return-button:hover {
        background-color: #f2f2f2;
    }

    .view-element {
        min-height: 11.69in;
        border: 1px solid #0f0f0f;
        padding: 30px;
        border-radius: 5px;
    }

    .connection-status {
        margin: 10px;
    }

    .connected-users {
        display: flex;
        align-items: right;
        justify-content: right;
    }

    .vertical-flex {
        display: flex;
        flex-direction: column;
    }

    .horizontal-flex {
        display: flex;
        flex-direction: row;
        gap: 10px;
        flex-wrap: wrap;
    }

    .align-center {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .top-bar-background {
        padding: 10px;
    }

    .top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    /* Give a remote user a caret */
    :global(.collaboration-carets__caret) {
        border-left: 1px solid #0d0d0d;
        border-right: 1px solid #0d0d0d;
        margin-left: -1px;
        margin-right: -1px;
        pointer-events: none;
        position: relative;
        word-break: normal;
    }

    :global(.ProseMirror) {
        min-height: 1200px;
        outline: none !important;
    }

    /* Render the username above the caret */
    :global(.collaboration-carets__label) {
        border-radius: 3px 3px 3px 0;
        color: #0d0d0d;
        font-size: 12px;
        font-style: normal;
        font-weight: 600;
        left: -1px;
        line-height: normal;
        padding: 0.1rem 0.3rem;
        position: absolute;
        top: -1.4em;
        user-select: none;
        white-space: nowrap;
    }
</style>
