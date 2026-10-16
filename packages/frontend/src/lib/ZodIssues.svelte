<script lang="ts">
    import * as z from "zod";

    let { issues }: { issues: z.core.$ZodIssue[] } = $props();
</script>

<ul>
    {#each issues as { message, path } (message)}
        <li>{path[0]} - {message}</li>
    {/each}
</ul>
