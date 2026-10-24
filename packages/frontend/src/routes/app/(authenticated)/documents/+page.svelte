

<script lang="ts">
    import { resolve } from '$app/paths';
    let { data } = $props();
</script>


<h1>Available Documents</h1>

<form method="POST">
    <input type="text" name="title" placeholder="Document Title" required />
    <button type="submit">Create Document</button>
</form>
<ul>
    {#each data.summaries as summary (summary.id)}
        <li><a href={resolve(`/app/(authenticated)/documents/[slug]`, {slug: summary.slug})}> {summary.title}</a></li>
    {/each}
</ul>