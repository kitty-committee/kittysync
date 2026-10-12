<script lang="ts">
    let { signup } = $props();
</script>

<div class="form-container">
    {#if signup === true}
    <div class="signup-div">

    </div>
    {:else}
    <div class="login-div">

    </div>
    {/if}
</div>