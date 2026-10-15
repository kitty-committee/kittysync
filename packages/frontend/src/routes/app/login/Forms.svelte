<script lang="ts">
    import { page } from "$app/state";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";
    import * as zod from "zod";
    import ZodIssues from "#lib/ZodIssues.svelte";
    let issues = $state();

    export const userSchema = zod
        .object({
            email: zod.email(),
            password: zod.string(), //Space to make schema more strict for passwords
            repeatPassword: zod.string(),
        })
        .refine((data) => data.password === data.repeatPassword, {
            message: "Passwords do not match",
            path: ["password-repeat"],
        });

    let error = $state();
    const isSignUp = $derived(page.url.searchParams.has("sign-up"));
</script>

<div class="form-container">
    {#if isSignUp}
        <form
            method="POST"
            use:enhance={async ({ formData, cancel }) => {
                var user = {
                    email: formData.get("email"),
                    password: formData.get("password"),
                    repeatPassword: formData.get("password-repeat"),
                };

                const safeParse = userSchema.safeParse(user);

                if (!safeParse.success) {
                    issues = safeParse.error.issues;
                    return;
                }

                const response = await fetchApi("/app/sign-up", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
                });

                if (!response.ok) {
                    error = (await response.json()).body;
                }

                cancel();
            }}>
            <div class="signup-div">
                <h1>Sign-up</h1>
                <p>Please enter your details below to sign-up</p>

                <p>Did you mean to login instead? Click <a href="../login?login">here!</a></p>

                <label for="email">Email</label>
                <input type="text" placeholder="Enter Email" name="email" required /><br />

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
    {:else}
        <form
            method="POST"
            use:enhance={async ({ formData, cancel }) => {
                var user = {
                    email: formData.get("email"),
                    password: formData.get("password"),
                };

                const safeParse = userSchema.safeParse(user);

                if (!safeParse.success) {
                    issues = safeParse.error.issues;
                    return;
                }

                const response = await fetchApi("/app/login", {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({ email: formData.get("email"), password: formData.get("password") }),
                });

                if (!response.ok) {
                    error = (await response.json()).body;
                }

                cancel();
            }}>
            <div class="login-div">
                <h1>Login</h1>
                <p>Please enter your details below to login</p>

                <p>Did you mean to sign-up instead? Click <a href="../login?sign-up">here!</a></p>
                <br />

                <label for="email">Email</label>
                <input type="text" placeholder="Enter Email" name="email" required /><br />

                <label for="password">Password</label>
                <input type="password" placeholder="Enter Password" name="password" required /><br />

                <ZodIssues {issues} />
                {error}
                <div class="button-container">
                    <button type="button" class="submit-button">Submit</button>
                </div>
            </div>
        </form>
    {/if}
</div>
