<script lang="ts">
    import { awarenessStateSchema, type AwarenessState, type UserDb } from "@kittysync/common";
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
    let editorElement = $state<HTMLDivElement | undefined>(undefined);
    let editor: Editor | null = null;
    let markdownContent = $state("");

    type ConnectedUser = {
        clientId: number;
        name: string;
    };

    let { data } = $props();

    let connectedUsers = $state<ConnectedUser[]>([]);

    onMount(() => {
        const ydoc = new Y.Doc();
        //replace with actual username from auth context when frontend helper is made.
        const provider = new HocuspocusProvider({
            url: "/api/collaboration",
            name: data.documentId,
            document: ydoc,
            onStatus: ({ status }) => {
                connected = status === "connected";
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

<!-- navigation bar -->
<nav>
    <button
        onclick={() => {
            goto(resolve("/app/(authenticated)/documents"));
        }}>Back</button>

    <h1>Document Editor</h1>
    <div>
        {#if connected}
            <span>Connected</span>
        {:else}
            <span>Disconnected</span>
        {/if}
    </div>
    <div>
        <span>{connectedUsers.length} connected user{connectedUsers.length === 1 ? "" : "s"}</span>
        <ul>
            {#each connectedUsers as user (user.clientId)}
                <li>{user.name}</li>
            {/each}
        </ul>
    </div>
</nav>

<!-- button to toggle edit mode. text area contains file content, which can be edited. -->
<button
    onclick={() => {
        inEditMode = !inEditMode;
        editor?.setEditable(inEditMode);
    }}
    disabled={!connected || !documentLoaded}>Change View</button>

<div style:display={inEditMode ? "block" : "none"}>
    <div bind:this={editorElement} aria-hidden={!inEditMode} class="editorelement"></div>
</div>

{#if !inEditMode}
    <div><SvelteMarkdown source={markdownContent} /></div>
{/if}

<style>
    .editorelement {
        min-height: 300px;
        border: 1px solid #0f0f0f;
        padding: 10px;
        color: white;
        border-radius: 5px;
        background-color: #343434;
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
