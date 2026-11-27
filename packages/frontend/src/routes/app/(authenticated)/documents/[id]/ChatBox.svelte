<script lang="ts">
    import { getMessages, getVisibility, sendMessage, toggleVisibility } from "./ai-chatbox.svelte";
    import { faPaperPlane, faWandMagicSparkles } from "@fortawesome/free-solid-svg-icons";
    import { enhance } from "$app/forms";
    import Fa from "svelte-fa";
</script>

<!-- ai chatbox container -->
<div
    style="margin: 20px 10px auto 0px;"
    style:width={getVisibility() ? "500px" : "50px"}
    class="align-vertical-right-col">
    <div class="align-vertical-right-row">
        <!-- ai chatbox button -->
        <button
            class="large-editor-button"
            style="margin-right: 10px;"
            onclick={() => {
                toggleVisibility();
            }}
            ><Fa class="fa-2x" icon={faWandMagicSparkles} />
        </button>
        <!-- ai chatbox -->
        <div
            class="align-vertical-center-col vertical-scrolling"
            style:display={getVisibility() ? "flex" : "none"}
            style="width: 15vw; height: 60vh;">
            {#each getMessages() as message, i (i)}
                <div class="message">{message}</div>
            {/each}
        </div>
    </div>

    <form
        class="align-vertical-center-row"
        style:display={getVisibility() ? "flex" : "none"}
        style="margin: 0px 0px 0px auto; width: 15vw; align-items: end;"
        method="POST"
        use:enhance={async ({ formData, cancel }) => {
            sendMessage(formData.get("content")!.toString());
            cancel();
        }}>
        <textarea class="user-input-message" name="content"></textarea>
        <button class="user-input-button" type="submit" onclick={() => {}}><Fa icon={faPaperPlane} /> </button>
    </form>
</div>

<style>
    .align-vertical-right-col {
        display: flex;
        align-items: right;
        flex-direction: column;
    }

    .align-vertical-right-row {
        display: flex;
        justify-content: right;
        flex-direction: row;
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

    .vertical-scrolling {
        overflow-y: auto;
    }

    .user-input-message {
        padding: 5px;
        width: 100%;
        box-sizing: border-box;
        overflow-wrap: anywhere;
        margin-top: 5px;
        margin-bottom: 5px;
        border: none;
        border-radius: 20px 20px 20px 0;
        background-color: rgb(158, 231, 255);
    }

    .user-input-button {
        padding: 5px;
        margin: auto;
        margin-top: 5px;
        margin-bottom: 5px;
        margin-left: 10px;
        height: 35px;
        width: 35px;
        font-size: 1em;
        border-radius: 100%;
        border: none;
        background-color: rgb(158, 231, 255);
    }
    .user-input-button:hover {
        background-color: rgb(131, 224, 255);
    }

    .message {
        padding: 5px;
        width: 100%;
        margin-top: 5px;
        margin-bottom: 5px;
    }

    .message:nth-child(odd) {
        border-radius: 20px 20px 20px 0;
        background-color: rgb(158, 231, 255);
        text-align: left;
    }
    .message:nth-child(odd)::before {
        content: "HUMAN! ";
    }

    .message:nth-child(even) {
        border-radius: 20px 20px 0 20px;
        background-color: whitesmoke;
        text-align: right;
    }
    .message:nth-child(even)::after {
        content: " ROBOT!";
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
</style>
