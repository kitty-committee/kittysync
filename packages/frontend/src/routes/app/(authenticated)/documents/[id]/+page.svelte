<script lang="ts">
    import { CollaborationCaret } from "@tiptap/extension-collaboration-caret";
    import { Collaboration } from "@tiptap/extension-collaboration";
    import { HocuspocusProvider } from "@hocuspocus/provider";
    import StarterKit from "@tiptap/starter-kit";
    import { Markdown } from "@tiptap/markdown";
    import { Editor } from "@tiptap/core";
    import * as Y from "yjs";

    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let connected = $state(false);
    let documentLoaded = $state(false);
    let inEditMode = $state(false);
    let editorElement = $state<HTMLDivElement | undefined>(undefined);
    let editor: Editor | null = null;
    let markdownContent = $state("");

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
        const ydoc = new Y.Doc();
        //replace with actual username from auth context when frontend helper is made.
        let username = "John Doe";
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

        return () => {
            editor?.destroy();
            editor = null;
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
<nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
    <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onclick={() => {
            goto(resolve("/app/(authenticated)/documents"));
        }}>Back</button>

    <h1 class="text-xl font-bold">Document Editor</h1>
    <div>
        {#if connected}
            <span class="text-green-500">Connected</span>
        {:else}
            <span class="text-red-500">Disconnected</span>
        {/if}
    </div>
</nav>

<!-- button to toggle edit mode. text area contains file content, which can be edited. -->
<button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    onclick={() => {
        inEditMode = !inEditMode;
        editor?.setEditable(inEditMode);
    }}
    disabled={!connected || !documentLoaded}>Change View</button>
<div style:display={inEditMode ? "block" : "none"} class="rounded border border-blue-400 bg-blue-50 p-2">
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
        position: relative;
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
