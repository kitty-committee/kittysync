<script lang="ts">
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

    onMount(() => {
        console.log("document page mounted", performance.now());

        const fileID = page.params["id"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }

        const ydoc = new Y.Doc();

        console.log("creating provider", performance.now());
        const provider = new HocuspocusProvider({
            url: "ws://localhost:1234",
            name: fileID,
            document: ydoc,
            onStatus: ({ status }) => {
                console.log("Hocuspocus status", status, performance.now());
                connected = status === "connected";
            },
            onOpen: () => {
                console.log("WS opened", performance.now());
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
</script>

<!-- tiptap editor initialisation -->

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

<div bind:this={editorElement} hidden={!inEditMode} class="min-h-96 border border-gray-300 rounded p-2"></div>
{#if !inEditMode}
    <div><SvelteMarkdown source={markdownContent} /></div>
{/if}
