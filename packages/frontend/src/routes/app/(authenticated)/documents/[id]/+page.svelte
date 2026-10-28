<script lang="ts">
    import { clientboundPacketSchema } from "@kittysync/common";
    import SvelteMarkdown from "@humanspeak/svelte-markdown";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import { page } from "$app/state";
    import { onMount } from "svelte";

    let socket = $state<WebSocket | null>(null);
    let connected = $state(false);
    let documentLoaded = $state(false);
    let userList = $state(0);
    let filecontent = $state("");
    let inEditMode = $state(false);
    let canManuallyRetry = $state(false);
    let retryScheduled = $state(false);
    let retryConnection = $state<() => void>(() => {});

    onMount(() => {
        const fileID = page.params["id"];
        if (!fileID) {
            console.error("File ID is missing.");
            return;
        }

        const protocol = location.protocol === "https:" ? "wss:" : "ws:";
        const url = `${protocol}//${location.host}/api/document/${fileID}/websocket`;

        let currentSocket: WebSocket | null = null;
        const baseRetry = 1000;
        const maxRetry = 30000;
        const maxAutomaticRetries = 5;
        const connectionTimeout = 10000;
        let retryTimer: ReturnType<typeof setTimeout> | undefined;
        let connectionTimer: ReturnType<typeof setTimeout> | undefined;
        let retryCount = 0;
        let disposed = false;

        function scheduleReconnect() {
            if (disposed || retryTimer !== undefined || currentSocket) return;
            if (retryCount >= maxAutomaticRetries) {
                canManuallyRetry = true;
                return;
            }

            const delay = Math.min(baseRetry * 2 ** retryCount, maxRetry);
            retryCount += 1;
            retryScheduled = true;
            retryTimer = setTimeout(() => {
                retryTimer = undefined;
                retryScheduled = false;
                console.log(`Attempting to reconnect... (attempt ${retryCount})`);
                connect();
            }, delay);
        }

        function connect() {
            if (disposed || currentSocket || retryTimer !== undefined) return;

            canManuallyRetry = false;
            try {
                const ws = new WebSocket(url);
                currentSocket = ws;
                socket = ws;

                ws.addEventListener("open", () => {
                    if (disposed || currentSocket !== ws) return;
                    if (connectionTimer !== undefined) {
                        clearTimeout(connectionTimer);
                        connectionTimer = undefined;
                    }
                    connected = true;
                    connected = true;
                    retryCount = 0;
                });

                ws.addEventListener("message", (event) => {
                    if (disposed || currentSocket !== ws) return;
                    console.debug("Received message:", event.data);

                    let raw: unknown;
                    try {
                        raw = JSON.parse(event.data);
                    } catch (error) {
                        console.error("Error parsing packet, malformed JSON:", error);
                        return;
                    }

                    const result = clientboundPacketSchema.safeParse(raw);
                    if (!result.success) {
                        console.error("Received invalid packet: ", result.error);
                        return;
                    }

                    const packet = result.data;
                    switch (packet.type) {
                        case "updateUsers":
                            console.debug("Update users packet received:", packet.data);
                            userList = packet.data.userList.length;
                            break;
                        case "updateFile":
                            console.log("Update file packet received:", packet.data);
                            filecontent = packet.data.file;
                            documentLoaded = true;
                            break;
                        default:
                            console.warn("Unknown packet type received:", packet.type);
                            break;
                    }
                });

                ws.addEventListener("close", () => {
                    if (disposed || currentSocket !== ws) return;
                    if (connectionTimer !== undefined) {
                        clearTimeout(connectionTimer);
                        connectionTimer = undefined;
                    }

                    currentSocket = null;
                    socket = null;
                    connected = false;
                    documentLoaded = false;
                    console.log("WebSocket connection closed. Attempting reconnect...");
                    scheduleReconnect();
                });

                ws.addEventListener("error", (event) => {
                    if (disposed || currentSocket !== ws) return;
                    console.error("WebSocket error:", event);
                });

                connectionTimer = setTimeout(() => {
                    if (disposed || currentSocket !== ws || ws.readyState !== 0) return;
                    console.warn("WebSocket connection timed out.");
                    ws.close();
                }, connectionTimeout);
            } catch (error) {
                console.error("Unable to create WebSocket connection:", error);
                currentSocket = null;
                socket = null;
                scheduleReconnect();
            }
        }

        retryConnection = () => {
            if (retryTimer !== undefined) {
                clearTimeout(retryTimer);
                retryTimer = undefined;
            }
            retryScheduled = false;
            retryCount = 0;
            canManuallyRetry = false;
            connect();
        };

        connect();

        return () => {
            disposed = true;
            if (retryTimer !== undefined) {
                clearTimeout(retryTimer);
            }
            if (connectionTimer !== undefined) {
                clearTimeout(connectionTimer);
            }
            retryTimer = undefined;
            connectionTimer = undefined;
            retryScheduled = false;
            retryConnection = () => {};
            canManuallyRetry = false;

            const ws = currentSocket;
            currentSocket = null;
            socket = null;
            if (ws) ws.close();
        };
    });

    function saveContent(content = filecontent) {
        if (socket && connected && documentLoaded) {
            socket.send(
                JSON.stringify({
                    type: "saveFile",
                    data: { file: content },
                }),
            );
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
        {#if !socket && !retryScheduled && canManuallyRetry}
            <button
                class="ml-2 bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 rounded"
                onclick={retryConnection}>Retry connection</button>
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
            onclick={() => saveContent()}
            disabled={!connected || !documentLoaded}>Save</button>
    </main>
{:else}
    <div><SvelteMarkdown source={filecontent} /></div>
{/if}
