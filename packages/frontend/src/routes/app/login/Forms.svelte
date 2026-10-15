<script lang="ts">
    import { page } from "$app/state";
    import { enhance } from "$app/forms";
    import { fetchApi } from "#lib";
    let error = $state();
    const isSignUp = $derived(page.url.searchParams.has("sign-up"));
</script>

<div class="form-container">
    {#if isSignUp}
        <form
            method="POST"
            use:enhance={async ({ formData, cancel }) => {
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
                <input type="email" placeholder="Enter Email" name="email" required /><br />

                <label for="password">Password</label>
                <input type="password" placeholder="Enter Password" name="password" required /><br />

                <label for="password-repeat">Repeat password</label>
                <input type="password" placeholder="Enter Password" name="password-repeat" required /><br />

                <p>{error}</p>
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
            <div class="login-div">
                <h1>Login</h1>
                <p>Please enter your details below to login</p>

                <p>Did you mean to sign-up instead? Click <a href="../login?sign-up">here!</a></p>
                <br />

                <label for="email">Email</label>
                <input type="text" placeholder="Enter Email" name="email" required /><br />

                <label for="password">Password</label>
                <input type="password" placeholder="Enter Password" name="password" required /><br />

                <p>{error}</p>
                <button type="button" class="submit-button">Submit</button><br />

                <div class="button-container">
                    <button type="button" class="cancel-button">Cancel</button>
                </div>
            </div>
        </form>
    {/if}
</div>
