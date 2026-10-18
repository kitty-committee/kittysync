<script lang="ts">
    import * as z from "zod";

    let { issues }: { issues: z.core.$ZodIssue[] } = $props();
</script>

<ul>
    {#each issues as { message, path } (path)}
        <li>{path[0]} - {message}</li>
    {/each}
</ul>
