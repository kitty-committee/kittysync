<script lang="ts">
    import type { HocuspocusProviderWebsocket } from "@hocuspocus/provider";
    import { createWebsocket } from "#lib/collaboration/index.ts";
    import { onDestroy, onMount, setContext } from "svelte";
    import type { LayoutProps } from "./$types";

    let hocusSocket: HocuspocusProviderWebsocket;

    let { children }: LayoutProps = $props();
    /*
    onMount(() => {
        console.log("Initialising collaboration websocket");
        hocusSocket = createWebsocket();
        setContext("collaboration-ws", hocusSocket);
    });

    onDestroy(() => {
        console.log("Destroying collaboration websocket");
        hocusSocket.destroy();
    });*/
</script>

{@render children()}
