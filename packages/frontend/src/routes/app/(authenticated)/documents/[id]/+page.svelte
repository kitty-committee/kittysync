<script lang="ts">
    import { HocuspocusProvider, HocuspocusProviderWebsocket, WebSocketStatus } from "@hocuspocus/provider";
    import { clientboundPacketSchema, YJS_SHARED_TEXT, type AwarenessEditorState } from "@kittysync/common";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { getContext, onDestroy, onMount } from "svelte";
    import type { PageProps } from "./$types";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import * as Y from "yjs";

    let { data }: PageProps = $props();
    let documentSummary = $derived(data.document);
    let user = $derived(data.user!!);

    let documentLoaded = $state(false);
    let inEditMode = $state(false);
    let fileID = $derived(page.params["id"]);
    const getFileID = () => fileID;
    let doc = $state(new Y.Doc());
    let filecontent = $derived(doc.getText(YJS_SHARED_TEXT));
    let provider = $state<HocuspocusProvider | null>(null);
    // :(
    const getProvider = () => provider!!;
    let userList = $derived(provider === null || provider.awareness === null ? -1 : provider.awareness.states.size);

    if (!getFileID()) {
        console.error("File ID is missing!");
    }

    let connected = $derived(
        provider === null ? false : provider.configuration.websocketProvider.status === WebSocketStatus.Connected,
    );

    onMount(() => {
        //const socket = getContext("collaboration-ws") as HocuspocusProviderWebsocket;
        provider = new HocuspocusProvider({
            url: "/api/collaboration",
            name: fileID!!,
            document: doc,

            onSynced() {
                documentLoaded = true;
            },

            onConnect() {
                connected = true;
            },

            onDisconnect() {
                connected = false;
            },

            onAwarenessUpdate({ states }) {
                console.log("Received awareness update");
                console.log(states);

                console.log(getProvider().configuration.websocketProvider.status);

                userList = getProvider().awareness === null ? -1 : getProvider().awareness!.states.size;
                // Probably do something with cursor positions here?
            },
        });

        getProvider().attach();
        getProvider().setAwarenessField("user", user);
        getProvider().setAwarenessField("editor", { inEditMode });
    });

    onDestroy(() => {
        getProvider().destroy();
    });

    const editorState = (): AwarenessEditorState => {
        return { inEditMode };
    };
</script>

<svelte:head>
    <title>{documentSummary.title}</title>
</svelte:head>

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

    <div>
        <span class="mr-4">Users: {userList === -1 ? "???" : userList}</span>
    </div>
</nav>

<!-- button to toggle edit mode. text area contains file content, which can be edited. -->
<button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    onclick={() => {
        inEditMode = !inEditMode;
        getProvider().setAwarenessField("editor", editorState());
    }}
    disabled={!connected || !documentLoaded}>Change View</button>
{#if inEditMode}
    <main class="p-4">
        <textarea
            class="w-full h-96 p-2 border border-gray-300 rounded"
            bind:value={filecontent}
            disabled={!connected || !documentLoaded}></textarea>
        <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onclick={() => alert("Deprecated")}
            disabled={!connected || !documentLoaded}>Save</button>
    </main>
{:else}
    <div><SvelteMarkdown source={filecontent.toString()} /></div>
{/if}
