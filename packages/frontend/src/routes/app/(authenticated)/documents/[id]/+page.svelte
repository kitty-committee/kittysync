<script lang="ts">
    import { HocuspocusProvider } from "@hocuspocus/provider";
    import * as Y from "yjs";

    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let connected = $state(false);
    let documentLoaded = $state(false);
    let filecontent = $state("");
    let inEditMode = $state(false);
    let sharedText: Y.Text | null = null;

    onMount(() => {
        const fileID = page.params["id"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }

        const ydoc = new Y.Doc();
        const text = ydoc.getText("markdown");
        sharedText = text;
        const updateFromYjs = () => {
            filecontent = text.toString();
        };

        text.observe(updateFromYjs);

        const provider = new HocuspocusProvider({
            url: "ws://localhost:1234",
            name: fileID,
            document: ydoc,
            onStatus: ({ status }) => {
                connected = status === "connected";
            },
            onSynced: () => {
                updateFromYjs();
                documentLoaded = true;
            },
        });

        return () => {
            text.unobserve(updateFromYjs);
            provider.destroy();
            ydoc.destroy();
            connected = false;
            documentLoaded = false;
        };
    });

    function updateText(next: string) {
        //implement PROPERLY !!! NOT NOT NOT NOT FINAL!!!!
        const text = sharedText;
        if (!text) return;
        const current = text.toString();
        if (current === next) return;

        let start = 0;
        while (start < current.length && start < next.length && current[start] === next[start]) {
            start++;
        }

        let currentEnd = current.length;
        let nextEnd = next.length;
        while (currentEnd > start && nextEnd > start && current[currentEnd - 1] === next[nextEnd - 1]) {
            currentEnd--;
            nextEnd--;
        }

        if (currentEnd > start) {
            text.delete(start, currentEnd - start);
        }
        if (nextEnd > start) {
            text.insert(start, next.slice(start, nextEnd));
        }
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
    }}
    disabled={!connected || !documentLoaded}>Change View</button>
{#if inEditMode}
    <main class="p-4">
        <textarea
            class="w-full h-96 p-2 border border-gray-300 rounded"
            value={filecontent}
            oninput={(e) => {
                updateText(e.currentTarget.value);
            }}
            disabled={!connected || !documentLoaded}></textarea>
    </main>
{:else}
    <div><SvelteMarkdown source={filecontent} /></div>
{/if}
