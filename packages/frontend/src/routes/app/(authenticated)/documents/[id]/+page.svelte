<script lang="ts">
    let { data } = $props();
</script>


<h1>{data.document.title}</h1>
<div>{data.document.content}</div>