<script lang="ts">
    let { data } = $props();
</script>


<h1>Available Documents</h1>

<ul>
    {#each data.summaries as summary (summary.id)}
        <li><a href="/app/documents/{summary.slug}">{summary.title}</a></li>
    {/each}
</ul>