<script lang="ts">
    import {
        faBold,
        faItalic,
        faUnderline,
        faStrikethrough,
        faListOl,
        faListUl,
        faHeading,
        faEye,
        faPen,
    } from "@fortawesome/free-solid-svg-icons";
    import { faFileLines } from "@fortawesome/free-regular-svg-icons";
    import { KittySyncEditor } from "./editor.svelte.js";
    import ChatBox from "./ChatBox.svelte";
    import { goto } from "$app/navigation";
    import { resolve } from "$app/paths";
    import Fa from "svelte-fa";

    let { data } = $props();

    // svelte-ignore state_referenced_locally
    const editor = new KittySyncEditor({ user: data.user, editing: false });
</script>

<!-- top bar -->
<nav class="top-bar-background">
    <div class="top-bar">
        <div class="horizontal-flex">
            <button
                class="large-editor-button"
                title="Return to Documents"
                aria-label="Return to Documents"
                onclick={() => {
                    goto(resolve("/app/(authenticated)/documents"));
                }}><Fa class="fa-2x" icon={faFileLines} /></button>
            <h1>Document Editor</h1>
        </div>
        <!-- connection status box -->
        <div class="connection-status">
            <div>
                {#if editor.connected}
                    <h3>Status: Connected</h3>
                {:else}
                    <h3>Status: Disconnected</h3>
                {/if}
            </div>
            <div>
                <span class="connected-users"
                    >{editor.peers.length} connected user{editor.peers.length === 1 ? "" : "s"}</span>
                <ul class="connected-users">
                    <div class="vertical-flex">
                        {#each editor.peers as user (user.clientId)}
                            <li>{user.name}</li>
                        {:else}
                            <li>No users connected</li>
                        {/each}
                    </div>
                </ul>
            </div>
        </div>
    </div>
</nav>

{#if editor.error}
    <p role="alert">{editor.error}</p>
{/if}

<hr />

<!-- editor -->
<div class="align-vertical-center-row">
    <!-- document editor container -->
    <div class="align-vertical-center-col" style="width: 50vw; margin: auto auto auto 25vw;">
        <div
            class="align-vertical-center-col"
            style="max-width: 8.27in; 
                width: 100%; ">
            <div class="align-vertical-center-col">
                <div>
                    <!-- horizontal bar of buttons -->
                    <div class="horizontal-flex">
                        <button
                            class="editor-button"
                            title="Change Between Edit and View Mode"
                            aria-label="Toggle Edit Mode"
                            aria-pressed={editor.editable}
                            onclick={() => (editor.editable = !editor.editable)}
                            disabled={!editor.ready}>
                            {#if editor.editable}
                                <Fa icon={faEye} />
                            {:else}
                                <Fa icon={faPen} />
                            {/if}
                        </button>
                        <div class="horizontal-flex" style:display={editor.editable ? "flex" : "none"}>
                            <button
                                class="editor-button"
                                title="Bold"
                                aria-label="Toggle Bold"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleBold().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faBold} /></button>
                            <button
                                class="editor-button"
                                title="Italic"
                                aria-label="Toggle Italic"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleItalic().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faItalic} /></button>
                            <button
                                class="editor-button"
                                title="Underline"
                                aria-label="Toggle Underline"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleUnderline().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faUnderline} /></button>
                            <button
                                class="editor-button"
                                title="Strikethrough"
                                aria-label="Toggle Strikethrough"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleStrike().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faStrikethrough} /></button>
                            <button
                                class="editor-button"
                                title="Ordered List"
                                aria-label="Toggle Ordered List"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleOrderedList().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faListOl} /></button>
                            <button
                                class="editor-button"
                                title="Unordered List"
                                aria-label="Toggle Unordered List"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleBulletList().run();
                                }}
                                disabled={!editor.ready}><Fa icon={faListUl} /></button>
                            <button
                                class="editor-button"
                                title="Heading 1"
                                aria-label="Toggle Heading 1"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleHeading({ level: 1 }).run();
                                }}
                                disabled={!editor.ready}><Fa icon={faHeading} />1</button>
                            <button
                                class="editor-button"
                                title="Heading 2"
                                aria-label="Toggle Heading 2"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleHeading({ level: 2 }).run();
                                }}
                                disabled={!editor.ready}><Fa icon={faHeading} />2</button>
                            <button
                                class="editor-button"
                                title="Heading 3"
                                aria-label="Toggle Heading 3"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleHeading({ level: 3 }).run();
                                }}
                                disabled={!editor.ready}><Fa icon={faHeading} />3</button>
                            <button
                                class="editor-button"
                                title="Heading 4"
                                aria-label="Toggle Heading 4"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleHeading({ level: 4 }).run();
                                }}
                                disabled={!editor.ready}><Fa icon={faHeading} />4</button>
                            <button
                                class="editor-button"
                                title="Heading 5"
                                aria-label="Toggle Heading 5"
                                onclick={() => {
                                    editor.editor.chain().focus().toggleHeading({ level: 5 }).run();
                                }}
                                disabled={!editor.ready}><Fa icon={faHeading} />5</button>
                        </div>
                    </div>
                </div>
            </div>
            <!-- editor container -->
            <div class="editor-container">
                <div {@attach editor.attach(data.documentId)} class="view-element"></div>
            </div>
        </div>
    </div>
    <ChatBox />
