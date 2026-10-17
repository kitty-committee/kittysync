<script lang="ts">
    import { resolve } from "$app/paths";
    import Login from "./Login.svelte";
</script>

<h1>Login Template</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Login />

<a href={resolve("/app")}>Home</a>
