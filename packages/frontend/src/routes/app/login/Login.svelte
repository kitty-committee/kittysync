<script lang="ts">
    import { userCredentialsSchema } from "@kittysync/common";
    import ZodIssues from "#lib/ZodIssues.svelte";
    import { match, resolve } from "$app/paths";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";

    const returnPage = sessionStorage.getItem("return-page");

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
            var user = {
                username: formData.get("username"),
                password: formData.get("password"),
            };

            const safeParse = userCredentialsSchema.safeParse(user);

            if (!safeParse.success) {
                issues = safeParse.error.issues;
                return;
            }

            const response = await fetchApi("auth/session", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
            });

            if (response.status == 401) {
                error = "Invalid password, please try again.";
            } else if (!response.ok) {
                error = (await response.json()).message;
            } else {
                if (returnPage != null) {
                    const matched = await match(returnPage);
                    console.log(returnPage);
                    console.log(matched?.id);
                    if (matched) {
                        await goto(resolve(matched.id));
                    } else {
                        await goto(resolve("/app/(authenticated)/landing"));
                    }
                }
            }
        }}>
        <div class="login-div">
            <h1>Login</h1>
            <p>Please enter your details below to login</p>

            <p>Did you mean to sign-up instead? Click <a href={resolve("/app/signup")}>here!</a></p>

            <label for="username">Username</label>
            <input type="text" placeholder="Enter Username" name="username" required /><br />

            <label for="password">Password</label>
            <input type="password" placeholder="Enter Password" name="password" required /><br />

            <ZodIssues {issues} />
            {error}
            <div class="button-container">
                <button type="submit" class="loginbtn">Login</button>
            </div>
        </div>
    </form>
</div>
