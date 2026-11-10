<script lang="ts">
    import { awarenessStateSchema, GLOBAL_PRESENCE_DOCUMENT } from "@kittysync/common";
    import { HocuspocusProvider } from "@hocuspocus/provider";
    import { invalidate } from "$app/navigation";
    import { onDestroy, onMount } from "svelte";
    import { resolve } from "$app/paths";
    let props = $props();
    let data = $derived(props.data);
    let user = $derived(props.data.user);
    let error = $state<string | null>(null);

    /**
        Create a new document.
        @param event - The submit event from the form.
        will prevent the default form submission and send a POST request to create a new document.

    */
    async function createDocument(event: SubmitEvent) {
        event.preventDefault();

        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const title = formData.get("title") as string;
        error = null;
        try {
            const response = await fetch("/api/documents", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ title }),
            });

            if (response.ok) {
                // Document created successfully, reload the page to show the new document
                await invalidate("/api/documents");
            } else {
                console.error("Failed to create document");
                error = "Failed to create document";
            }
        } catch (err) {
            console.error("Error creating document:", err);
            error = "Error creating document" + String(err);
        }
    }

    let userCount = $state(0);

    onMount(() => {
        const provider = new HocuspocusProvider({
            url: "/api/collaboration",
            name: GLOBAL_PRESENCE_DOCUMENT,

            onAwarenessUpdate({ states }) {
                userCount = provider.awareness === null ? -1 : provider.awareness.states.size;
                console.log(provider.awareness!.states);
                console.log(states);
            },

            onDisconnect() {
                userCount = -1;
            },
        });

        provider.on("open", () => {
            const awareness = provider.awareness;
            if (awareness != null) {
                const localState = awareness.getLocalState();
                if (localState != null && awarenessStateSchema.safeParse(localState).success) {
                    awareness.setLocalState(localState);
                }
            }
        });

        provider.attach();
        provider.setAwarenessField("user", user);

        onDestroy(() => {
            provider.destroy();
        });
    });
</script>

<h1>Available Documents</h1>

<p>Online users: {userCount === -1 ? "???" : userCount}</p>

<form method="POST" onsubmit={createDocument}>
    <input type="text" name="title" placeholder="Document Title" required />
    <button type="submit">Create Document</button>
</form>

{error}

<ul>
    {#each data.summaries as summary (summary.id)}
        <li><a href={resolve(`/app/(authenticated)/documents/[id]`, { id: summary.id })}> {summary.title}</a></li>
    {/each}
</ul>
