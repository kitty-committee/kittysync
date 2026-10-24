

<script lang="ts">
    import { resolve } from '$app/paths';
    let { data } = $props();

    async function createDocument(event: SubmitEvent) {
        event.preventDefault();

        const form = event.currentTarget as HTMLFormElement;
        const formData = new FormData(form);
        const title = formData.get('title') as string;

        try {
            const response = await fetch('/api/document', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ title })
            });

            if (response.ok) {
                // Document created successfully, reload the page to show the new document
                window.location.reload();
            } else {
                console.error('Failed to create document');
            }
        } catch (error) {
            console.error('Error creating document:', error);
        }
    }



</script>


<h1>Available Documents</h1>

<form method="POST" onsubmit={createDocument}>
    <input type="text" name="title" placeholder="Document Title" required />
    <button type="submit">Create Document</button>
</form>
<ul>
    {#each data.summaries as summary (summary.id)}
        <li><a href={resolve(`/app/(authenticated)/documents/[id]`, {id: summary.id})}> {summary.title}</a></li>
    {/each}
</ul>