<script lang="ts">
    import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
    import { Collaboration } from "@tiptap/extension-collaboration";
    import { HocuspocusProvider } from "@hocuspocus/provider";
    import StarterKit from "@tiptap/starter-kit";
    import { Markdown } from "@tiptap/markdown";
    import { Editor } from "@tiptap/core";
    import * as Y from "yjs";

    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import type { UserDb } from "@kittysync/common";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";
    import { fetchApi } from "#lib";

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

    let connectedUsers = $state<ConnectedUser[]>([]);

    const HIGHLIGHT_COLOURS = [
        "#FDE68A", // soft yellow
        "#A7F3D0", // mint green
        "#BFDBFE", // soft blue
        "#FBCFE8", // pink
        "#DDD6FE", // lavender
        "#FED7AA", // peach
        "#BAE6FD", // sky blue
        "#D9F99D", // lime
        "#FECACA", // soft red
        "#C7D2FE", // periwinkle
        "#E9D5FF", // soft purple
        "#F5D0FE", // orchid
        "#CCFBF1", // pale teal
        "#D1FAE5", // pale emerald
        "#FEF3C7", // cream yellow
        "#FFE4E6", // rose
        "#E0E7FF", // light indigo
        "#E2E8F0", // soft slate
        "#F3E8FF", // pale violet
        "#FFEDD5", // light apricot
        "#ECFCCB", // pale chartreuse
        "#CFFAFE", // pale cyan
        "#FCE7F3", // light blush
        "#EDE9FE", // soft lavender
        "#FEE2E2", // pale coral
        "#D1F5E0", // soft seafoam
        "#E0F2FE", // ice blue
        "#FAE8FF", // pale magenta
        "#F1F5D8", // pale sage
        "#FDF2F8", // powder pink
    ];

    onMount(() => {
        const fileID = page.params["id"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }
        let username = "John Doe";

        //fetch username from backend using auth token. there might be a better implementation of this i havent considered.
        async function fetchUsername() {
            try {
                const response = await fetchApi("auth/session?session");
                if (!response.ok) {
                    console.error("Failed to fetch username:", response.statusText);
                    return;
                }

                const user: UserDb = await response.json();
                username = user.username;
                editor?.commands.updateUser({
                    name: username,
                    color: getrandomhighlightcolour(username),
                });
            } catch (error) {
                console.error("Error fetching username:", error);
                return;
            }
        }

        fetchUsername();

        const ydoc = new Y.Doc();
        //replace with actual username from auth context when frontend helper is made.
        const provider = new HocuspocusProvider({
            url: "ws://localhost:1234",
            name: fileID,
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
                            user: {
                                name: username,
                                color: getrandomhighlightcolour(username),
                            },
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
            for (const [clientId, state] of provider.awareness.getStates()) {
                const user = state["user"];

                if (typeof user !== "object" || user === null || !("name" in user) || typeof user.name !== "string") {
                    continue;
                }

                users.push({ clientId, name: user.name });
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

    function getrandomhighlightcolour(name: string) {
        let hash = 0;
        for (let i = 0; i < name.length; i++) {
            hash += name.charCodeAt(i);
        }
        return HIGHLIGHT_COLOURS[Math.floor(hash % HIGHLIGHT_COLOURS.length)];
    }
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
        border-radius: 5px;
        background-color: #e7e7e7;
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
