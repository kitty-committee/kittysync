<script lang="ts">
    import { userCredentialsSchema } from "@kittysync/common";
    import ZodIssues from "#lib/ZodIssues.svelte";
    import { resolve } from "$app/paths";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";

    import { goto } from "$app/navigation";
    import * as zod from "zod";

    let issues: zod.z.core.$ZodIssue[] = $state([]);

    export const userSchema = zod
        .object({
            repeatPassword: zod.string().trim().min(5).max(255),
        })
        .and(userCredentialsSchema)
        .refine((data) => data.password === data.repeatPassword, {
            message: "Passwords do not match",
            path: ["password-repeat"],
        });

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
                repeatPassword: formData.get("password-repeat"),
            };

            const safeParse = userSchema.safeParse(user);

            if (!safeParse.success) {
                issues = safeParse.error.issues;
                return;
            }

            const response = await fetchApi("auth/user", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ username: formData.get("username"), password: formData.get("password") }),
            });

            if (response.status == 409) {
                error = "Account with that username already created, please use another username.";
            } else if (!response.ok) {
                error = (await response.json()).message;
            } else {
                await goto(resolve("/app/(authenticated)/landing"));
            }
        }}>
        <div class="signup-div">
            <h1>Sign-up</h1>
            <p>Please enter your details below to sign-up</p>

            <p>Did you mean to login instead? Click <a href={resolve("/app/login")}>here!</a></p>

            <label for="username">Username</label>
            <input type="text" placeholder="Enter Username" name="username" required /><br />

            <label for="password">Password</label>
            <input type="password" placeholder="Enter Password" name="password" required /><br />

            <label for="password-repeat">Repeat password</label>
            <input type="password" placeholder="Enter Password" name="password-repeat" required /><br />

            <ZodIssues {issues} />
            {error}
            <div class="button-container">
                <button type="button" class="cancelbtn">Cancel</button>
                <button type="submit" class="signupbtn">Sign Up</button>
            </div>
        </div>
    </form>
</div>
