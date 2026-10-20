<script lang="ts">

    import { onMount } from 'svelte';
    import { page } from '$app/state';

    let socket = $state<WebSocket | null>(null);
    let connected = $state(false);

    onMount(() => {
        const fileID = page.params['fileID'];
        console.log("File ID:", fileID);
        const url = new URL("ws://localhost:3000/websocket");
        url.searchParams.set("fileID", fileID);

        socket = new WebSocket(url.toString());

        socket.addEventListener('open', () => {
            connected = true;
            console.log("WebSocket connection established.");
        });

        socket.addEventListener('message', (event) => {
            console.log("Received message:", event.data);
        });

        socket.addEventListener('close', () => {
            connected = false;
            console.log("WebSocket connection closed.");
        });

        socket.addEventListener('error', (event) => {
            console.error("WebSocket error:", event);
        });

        return() => {
            if (socket) {
                socket.close();
                socket = null;
                connected = false;
            }
        }

    })



</script>