</div>

<style>
    * {
        margin: 0;
        padding: 0;
        box-sizing: border-box;
    }

    hr {
        margin-top: 10px;
        margin-bottom: 10px;
    }

    .editor-container {
        margin: 10px;
        max-width: 8.27in;
        width: 100%;
    }

    .editor-button {
        width: 35px;
        height: 35px;
        font-size: 1em;
        border-radius: 100%;
        border: none;
        background-color: transparent;
    }

    .editor-button:hover {
        background-color: #f2f2f2;
    }

    .large-editor-button {
        width: 50px;
        height: 50px;
        font-size: 2em;
        border-radius: 100%;
        padding-bottom: 5px;
        border: none;
        background-color: transparent;
    }

    .large-editor-button:hover {
        background-color: #f2f2f2;
    }

    .view-element {
        min-height: 11.69in;
        border: 1px solid #0f0f0f;
        padding: 30px;
        border-radius: 5px;
    }

    .connection-status {
        margin: 10px;
    }

    .connected-users {
        display: flex;
        align-items: right;
        justify-content: right;
    }

    .vertical-flex {
        display: flex;
        flex-direction: column;
    }

    .horizontal-flex {
        display: flex;
        flex-direction: row;
        gap: 10px;
        flex-wrap: wrap;
    }

    .align-vertical-center-col {
        display: flex;
        align-items: center;
        flex-direction: column;
    }

    .align-vertical-center-row {
        display: flex;
        justify-content: center;
        flex-direction: row;
    }

    .top-bar-background {
        padding: 10px;
    }

    .top-bar {
        display: flex;
        align-items: center;
        justify-content: space-between;
    }

    /* Give a remote user a caret */
    :global(.collaboration-carets__caret) {
        border-left: 1px solid #0d0d0d;
        border-right: 1px solid #0d0d0d;
        margin-left: -1px;
        margin-right: -1px;
        pointer-events: none;
        position: relative;
        word-break: normal;
    }

    :global(.ProseMirror) {
        min-height: 1200px;
        outline: none !important;
    }

    /* Render the username above the caret */
    :global(.collaboration-carets__label) {
        border-radius: 3px 3px 3px 0;
        color: #0d0d0d;
        font-size: 12px;
        font-style: normal;
        font-weight: 600;
        left: -1px;
        line-height: normal;
        padding: 0.1rem 0.3rem;
        position: absolute;
        top: -1.4em;
        user-select: none;
        white-space: nowrap;
    }
</style>
