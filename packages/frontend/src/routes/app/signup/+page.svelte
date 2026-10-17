<script lang="ts">
    import Signup from "./Signup.svelte";
    import { resolve } from "$app/paths";
</script>

<h1>Login Template</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Signup />

<a href={resolve("/app")}>Home</a>
