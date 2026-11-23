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
    import { Collaboration } from "@tiptap/extension-collaboration";
    import { HocuspocusProvider } from "@hocuspocus/provider";
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
                });
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
    <div style="width: 8.27in;" class="align-left">
        <!-- button to toggle edit mode -->
        <div class="horizontal-flex">
            <button
                class="editor-button"
                title="Bold"
                onclick={() => {
                    inEditMode = !inEditMode;
                    editor?.setEditable(inEditMode);
                }}
                disabled={!connected || !documentLoaded}>
                {#if inEditMode}
                    <Fa icon={faPen} />
                {:else}
                    <Fa icon={faEye} />
                {/if}
            </button>
            <div class="horizontal-flex" style:display={inEditMode ? "flex" : "none"}>
                <button
                    class="editor-button"
                    title="Bold"
                    onclick={() => {
                        editor?.chain().focus().toggleBold().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faBold} /></button>
                <button
                    class="editor-button"
                    title="Italic"
                    onclick={() => {
                        editor?.chain().focus().toggleItalic().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faItalic} /></button>
                <button
                    class="editor-button"
                    title="Underline"
                    onclick={() => {
                        editor?.chain().focus().toggleUnderline().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faUnderline} /></button>
                <button
                    class="editor-button"
                    title="Strikethrough"
                    onclick={() => {
                        editor?.chain().focus().toggleStrike().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faStrikethrough} /></button>
                <button
                    class="editor-button"
                    title="Ordered List"
                    onclick={() => {
                        editor?.chain().focus().toggleOrderedList().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faListOl} /></button>
                <button
                    class="editor-button"
                    title="Unordered List"
                    onclick={() => {
                        editor?.chain().focus().toggleBulletList().run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faListUl} /></button>
                <button
                    class="editor-button"
                    title="Heading 1"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 1 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />1</button>
                <button
                    class="editor-button"
                    title="Heading 2"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 2 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />2</button>
                <button
                    class="editor-button"
                    title="Heading 3"
                    onclick={() => {
                        editor?.chain().focus().toggleHeading({ level: 3 }).run();
                    }}
                    disabled={!connected || !documentLoaded}><Fa icon={faHeading} />3</button>
            </div>
        </div>
    </div>
    <!-- editor container -->
    <div class="editor-container">
        <div {@attach attachEditorElement} aria-hidden={!inEditMode} class="view-element"></div>
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

    .editor-button {
        width: 30px;
        height: 30px;
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
