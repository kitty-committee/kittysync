

<script lang="ts">
    import { resolve } from '$app/paths';
    let { data } = $props();
</script>


<h1>Available Documents</h1>

<ul>
    {#each data.summaries as summary (summary.id)}
        <li><a href={resolve(`/app/(authenticated)/documents/[slug]`, {slug: summary.slug})}> {summary.title}</a></li>
    {/each}
</ul>