<script lang="ts">
    import { onMount } from "svelte";
    import { page } from "$app/state";
    import { packetSchema } from "@kittysync/common";

    let socket = $state<WebSocket | null>(null);
    let connected = $state(false);

    onMount(() => {
        const fileID = page.params["fileID"];
        console.log("File ID:", fileID);
        const url = new URL("ws://localhost:3000/websocket");
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
                    break;
                case "updateFile":
                    console.log("Update file packet received:", packet.data);
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
            }
        };
    });
</script>
