<script lang="ts">
    import { AUTHCAT_CLIENT_ID } from "$app/env/public";
    import { resolve } from "$app/paths";
    import Login from "./Login.svelte";
</script>

<h1>Login Template</h1>
<p>Visit <a href="https://svelte.dev/docs/kit">svelte.dev/docs/kit</a> to read the documentation</p>

<Login />

<button
    onclick={() => {
        window.location.href = `https://auth.nathcat.net/auth?client_id=${AUTHCAT_CLIENT_ID}&response_type=code
`;
    }}>Login with AuthCat</button>

<a href={resolve("/app")}>Home</a>
