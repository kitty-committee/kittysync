<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { packetSchema } from "@kittysync/common";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let socket = $state<WebSocket | null>(null);
    let connected = $state(false);
    let userList = $state(0);
    let filecontent = $state("");
    let inEditMode = $state(false);
    let debounceTimeout: ReturnType<typeof setTimeout>;

    onMount(() => {
        const fileID = page.params["id"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }

        socket = new WebSocket(`/api/documents/${fileID}/websocket`);
        const ws = socket;

        // Handle incoming messages from the WebSocket
        ws.addEventListener("message", (event) => {
            console.debug("Received message:", event.data);

            let raw: unknown;
            try {
                raw = JSON.parse(event.data);
            } catch (error) {
                console.error("Error parsing packet, malformed JSON:", error);
                return;
            }

            const result = packetSchema.safeParse(raw);
            if (!result.success) {
                console.error("Received invalid packet: ", result.error);
                return;
            }

            const packet = result.data;

            // Handle the packet based on its type
            switch (packet.type) {
                // handle updated user list
                case "updateUsers":
                    console.debug("Update users packet received:", packet.data);
                    userList = packet.data.userList.length;
                    break;
                // handle updated file content
                case "updateFile":
                    console.log("Update file packet received:", packet.data);
                    filecontent = packet.data.file;
                    break;
                // display error if unknown type
                default:
                    console.warn("Unknown packet type received:", packet.type);
            }
        });

        // Handle WebSocket close and error events
        ws.addEventListener("close", () => {
            connected = false;
            console.log("WebSocket connection closed.");
        });

        // Handle WebSocket error events
        ws.addEventListener("error", (event) => {
            console.error("WebSocket error:", event);
        });

        // Cleanup function to close the WebSocket when the component is destroyed
        return () => {
            if (socket) {
                socket.close();
                socket = null;
                connected = false;
            }
        };
    });

    function saveContent(content = filecontent) {
        clearTimeout(debounceTimeout);
        if (socket && connected) {
            socket.send(
                JSON.stringify({
                    type: "saveFile",
                    data: { file: content },
                }),
            );
        }
    }

    function handleContentInput(event: Event) {
        const target = event.currentTarget;
        if (target instanceof HTMLTextAreaElement) {
            clearTimeout(debounceTimeout);
            debounceTimeout = setTimeout(() => saveContent(target.value), 100);
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

    <div>
        <span class="mr-4">Users: {userList}</span>
    </div>
</nav>

<!-- button to toggle edit mode. text area contains file content, which can be edited. -->
<button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    onclick={() => {
        inEditMode = !inEditMode;
    }}>Change View</button>
{#if inEditMode}
    <main class="p-4">
        <textarea
            class="w-full h-96 p-2 border border-gray-300 rounded"
            bind:value={filecontent}
            oninput={handleContentInput}>
        </textarea>
        <button
            class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
            onclick={() => saveContent()}
            disabled={!connected}>Save</button>
    </main>
{:else}
    <div><SvelteMarkdown source={filecontent} /></div>
{/if}
