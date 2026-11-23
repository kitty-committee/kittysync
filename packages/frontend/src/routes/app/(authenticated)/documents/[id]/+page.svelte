<script lang="ts">
    import {
        SOCKET_ERROR_UNBOUND_CONNECTION,
        SOCKET_ERROR_UNSUPPORTED_MESSAGE,
        awarenessStateSchema,
        type AwarenessState,
        type UserDb,
    } from "@kittysync/common";
    import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
    import { Collaboration } from "@tiptap/extension-collaboration";
    import { HocuspocusProvider } from "@hocuspocus/provider";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import StarterKit from "@tiptap/starter-kit";
    import { Markdown } from "@tiptap/markdown";
    import { goto } from "$app/navigation";
    import { Editor } from "@tiptap/core";
    import { resolve } from "$app/paths";
    import { onMount } from "svelte";
    import * as Y from "yjs";

    let connected = $state(false);
    let documentLoaded = $state(false);
    let inEditMode = $state(false);
    let connectionError = $state("");
    let editorElement = $state<HTMLDivElement | undefined>(undefined);
    let editor: Editor | null = null;
    let markdownContent = $state("");

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

    onMount(() => {
        const ydoc = new Y.Doc();
        //replace with actual username from auth context when frontend helper is made.
        const provider = new HocuspocusProvider({
            url: "/api/collaboration",
            name: data.documentId,
            document: ydoc,
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

                    onUpdate: ({ editor }) => {
                        markdownContent = editor.getMarkdown();
                    },
                });
                markdownContent = editor.getMarkdown();
                documentLoaded = true;
            },
        });

        provider.on("open", () => {
            const awareness = provider.awareness;
            if (awareness != null) {
                const localState = awareness.getLocalState();
                if (localState != null && awarenessStateSchema.safeParse(localState).success) {
                    awareness.setLocalState(localState);
                }
            }
        });

        const updateConnectedUsers = () => {
            if (provider.awareness == null) {
                console.error("Provider awareness is not available.");
                return;
            }

            const users: ConnectedUser[] = [];
            for (const [clientId, s] of provider.awareness.getStates()) {
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

        provider.on("awarenessChange", updateConnectedUsers);
        updateConnectedUsers();

        return () => {
            editor?.destroy();
            editor = null;
            provider.off("awarenessChange", updateConnectedUsers);
            provider.destroy();
            ydoc.destroy();
            connected = false;
            documentLoaded = false;
        };
    });
</script>

<!-- top bar -->
<nav class="top-bar-background">
    <div class="top-bar">
        <div class="vertical-flex">
            <h1>Document Editor</h1>
            <button
                style="width: fit-content;"
                onclick={() => {
                    goto(resolve("/app/(authenticated)/documents"));
                }}>Back</button>
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
    <!-- button to toggle edit mode -->
    <div class="horizontal-flex">
        <button
            onclick={() => {
                inEditMode = !inEditMode;
                editor?.setEditable(inEditMode);
            }}
            disabled={!connected || !documentLoaded}>Change View</button>
        <div>
            {#if !inEditMode}
                <h3>View Mode</h3>
            {:else}
                <h3>Edit Mode</h3>
            {/if}
        </div>
    </div>
    <!-- editor container -->
    <div class="editor-container">
        <div style:display={inEditMode ? "block" : "none"}>
            <div {@attach attachEditorElement} aria-hidden={!inEditMode} class="editor-element"></div>
        </div>

        {#if !inEditMode}
            <div class="view-element"><SvelteMarkdown source={markdownContent} /></div>
        {/if}
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
        width: 8.27in;
    }

    .editor-element {
        min-height: 11.69in;
        border: 1px solid #0f0f0f;
        padding: 10px;
        color: white;
        border-radius: 5px;
        background-color: #343434;
    }

    .view-element {
        min-height: 11.69in;
        border: 1px solid #0f0f0f;
        padding: 10px;
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

    :global(.editorelement > .ProseMirror) {
        min-height: 300px;
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
