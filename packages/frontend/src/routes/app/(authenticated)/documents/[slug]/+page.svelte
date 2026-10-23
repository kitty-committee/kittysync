<script lang="ts">
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { packetSchema } from "@kittysync/common";
    //import { goto } from "$app/navigation";
    //import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let socket = $state<WebSocket | null>(null);
    let connected = $state(false);
    let userList = $state(0);
    let filecontent = $state("");
    let inEditMode = $state(false);

    onMount(() => {
        const fileID = page.params["slug"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }
        console.log("File ID:", fileID);
        const url = new URL("ws://localhost:3000/api/websocket");
        url.searchParams.set("fileID", fileID);

        socket = new WebSocket(url.toString());
        const ws = socket;

        ws.addEventListener("open", () => {
            connected = true;
            console.log("WebSocket connection established.");
            ws.send(JSON.stringify({ type: "open", data: null }));
        });

        ws.addEventListener("message", (event) => {
            console.log("Received message:", event.data);

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
            console.log("Valid packet:", packet);

            // Handle the packet based on its type
            switch (packet.type) {
                case "updateUsers":
                    console.log("Update users packet received:", packet.data);
                    if (packet.data !== null && "userList" in packet.data && Array.isArray(packet.data.userList)) {
                        userList = packet.data.userList.length;
                    }
                    break;
                case "updateFile":
                    console.log("Update file packet received:", packet.data);
                    if (typeof packet.data === "object" && packet.data !== null && "file" in packet.data) {
                        filecontent = packet.data.file;
                    } else {
                        filecontent = "";
                    }
                    break;
                default:
                    console.warn("Unknown packet type received:", packet.type);
            }
        });

        ws.addEventListener("close", () => {
            connected = false;
            console.log("WebSocket connection closed.");
        });

        ws.addEventListener("error", (event) => {
            console.error("WebSocket error:", event);
        });

        return () => {
            if (socket) {
                socket.close();
                socket = null;
                connected = false;
                console.log(connected);
            }
        };
    });

    function saveContent(event: Event) {
        const target = event.currentTarget;

        if (target instanceof HTMLTextAreaElement) {
            if (socket && connected) {
                socket.send(
                    JSON.stringify({
                        type: "saveFile",
                        data: { file: target.value },
                    }),
                );
            }
        }
    }
</script>

<nav class="flex items-center justify-between p-4 bg-gray-800 text-white">
    <button
        class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
        onclick={() => {
            //goto(resolve("/app/(authenticated)/documents"));
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
<button
    class="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    onclick={() => {
        inEditMode = !inEditMode;
    }}>Change View</button>
{#if inEditMode}
    <main class="p-4">
        <textarea class="w-full h-96 p-2 border border-gray-300 rounded" bind:value={filecontent} oninput={saveContent}>
        </textarea>
    </main>
{:else}
    <div><SvelteMarkdown source={filecontent} /></div>
{/if}
