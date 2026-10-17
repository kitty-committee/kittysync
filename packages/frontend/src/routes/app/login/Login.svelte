<script lang="ts">
    import ZodIssues from "#lib/ZodIssues.svelte";
    import { resolve } from "$app/paths";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";
    import * as zod from "zod";

    let issues: zod.z.core.$ZodIssue[] = $state([]);

    export const userSchema = zod.object({
        email: zod.email(),
        password: zod.string(), //Space to make schema more strict for passwords
    });

    let error = $state();
</script>

<div class="form-container">
    <form
        method="POST"
        use:enhance={async ({ formData, cancel }) => {
            cancel();

            var user = {
                email: formData.get("email"),
                password: formData.get("password"),
            };

            const safeParse = userSchema.safeParse(user);

            if (!safeParse.success) {
                issues = safeParse.error.issues;
                return;
            }

            const response = await fetchApi("/app/auth/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
            });

            if (!response.ok) {
                error = (await response.json()).body;
            }
        }}>
        <div class="login-div">
            <h1>Login</h1>
            <p>Please enter your details below to login</p>

            <p>Did you mean to sign-up instead? Click <a href={resolve("/app/signup")}>here!</a></p>

            <label for="email">Email</label>
            <input type="text" placeholder="Enter Email" name="email" required /><br />

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
