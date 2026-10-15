<script lang="ts">
    import type { ZodIssue } from "zod";

    let { issues }: { issues: ZodIssue[] } = $props();
</script>

<ul>
    {#each issues as { message, path } (message)}
        <li>{path[0]} - {message}</li>
    {/each}
</ul>
