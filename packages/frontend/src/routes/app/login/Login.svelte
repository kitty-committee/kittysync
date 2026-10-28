<script lang="ts">
    import { userCredentialsSchema } from "@kittysync/common";
    import ZodIssues from "#lib/ZodIssues.svelte";
    import { match, resolve } from "$app/paths";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";

    import { goto } from "$app/navigation";
    import * as zod from "zod";

    let issues: zod.z.core.$ZodIssue[] = $state([]);

    let error = $state();
</script>

<div class="form-container">
    <form
        method="POST"
        use:enhance={async ({ formData, cancel }) => {
            cancel();
            error = [];
            issues = [];
            const safeParse = userCredentialsSchema.safeParse(Object.fromEntries(formData.entries()));

            if (!safeParse.success) {
                issues = safeParse.error.issues;
                return;
            }

            const response = await fetchApi("auth/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(safeParse.data),
            });

            if (response.status == 401) {
                error = "Invalid password, please try again.";
            } else if (!response.ok) {
                issues = await response.json();
            } else {
                const returnPage = sessionStorage.getItem("return-page");
                if (returnPage === null) await goto(resolve("/app/(authenticated)/documents"));
                else {
                    const matched = await match(returnPage);
                    sessionStorage.removeItem("return-page");
                    // @ts-expect-error - resolve does't realise that id and params are related https://github.com/sveltejs/kit/issues/17552
                    if (matched) goto(resolve(matched.id, matched.params));
                    else goto(resolve("/app/(authenticated)/documents"));
                }
            }
        }}>
        <div class="login-div">
            <h1>Login</h1>
            <p>Please enter your details below to login</p>

            <p>Did you mean to sign-up instead? Click <a href={resolve("/app/signup")}>here!</a></p>

            <label for="username">Username</label>
            <input type="text" placeholder="Enter Username" name="username" id="username" required /><br />

            <label for="password">Password</label>
            <input type="password" placeholder="Enter Password" name="password" id="password" required /><br />

            <ZodIssues {issues} />
            {error}
            <div class="button-container">
                <button type="submit" class="loginbtn">Login</button>
            </div>
        </div>
    </form>
</div>
